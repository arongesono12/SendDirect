import { createAdminClient } from '@/lib/supabase/admin';
import type { User, AgentBalance, BalanceTransaction, AgentWithBalance } from '@/types';

export async function getAgents(): Promise<AgentWithBalance[]> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('users')
    .select(`
      *,
      agent_balances (balance, currency)
    `)
    .eq('role', 'gestor')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((user) => {
    const balanceRecord = user.agent_balances;
    let balance = 0;
    
    if (balanceRecord) {
      if (Array.isArray(balanceRecord)) {
        balance = balanceRecord[0]?.balance || 0;
      } else {
        balance = balanceRecord.balance || 0;
      }
    }
    
    return {
      ...user,
      balance,
    };
  }) as AgentWithBalance[];
}

export async function getAgentById(agentId: string): Promise<AgentWithBalance | null> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('users')
    .select(`
      *,
      agent_balances (balance, currency)
    `)
    .eq('id', agentId)
    .single();

  if (error) return null;

  const balanceRecord = data.agent_balances;
  let balance = 0;
  
  if (balanceRecord) {
    if (Array.isArray(balanceRecord)) {
      balance = balanceRecord[0]?.balance || 0;
    } else {
      balance = balanceRecord.balance || 0;
    }
  }

  return {
    ...data,
    balance,
  } as AgentWithBalance;
}

export async function getAgentBalance(agentId: string): Promise<AgentBalance | null> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('agent_balances')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  if (error) return null;
  return data as AgentBalance;
}

export async function topUpAgentBalance(
  agentId: string, 
  amount: number,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  const { data: currentBalance, error: fetchError } = await adminClient
    .from('agent_balances')
    .select('balance')
    .eq('agent_id', agentId)
    .single();

  let previousBalance = 0;
  let newBalance = amount;

  if (fetchError || !currentBalance) {
    const { error: insertError } = await adminClient
      .from('agent_balances')
      .insert({
        agent_id: agentId,
        balance: amount,
        currency: 'XAF',
      });

    if (insertError) {
      return { success: false, error: 'Error al crear el registro de saldo' };
    }
  } else {
    previousBalance = currentBalance.balance || 0;
    newBalance = previousBalance + amount;

    const { error: updateError } = await adminClient
      .from('agent_balances')
      .update({ 
        balance: newBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('agent_id', agentId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  }

  await adminClient
    .from('balance_transactions')
    .insert({
      agent_id: agentId,
      type: 'topup',
      amount: amount,
      previous_balance: previousBalance,
      new_balance: newBalance,
      description: description || `Recarga de saldo`,
    });

  await adminClient
    .from('activity_logs')
    .insert({
      user_id: agentId,
      action: 'topup',
      entity_type: 'balance',
      metadata: { amount, previous_balance: previousBalance, new_balance: newBalance },
    });

  return { success: true };
}

export async function getAgentTransactions(agentId: string, limit: number = 50): Promise<BalanceTransaction[]> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('balance_transactions')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as BalanceTransaction[];
}

export async function toggleAgentStatus(agentId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from('users')
    .update({ is_active: isActive })
    .eq('id', agentId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getAllUsers(): Promise<User[]> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as User[];
}

export async function resetAgentBalance(
  agentId: string,
  adminId: string,
  newBalance: number = 0
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  const { data: currentBalance, error: fetchError } = await adminClient
    .from('agent_balances')
    .select('balance')
    .eq('agent_id', agentId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    return { success: false, error: 'Error al obtener el saldo actual' };
  }

  const previousBalance = currentBalance?.balance || 0;

  if (fetchError || !currentBalance) {
    const { error: insertError } = await adminClient
      .from('agent_balances')
      .insert({
        agent_id: agentId,
        balance: newBalance,
        currency: 'XAF',
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    await adminClient
      .from('balance_transactions')
      .insert({
        agent_id: agentId,
        type: 'reset',
        amount: newBalance,
        previous_balance: 0,
        new_balance: newBalance,
        description: `Restablecimiento de saldo por administrador`,
      });

    return { success: true };
  }

  const { error: updateError } = await adminClient
    .from('agent_balances')
    .update({ 
      balance: newBalance, 
      updated_at: new Date().toISOString() 
    })
    .eq('agent_id', agentId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await adminClient
    .from('balance_transactions')
    .insert({
      agent_id: agentId,
      type: 'reset',
      amount: newBalance - previousBalance,
      previous_balance: previousBalance,
      new_balance: newBalance,
      description: `Restablecimiento de saldo por administrador. Anterior: ${previousBalance}, Nuevo: ${newBalance}`,
    });

  await adminClient
    .from('activity_logs')
    .insert({
      user_id: adminId,
      action: 'reset_agent_balance',
      entity_type: 'balance',
      entity_id: agentId,
      metadata: { previous_balance: previousBalance, new_balance: newBalance, agent_id: agentId },
    });

  return { success: true };
}
