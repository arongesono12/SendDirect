import { createAdminClient } from '@/lib/supabase/admin';
import type { DashboardStats, DailyTransferStats, AgentTransferStats } from '@/types';
import { calculateCommission } from '@/lib/tariffs';

export async function getAgentDashboardStats(agentId: string): Promise<DashboardStats> {
  const adminClient = createAdminClient();

  const { data: balances } = await adminClient
    .from('agent_balances')
    .select('balance, currency')
    .eq('agent_id', agentId)
    ;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  const { data: todayTransfers } = await adminClient
    .from('transfers')
    .select('id, amount')
    .eq('agent_id', agentId)
    .gte('created_at', todayStr)
    .eq('status', 'completed');
  const { data: allTransfers } = await adminClient
    .from('transfers')
    .select('id, amount')
    .eq('agent_id', agentId)
    .eq('status', 'completed');
  const { data: clients } = await adminClient
    .from('transfers')
    .select('sender_phone')
    .eq('agent_id', agentId);

  // Build currency-aware balances
  const perCurrency: Record<string, number> = {};
  balances?.forEach((b: any) => {
    const cur = b?.currency || 'XAF';
    perCurrency[cur] = (perCurrency[cur] ?? 0) + Number(b?.balance ?? 0);
  });

  const totalBalance = Object.values(perCurrency).reduce((a, b) => a + b, 0);
  const uniqueClients = new Set((clients ?? []).map((c: any) => c.sender_phone));

  const totalCommission = (allTransfers ?? []).reduce((sum, t) => {
    return sum + calculateCommission(Number(t.amount));
  }, 0);

  const todayCommission = (todayTransfers ?? []).reduce((sum, t) => {
    return sum + calculateCommission(Number(t.amount));
  }, 0);

  const completedCount = allTransfers?.length || 0;
  const commissionPerTransfer = completedCount > 0 ? totalCommission / completedCount : 0;

  return {
    totalBalance,
    todayTransfers: todayTransfers?.length || 0,
    totalSent: allTransfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    totalClients: uniqueClients.size,
    balancesByCurrency: perCurrency,
    totalCommission,
    todayCommission,
    commissionPerTransfer,
  };
}

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  const adminClient = createAdminClient();

  const { data: balances } = await adminClient
    .from('agent_balances')
    .select('balance, currency');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const { data: todayTransfers } = await adminClient
    .from('transfers')
    .select('id')
    .gte('created_at', todayStr)
    .eq('status', 'completed');

  const { data: allTransfers } = await adminClient
    .from('transfers')
    .select('amount')
    .eq('status', 'completed');

  const { data: todayAllTransfers } = await adminClient
    .from('transfers')
    .select('amount')
    .gte('created_at', todayStr)
    .eq('status', 'completed');

  const { data: allUsers } = await adminClient
    .from('users')
    .select('id')
    .eq('role', 'cliente');

  // Currency-wise aggregation
  const perCurrency: Record<string, number> = {};
  balances?.forEach((b: any) => {
    const cur = b?.currency || 'XAF';
    perCurrency[cur] = (perCurrency[cur] ?? 0) + Number(b?.balance ?? 0);
  });

  const totalBalance = Object.values(perCurrency).reduce((a, b) => a + b, 0);

  const totalCommission = (allTransfers ?? []).reduce((sum, t) => {
    return sum + calculateCommission(Number(t.amount));
  }, 0);

  const todayCommission = (todayAllTransfers ?? []).reduce((sum, t) => {
    return sum + calculateCommission(Number(t.amount));
  }, 0);

  const completedCount = allTransfers?.length || 0;
  const commissionPerTransfer = completedCount > 0 ? totalCommission / completedCount : 0;

  return {
    totalBalance,
    todayTransfers: todayTransfers?.length || 0,
    totalSent: allTransfers?.reduce((sum, t) => sum + Number(t.amount), 0) || 0,
    totalClients: allUsers?.length || 0,
    balancesByCurrency: perCurrency,
    totalCommission,
    todayCommission,
    commissionPerTransfer,
  };
}

export async function getDailyTransferStats(days: number = 30): Promise<DailyTransferStats[]> {
  const adminClient = createAdminClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const { data, error } = await adminClient
    .from('transfers')
    .select('created_at, amount')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  const dailyMap = new Map<string, { count: number; amount: number; agents: Set<string> }>();

  data?.forEach((transfer) => {
    const date = new Date(transfer.created_at).toISOString().split('T')[0];
    const existing = dailyMap.get(date) || { count: 0, amount: 0, agents: new Set() };
    existing.count += 1;
    existing.amount += Number(transfer.amount);
    dailyMap.set(date, existing);
  });

  const result: DailyTransferStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayData = dailyMap.get(dateStr);
    result.push({
      date: dateStr,
      transfer_count: dayData?.count || 0,
      total_amount: dayData?.amount || 0,
      agent_count: dayData?.agents?.size || 0,
    });
  }

  return result;
}

export async function getAgentTransferStats(): Promise<AgentTransferStats[]> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from('transfers')
    .select('agent_id, amount, created_at, users!transfers_agent_id_fkey(name)')
    .eq('status', 'completed');

  if (error) throw error;

  const agentMap = new Map<string, AgentTransferStats>();

  data?.forEach((transfer) => {
    const existing = agentMap.get(transfer.agent_id);
    if (existing) {
      existing.transfer_count += 1;
      existing.total_sent += Number(transfer.amount);
      if (new Date(transfer.created_at) > new Date(existing.last_transfer)) {
        existing.last_transfer = transfer.created_at;
      }
    } else {
      agentMap.set(transfer.agent_id, {
        agent_id: transfer.agent_id,
        agent_name: (transfer as unknown as { users?: { name: string } }).users?.name || 'Unknown',
        transfer_count: 1,
        total_sent: Number(transfer.amount),
        last_transfer: transfer.created_at,
      });
    }
  });

  return Array.from(agentMap.values()).sort((a, b) => b.total_sent - a.total_sent);
}

export async function getRecentTransfers(limit: number = 10, agentId?: string) {
  const adminClient = createAdminClient();

  let query = adminClient
    .from('transfers')
    .select('*, agent:users!transfers_agent_id_fkey(name)')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (agentId) {
    query = query.eq('agent_id', agentId);
  }

  const { data, error } = await query.limit(limit);

  if (error) throw error;
  return data;
}

export async function getAgentsCommissionStats() {
  const adminClient = createAdminClient();

  const { data: transfers, error } = await adminClient
    .from('transfers')
    .select('agent_id, amount, created_at, users!transfers_agent_id_fkey(name)')
    .eq('status', 'completed');

  if (error) throw error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  const agentMap = new Map<string, {
    agent_id: string;
    agent_name: string;
    total_commission: number;
    today_commission: number;
    transfer_count: number;
  }>();

  transfers?.forEach((transfer) => {
    const agentId = transfer.agent_id;
    const commission = calculateCommission(Number(transfer.amount));
    const isToday = new Date(transfer.created_at) >= new Date(todayStr);
    const agentName = (transfer as unknown as { users?: { name: string } }).users?.name || 'Unknown';

    const existing = agentMap.get(agentId);
    if (existing) {
      existing.total_commission += commission;
      existing.transfer_count += 1;
      if (isToday) {
        existing.today_commission += commission;
      }
    } else {
      agentMap.set(agentId, {
        agent_id: agentId,
        agent_name: agentName,
        total_commission: commission,
        today_commission: isToday ? commission : 0,
        transfer_count: 1,
      });
    }
  });

  const agents = Array.from(agentMap.values());
  const totalCommissionAll = agents.reduce((sum, a) => sum + a.total_commission, 0);
  const todayCommissionAll = agents.reduce((sum, a) => sum + a.today_commission, 0);

  return {
    agents: agents.sort((a, b) => b.total_commission - a.total_commission),
    totalCommission: totalCommissionAll,
    todayCommission: todayCommissionAll,
  };
}
