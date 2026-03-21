// app/api/gazette/batches/route.ts
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
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { data, error } = await supabase
    .from('gazette_batches')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ batches: data });
}

export async function PATCH(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const body = await req.json();
  const { batchId, is_active } = body;

  if (!batchId) return NextResponse.json({ error: 'batchId required' }, { status: 400 });

  const { error } = await supabase
    .from('gazette_batches')
    .update({ is_active })
    .eq('id', batchId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getServiceClient();
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const body = await req.json();

  if (body.recordId) {
    // Delete single record
    const { error } = await supabase.from('gazette_records').delete().eq('id', body.recordId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.gazetteNumber && body.batchId) {
    // Delete all records for a gazette number in a batch
    const { error } = await supabase
      .from('gazette_records')
      .delete()
      .eq('batch_id', body.batchId)
      .eq('gazette_number', body.gazetteNumber);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (body.batchId) {
    // Delete whole batch (cascade deletes records)
    const { error } = await supabase.from('gazette_batches').delete().eq('id', body.batchId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'No valid delete target provided' }, { status: 400 });
}
