// app/api/admin/blocking/batches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Database not configured');
  return createClient(url, key);
}

async function requireAuth(req: NextRequest): Promise<boolean> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

// GET — list all batches
export async function GET(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('blocked_domains_batches')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ batches: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — activate or deactivate a batch
export async function PATCH(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { batchId, is_active } = await req.json();

    if (!batchId || typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // If activating, deactivate all others first
    if (is_active) {
      await supabase
        .from('blocked_domains_batches')
        .update({ is_active: false })
        .eq('is_active', true);
    }

    const { error } = await supabase
      .from('blocked_domains_batches')
      .update({ is_active })
      .eq('id', batchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — remove a batch and all its rows
export async function DELETE(req: NextRequest) {
  if (!await requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { batchId } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: 'batchId required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Delete rows first (foreign key integrity)
    const { error: rowError } = await supabase
      .from('blocked_domains')
      .delete()
      .eq('batch_id', batchId);

    if (rowError) {
      return NextResponse.json({ error: rowError.message }, { status: 500 });
    }

    // Then delete batch record
    const { error: batchError } = await supabase
      .from('blocked_domains_batches')
      .delete()
      .eq('id', batchId);

    if (batchError) {
      return NextResponse.json({ error: batchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: batchId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
