import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateAPIKey, requirePermission } from '@/lib/api-auth';
import { generateTransferCode } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateAPIKey(request);
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!await requirePermission(auth, 'transfer')) {
      return NextResponse.json({ error: 'Permiso denegado: transfer' }, { status: 403 });
    }

    const { user_id, role_access } = auth.apiKey!;
    
    if (role_access !== 'gestor') {
      return NextResponse.json(
        { error: 'Solo gestores pueden realizar transferencias' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      sender_name,
      sender_phone,
      sender_document_type,
      sender_document_number,
      receiver_name,
      receiver_phone,
      receiver_document_type,
      receiver_document_number,
      destination_city,
      destination_country,
      amount,
      currency = 'XAF',
      notes,
    } = body;

    if (!receiver_name || !receiver_phone || !amount || !destination_city) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { data: balance, error: balanceError } = await adminClient
      .from('agent_balances')
      .select('balance')
      .eq('agent_id', user_id)
      .single();

    if (balanceError || !balance) {
      return NextResponse.json(
        { error: 'No se encontró el saldo del gestor' },
        { status: 400 }
      );
    }

    if (balance.balance < amount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente' },
        { status: 400 }
      );
    }

    const transferCode = generateTransferCode();

    const { data: transfer, error: transferError } = await adminClient
      .from('transfers')
      .insert({
        transfer_code: transferCode,
        transfer_type: 'agent',
        agent_id: user_id,
        sender_name,
        sender_phone,
        sender_document_type,
        sender_document_number,
        receiver_name,
        receiver_phone,
        receiver_document_type,
        receiver_document_number,
        destination_city,
        destination_country,
        amount,
        currency,
        status: 'completed',
        notes,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (transferError) {
      return NextResponse.json(
        { error: transferError.message },
        { status: 500 }
      );
    }

    const newBalance = balance.balance - amount;
    await adminClient
      .from('agent_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('agent_id', user_id);

    await adminClient
      .from('balance_transactions')
      .insert({
        agent_id: user_id,
        type: 'transfer',
        amount: -amount,
        previous_balance: balance.balance,
        new_balance: newBalance,
        reference_id: transfer.id,
        reference_type: 'transfer',
        description: `Transferencia API: ${transferCode}`,
      });

    return NextResponse.json({
      success: true,
      data: {
        transfer_id: transfer.id,
        transfer_code: transferCode,
        amount,
        currency,
        receiver_name,
        receiver_phone,
        destination_city,
        status: 'completed',
        created_at: transfer.created_at,
      },
    });

  } catch (error) {
    console.error('API Transfer Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
