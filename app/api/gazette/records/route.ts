// app/api/gazette/records/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function getUser(req: NextRequest) {
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

// GET /api/gazette/records?batchId=xxx&search=yyy&page=1&limit=50
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get('batchId');
  const search = searchParams.get('search') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const offset = (page - 1) * limit;

  if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

  let query = supabase
    .from('gazette_records')
    .select('*', { count: 'exact' })
    .eq('batch_id', batchId)
    .order('gazette_date', { ascending: true })
    .order('id', { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(
      `person_name.ilike.%${search}%,organism.ilike.%${search}%,change_type.ilike.%${search}%,post_or_position.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ records: data, total: count ?? 0, page, limit });
}

// PATCH /api/gazette/records — update a single record
export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const body = await req.json();
  const { recordId, fields } = body;

  if (!recordId || !fields || typeof fields !== 'object') {
    return NextResponse.json({ error: 'recordId and fields required' }, { status: 400 });
  }

  // Whitelist editable fields
  const EDITABLE: string[] = [
    'gazette_number', 'gazette_type', 'gazette_date', 'decree_number',
    'change_type', 'change_label',
    'person_name', 'post_or_position', 'institution', 'organism',
    'is_military_person', 'military_rank', 'is_military_post', 'summary',
  ];

  const update: Record<string, unknown> = {};
  for (const key of EDITABLE) {
    if (key in fields) update[key] = (fields as Record<string, unknown>)[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('gazette_records')
    .update(update)
    .eq('id', recordId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
