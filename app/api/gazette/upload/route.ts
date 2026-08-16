// app/api/gazette/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { getLabelForChangeType } from '@/components/gaceta/gaceta-utils';

const EXPECTED_HEADERS = [
  'gazette_number', 'gazette_type', 'gazette_date', 'decree_number',
  'change_type', 'person_name', 'post_or_position', 'institution',
  'organism', 'is_military_person', 'military_rank', 'is_military_post', 'summary',
];

// RFC 4180 state-machine CSV parser — handles quoted fields with embedded commas
function parseCSV(text: string): Record<string, string>[] {
  const cleaned = text.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM

  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === '"') {
      if (inQuotes && cleaned[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip CR
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  if (lines.length < 2) return [];

  function splitLine(line: string): string[] {
    const fields: string[] = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        fields.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field);
    return fields;
  }

  const headers = splitLine(lines[0]).map((h) => h.trim());

  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(`Missing CSV headers: ${missing.join(', ')}`);
  }

  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const vals = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i]?.trim() ?? ''; });
    return row;
  });
}

export async function POST(req: NextRequest) {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const label = (formData.get('label') as string | null) || null;

    if (!file || !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'A .csv file is required' }, { status: 400 });
    }

    const text = await file.text();
    let rows: Record<string, string>[];

    try {
      rows = parseCSV(text);
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Failed to parse CSV' }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV contains no data rows' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // `gazette_date` is DATE NOT NULL, and Postgres rejects an ENTIRE multi-row
    // INSERT if any single row violates it. Previously a handful of rows with a
    // blank date silently destroyed every other row in their 100-row chunk.
    // Validate up front so bad rows are reported, not paid for by their
    // neighbours.
    const isValidDate = (s: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

    type Skipped = { line: number; gazette_number: string; reason: string };
    const skipped: Skipped[] = [];
    const valid: { line: number; row: Record<string, string> }[] = [];

    rows.forEach((r, idx) => {
      const line = idx + 2; // +1 for the header row, +1 for 1-based numbering
      const gazetteNumber = r.gazette_number || '(none)';
      const date = (r.gazette_date || '').trim();

      if (!date) {
        skipped.push({ line, gazette_number: gazetteNumber, reason: 'missing gazette_date' });
      } else if (!isValidDate(date)) {
        skipped.push({
          line,
          gazette_number: gazetteNumber,
          reason: `invalid gazette_date "${date}" (expected YYYY-MM-DD)`,
        });
      } else {
        valid.push({ line, row: r });
      }
    });

    if (valid.length === 0) {
      return NextResponse.json(
        {
          error: `No importable rows: all ${rows.length} row(s) failed validation.`,
          skipped,
        },
        { status: 400 }
      );
    }

    const { data: batch, error: batchError } = await supabase
      .from('gazette_batches')
      // row_count is corrected to the true inserted total once the load finishes.
      .insert({ label, source_file: file.name, row_count: valid.length, is_active: false })
      .select('id')
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Failed to create batch: ' + (batchError?.message || 'unknown') },
        { status: 500 }
      );
    }

    const toRecord = (r: Record<string, string>) => ({
      batch_id: batch.id,
      gazette_number: parseInt(r.gazette_number) || 0,
      gazette_type: r.gazette_type || 'Ordinaria',
      gazette_date: r.gazette_date,
      decree_number: r.decree_number || null,
      change_type: r.change_type,
      change_label: getLabelForChangeType(r.change_type),
      person_name: r.person_name || null,
      post_or_position: r.post_or_position || null,
      institution: r.institution || null,
      organism: r.organism || null,
      is_military_person: r.is_military_person?.toUpperCase() === 'SI',
      military_rank: r.military_rank || null,
      is_military_post: r.is_military_post?.toUpperCase() === 'SI',
      summary: r.summary || null,
    });

    const CHUNK_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
      const slice = valid.slice(i, i + CHUNK_SIZE);
      const chunk = slice.map((v) => toRecord(v.row));

      const { error: insertError } = await supabase.from('gazette_records').insert(chunk);
      if (!insertError) {
        insertedCount += chunk.length;
        continue;
      }

      // Something in this chunk still failed a constraint we didn't anticipate.
      // Retry row-by-row so the rest of the chunk survives and we can name the
      // exact offender instead of losing 100 rows to a console.error.
      console.error(`Chunk insert failed at offset ${i}: ${insertError.message} — retrying individually`);
      for (let j = 0; j < chunk.length; j++) {
        const { error: rowError } = await supabase.from('gazette_records').insert(chunk[j]);
        if (rowError) {
          skipped.push({
            line: slice[j].line,
            gazette_number: String(chunk[j].gazette_number),
            reason: rowError.message,
          });
        } else {
          insertedCount++;
        }
      }
    }

    // Keep the batch's advertised size honest: it must equal what is actually
    // stored, or the dashboard reports a total it can never display.
    if (insertedCount !== valid.length) {
      await supabase
        .from('gazette_batches')
        .update({ row_count: insertedCount })
        .eq('id', batch.id);
    }

    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      rows_inserted: insertedCount,
      total_rows: rows.length,
      rows_skipped: skipped.length,
      skipped: skipped.slice(0, 50),
      skipped_truncated: skipped.length > 50,
    });
  } catch (err: any) {
    console.error('Gazette upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
