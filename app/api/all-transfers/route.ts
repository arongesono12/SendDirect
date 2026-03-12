import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('transfers')
      .select('*, agent:users!transfers_agent_id_fkey(name, phone)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[GET /api/all-transfers]', err);
    return NextResponse.json([], { status: 500 });
  }
}
