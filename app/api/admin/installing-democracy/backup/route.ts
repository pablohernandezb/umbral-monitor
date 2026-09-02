import { NextResponse } from 'next/server'
import { createAdminClient, getCurrentUser } from '@/lib/supabase-server'

/**
 * Installing Democracy module backup — emits a .sql file of INSERT statements
 * that can be pasted straight into the Supabase SQL Editor to rebuild the
 * module after a loss.
 *
 * SECURITY
 *  - Auth-gated: this contains expert PII (names, emails), so an unauthenticated
 *    request gets a 401 and nothing else.
 *  - `monitoring_experts.access_code` is deliberately emitted as NULL. The code
 *    is the expert's ONLY credential — there is no password — so a backup file
 *    carrying codes would be a credential store for every approved expert.
 *    Restoring therefore leaves approved experts without a working code until
 *    the admin hits "Regenerate" on each and re-sends it. That is the intended
 *    trade: a leaked backup must not grant anyone access.
 */

/** Tables in dependency order — parents before the rows that reference them. */
const EXPORT_ORDER = [
  'transition_checklist',
  'monitoring_experts',
  'transition_evaluations',
  'transition_comments',
  'transition_save_log',
] as const

/** Columns are listed explicitly so a later schema addition can't silently
 *  change the shape of the emitted INSERTs. */
const COLUMNS: Record<string, string[]> = {
  transition_checklist: [
    'id', 'pillar', 'month', 'sort_order',
    'action_es', 'action_en', 'indicator_es', 'indicator_en',
    'responsible_es', 'responsible_en', 'actors', 'status',
    'evidence_es', 'evidence_en', 'sources', 'completed_date',
    'is_alert', 'created_at', 'updated_at',
  ],
  monitoring_experts: [
    'id', 'name', 'email', 'institution', 'status',
    'access_code', 'admin_note', 'created_at', 'approved_at',
  ],
  transition_evaluations: ['id', 'evaluator_id', 'action_id', 'score', 'updated_at'],
  transition_comments: ['id', 'evaluator_id', 'action_id', 'body', 'created_at', 'updated_at'],
  transition_save_log: [
    'id', 'evaluator_id', 'saved_count', 'cleared_count',
    'scores', 'cleared_ids', 'created_at',
  ],
}

/** Render one JS value as a Postgres literal. */
function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  // Objects and arrays in these tables are all JSONB columns (actors, sources,
  // scores, cleared_ids) — never Postgres arrays, so JSON is the right cast.
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`
  }
  return `'${String(value).replace(/'/g, "''")}'`
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const stamp = new Date().toISOString()
  const lines: string[] = [
    '-- ============================================================',
    '-- UMBRAL — "Installing Democracy" module backup',
    `-- Generated: ${stamp}`,
    '--',
    '-- HOW TO RESTORE',
    '--   Paste this whole file into the Supabase SQL Editor and run it. The',
    '--   tables are emitted parent-first, so foreign keys resolve in order.',
    '--   Every statement uses ON CONFLICT (id) DO NOTHING, so re-running is',
    '--   safe and will not duplicate rows that already survived.',
    '--',
    '-- ACCESS CODES ARE NOT INCLUDED.',
    '--   monitoring_experts.access_code is emitted as NULL on purpose: the',
    '--   code is each expert\'s only credential, so a backup carrying them',
    '--   would grant access to anyone who obtained this file. After a restore,',
    '--   open /admin/installing-democracy/experts and press "Regenerate" on',
    '--   each approved expert, then re-send them their new code.',
    '-- ============================================================',
    '',
  ]

  const counts: Record<string, number> = {}

  for (const table of EXPORT_ORDER) {
    const columns = COLUMNS[table]
    const { data, error } = await supabase.from(table).select(columns.join(','))

    if (error) {
      return NextResponse.json(
        { error: `Failed reading ${table}: ${error.message}` },
        { status: 500 }
      )
    }

    const rows = (data ?? []) as unknown as Record<string, unknown>[]
    counts[table] = rows.length

    lines.push(`-- ---------- ${table} (${rows.length} rows) ----------`)
    if (rows.length === 0) {
      lines.push('-- (empty)', '')
      continue
    }

    for (const row of rows) {
      const values = columns.map(col => {
        // Never emit a live credential — see the security note above.
        if (table === 'monitoring_experts' && col === 'access_code') return 'NULL'
        return sqlLiteral(row[col])
      })
      lines.push(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT (id) DO NOTHING;`
      )
    }
    lines.push('')
  }

  lines.push(
    '-- ---------- verify after restore ----------',
    ...EXPORT_ORDER.map(t => `SELECT '${t}' AS table_name, COUNT(*) AS rows FROM ${t};`),
    '',
    `-- Row counts at backup time: ${EXPORT_ORDER.map(t => `${t}=${counts[t]}`).join(', ')}`,
    ''
  )

  const filename = `umbral-installing-democracy-backup-${stamp.slice(0, 10)}.sql`

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'application/sql; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // A backup is a point-in-time snapshot — never let a proxy serve a stale one.
      'Cache-Control': 'no-store',
    },
  })
}
