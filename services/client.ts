import { createAdminClient } from '@/lib/supabase/admin';
import type { Transfer, ClientBalance, BalanceTransaction, ClientTransferFormData } from '@/types';
import { generateTransferCode } from '@/lib/utils';

export async function getClientBalance(clientId: string): Promise<ClientBalance | null> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('client_balances')
    .select('*')
    .eq('client_id', clientId)
    .single();

  if (error) return null;
  return data as ClientBalance;
}

export async function getClientTransactions(clientId: string, limit: number = 50): Promise<BalanceTransaction[]> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('balance_transactions')
    .select('*')
    .eq('agent_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as BalanceTransaction[];
}

export async function createClientTransfer(
  data: ClientTransferFormData,
  senderId: string
): Promise<{ success: boolean; transfer?: Transfer; error?: string }> {
  const adminClient = createAdminClient();

  try {
    const { data: balance, error: balanceError } = await adminClient
      .from('client_balances')
      .select('balance')
      .eq('client_id', senderId)
      .single();

    if (balanceError || !balance) {
      return { success: false, error: 'No se encontró el saldo del cliente' };
    }

    if (balance.balance < data.amount) {
      return { success: false, error: 'Saldo insuficiente para realizar la transferencia' };
    }

    const transferCode = generateTransferCode();

    const { data: senderData } = await adminClient
      .from('users')
      .select('name, phone')
      .eq('id', senderId)
      .single();

    const { data: transfer, error: transferError } = await adminClient
      .from('transfers')
      .insert({
        transfer_code: transferCode,
        transfer_type: 'client',
        sender_id: senderId,
        sender_name: senderData?.name || 'Unknown',
        sender_phone: senderData?.phone || '',
        receiver_name: data.receiver_name,
        receiver_phone: data.receiver_phone,
        destination_city: data.destination_city,
        destination_country: data.destination_country,
        amount: data.amount,
        currency: data.currency,
        status: 'completed',
        notes: data.notes,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transferError) {
      return { success: false, error: transferError.message };
    }

    const previousBalance = balance.balance;
    const newBalance = previousBalance - data.amount;

    await adminClient
      .from('client_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('client_id', senderId);

    await adminClient
      .from('balance_transactions')
      .insert({
        agent_id: senderId,
        type: 'transfer',
        amount: -data.amount,
        previous_balance: previousBalance,
        new_balance: newBalance,
        reference_id: transfer.id,
        reference_type: 'client_transfer',
        description: `Transferencia cliente: ${transferCode}`,
      });

    await adminClient
      .from('activity_logs')
      .insert({
        user_id: senderId,
        action: 'create_client_transfer',
        entity_type: 'transfer',
        entity_id: transfer.id,
        metadata: { transfer_code: transferCode, amount: data.amount },
      });

    return { success: true, transfer };
  } catch (error) {
    console.error('Client transfer error:', error);
    return { success: false, error: 'Error al crear la transferencia' };
  }
}

export async function getClientTransfers(clientId: string, limit: number = 50) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('transfers')
    .select('*')
    .eq('sender_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Transfer[];
}

export async function topUpClientBalance(
  clientId: string, 
  amount: number,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  const { data: currentBalance, error: fetchError } = await adminClient
    .from('client_balances')
    .select('balance')
    .eq('client_id', clientId)
    .single();

  let previousBalance = 0;
  let newBalance = amount;

  if (fetchError || !currentBalance) {
    const { error: insertError } = await adminClient
      .from('client_balances')
      .insert({
        client_id: clientId,
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
      .from('client_balances')
      .update({ 
        balance: newBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('client_id', clientId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  }

  await adminClient
    .from('balance_transactions')
    .insert({
      agent_id: clientId,
      type: 'topup',
      amount: amount,
      previous_balance: previousBalance,
      new_balance: newBalance,
      description: description || `Depósito de saldo`,
    });

  return { success: true };
}
