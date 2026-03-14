// app/api/blocking/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const EXPECTED_HEADERS = [
  'site', 'domain', 'category', 'CANTV', 'Movistar',
  'Digitel', 'Inter', 'Netuno', 'Airtek', 'G-Network',
];

function parseCSV(text: string) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());

  // Validate headers
  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(`Missing CSV headers: ${missing.join(', ')}`);
  }

  return lines.slice(1).map((line) => {
    const vals = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = vals[i]?.trim() || 'ok';
    });
    return row;
  });
}

export async function POST(req: NextRequest) {
  // Validate admin authentication via Supabase session
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
      return NextResponse.json(
        { error: 'A .csv file is required' },
        { status: 400 }
      );
    }

    const text = await file.text();
    let rows: Record<string, string>[];

    try {
      rows = parseCSV(text);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || 'Failed to parse CSV' },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'CSV contains no data rows' },
        { status: 400 }
      );
    }

    // Use service role client for admin writes
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Deactivate all current batches
    await supabase
      .from('blocked_domains_batches')
      .update({ is_active: false })
      .eq('is_active', true);

    // 2. Create new batch
    const { data: batch, error: batchError } = await supabase
      .from('blocked_domains_batches')
      .insert({
        label,
        source_file: file.name,
        row_count: rows.length,
        is_active: true,
      })
      .select('id')
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Failed to create batch: ' + (batchError?.message || 'unknown') },
        { status: 500 }
      );
    }

    // 3. Insert rows in chunks of 100
    const CHUNK_SIZE = 100;
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE).map((r) => ({
        batch_id: batch.id,
        site: r.site,
        domain: r.domain,
        category: r.category,
        cantv: r.CANTV || 'ok',
        movistar: r.Movistar || 'ok',
        digitel: r.Digitel || 'ok',
        inter: r.Inter || 'ok',
        netuno: r.Netuno || 'ok',
        airtek: r.Airtek || 'ok',
        g_network: r['G-Network'] || 'ok',
      }));

      const { error: insertError } = await supabase
        .from('blocked_domains')
        .insert(chunk);

      if (insertError) {
        console.error(
          `Chunk insert error at offset ${i}:`,
          insertError.message
        );
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
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
