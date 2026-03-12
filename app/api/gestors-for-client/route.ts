import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: transfers, error } = await adminClient
      .from('transfers')
      .select('agent_id, agent:users!transfers_agent_id_fkey(id, name, phone, email)')
      .eq('sender_id', user.id)
      .eq('status', 'completed');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const agentMap = new Map();
    (transfers || []).forEach((t: any) => {
      if (t.agent && !agentMap.has(t.agent.id)) {
        agentMap.set(t.agent.id, t.agent);
      }
    });

    const agents = Array.from(agentMap.values()).map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
    }));

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Gestors API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
