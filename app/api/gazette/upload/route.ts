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

    const { data: batch, error: batchError } = await supabase
      .from('gazette_batches')
      .insert({ label, source_file: file.name, row_count: rows.length, is_active: false })
      .select('id')
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Failed to create batch: ' + (batchError?.message || 'unknown') },
        { status: 500 }
      );
    }

    const CHUNK_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE).map((r) => ({
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
      }));

      const { error: insertError } = await supabase.from('gazette_records').insert(chunk);
      if (insertError) {
        console.error(`Chunk insert error at offset ${i}:`, insertError.message);
      } else {
        insertedCount += chunk.length;
      }
    }

    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      rows_inserted: insertedCount,
      total_rows: rows.length,
    });
  } catch (err: any) {
    console.error('Gazette upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
