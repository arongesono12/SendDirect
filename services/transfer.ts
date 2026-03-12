import { createAdminClient } from '@/lib/supabase/admin';
import type { Transfer, TransferFormData, Notification } from '@/types';
import { generateTransferCode } from '@/lib/utils';

async function sendTransferSMS(data: {
  transferId: string;
  transferCode: string;
  senderPhone: string;
  receiverPhone: string;
  senderName: string;
  receiverName: string;
  amount: number;
  currency: string;
  destinationCity?: string;
  agentName?: string;
}) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    console.log('SMS Result:', result);
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: 'Failed to send SMS' };
  }
}

export async function createTransfer(data: TransferFormData, agentId: string): Promise<{ success: boolean; transfer?: Transfer; error?: string }> {
  const adminClient = createAdminClient();

  try {
    const { data: balance, error: balanceError } = await adminClient
      .from('agent_balances')
      .select('balance')
      .eq('agent_id', agentId)
      .single();

    if (balanceError || !balance) {
      return { success: false, error: 'No se encontró el saldo del gestor' };
    }

    if (balance.balance < data.amount) {
      return { success: false, error: 'Saldo insuficiente para realizar la transferencia' };
    }

    const transferCode = generateTransferCode();

    const { data: transfer, error: transferError } = await adminClient
      .from('transfers')
      .insert({
        transfer_code: transferCode,
        agent_id: agentId,
        sender_name: data.sender_name,
        sender_phone: data.sender_phone,
        sender_document_type: data.sender_document_type,
        sender_document_number: data.sender_document_number,
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
      .from('agent_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('agent_id', agentId);

    await adminClient
      .from('balance_transactions')
      .insert({
        agent_id: agentId,
        type: 'transfer',
        amount: -data.amount,
        previous_balance: previousBalance,
        new_balance: newBalance,
        reference_id: transfer.id,
        reference_type: 'transfer',
        description: `Transferencia: ${transferCode}`,
      });

    await adminClient
      .from('activity_logs')
      .insert({
        user_id: agentId,
        action: 'create_transfer',
        entity_type: 'transfer',
        entity_id: transfer.id,
        metadata: { transfer_code: transferCode, amount: data.amount },
      });

    try {
      await sendTransferSMS({
        transferId: transfer.id,
        transferCode,
        senderPhone: data.sender_phone,
        receiverPhone: data.receiver_phone,
        senderName: data.sender_name,
        receiverName: data.receiver_name,
        amount: data.amount,
        currency: data.currency,
        destinationCity: data.destination_city,
      });
    } catch (smsError) {
      console.error('Error sending SMS:', smsError);
    }

    return { success: true, transfer };
  } catch (error) {
    console.error('Transfer error:', error);
    return { success: false, error: 'Error al crear la transferencia' };
  }
}

export async function getTransfers(agentId: string, limit: number = 50) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('transfers')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Transfer[];
}

export async function getAllTransfers(limit: number = 100) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('transfers')
    .select('*, agent:users!transfers_agent_id_fkey(name, phone)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getTransferByCode(code: string) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('transfers')
    .select('*, agent:users!transfers_agent_id_fkey(name)')
    .eq('transfer_code', code)
    .single();

  if (error) throw error;
  return data as Transfer & { agent: { name: string } };
}

export async function getTransfersByDateRange(agentId: string, startDate: string, endDate: string) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('transfers')
    .select('*')
    .eq('agent_id', agentId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Transfer[];
}

export async function cancelTransfer(transferId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  const { data: transfer, error: fetchError } = await adminClient
    .from('transfers')
    .select('*')
    .eq('id', transferId)
    .eq('agent_id', agentId)
    .single();

  if (fetchError || !transfer) {
    return { success: false, error: 'Transferencia no encontrada' };
  }

  if (transfer.status !== 'created') {
    return { success: false, error: 'La transferencia no puede ser cancelada' };
  }

  const { data: balance, error: balanceError } = await adminClient
    .from('agent_balances')
    .select('balance')
    .eq('agent_id', agentId)
    .single();

  if (balanceError) {
    return { success: false, error: 'Error al obtener el saldo' };
  }

  const previousBalance = balance.balance;
  const newBalance = previousBalance + transfer.amount;

  await adminClient
    .from('transfers')
    .update({ 
      status: 'cancelled', 
      cancelled_at: new Date().toISOString() 
    })
    .eq('id', transferId);

  await adminClient
    .from('agent_balances')
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq('agent_id', agentId);

  await adminClient
    .from('balance_transactions')
    .insert({
      agent_id: agentId,
      type: 'refund',
      amount: transfer.amount,
      previous_balance: previousBalance,
      new_balance: newBalance,
      reference_id: transferId,
      reference_type: 'transfer',
      description: `Cancelación transferencia: ${transfer.transfer_code}`,
    });

  return { success: true };
}

export async function getTransferNotifications(transferId: string): Promise<Notification[]> {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('notifications')
    .select('*')
    .eq('transfer_id', transferId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
export async function getAgentNotifications(agentId: string, limit: number = 20) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('notifications')
    .select(`
      *,
      transfer:transfers!notifications_transfer_id_fkey (
        transfer_code,
        sender_name,
        receiver_name
      )
    `)
    .eq('transfers.agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getAdminNotifications(limit: number = 20) {
  const adminClient = createAdminClient();
  
  const { data, error } = await adminClient
    .from('notifications')
    .select('*')
    .eq('is_admin_notification', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function searchTransfers(query: string, agentId?: string) {
  const adminClient = createAdminClient();
  
  let baseQuery = adminClient
    .from('transfers')
    .select('*, agent:users!transfers_agent_id_fkey(name)');

  if (agentId) {
    baseQuery = baseQuery.eq('agent_id', agentId);
  }

  const { data, error } = await baseQuery
    .or(`transfer_code.ilike.%${query}%,sender_name.ilike.%${query}%,receiver_name.ilike.%${query}%,destination_city.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}
