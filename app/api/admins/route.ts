import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('users')
      .select('id, name, email, avatar_url, role')
      .eq('role', 'admin')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[GET /api/admins]', err);
    return NextResponse.json([], { status: 500 });
  }
}
