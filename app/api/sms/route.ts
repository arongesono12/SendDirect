import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

interface SMSData {
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
  agentPhone?: string;
}

async function saveNotification(
  supabaseAdmin: any,
  transferId: string,
  phone: string,
  message: string,
  status: 'sent' | 'failed',
  twilioSid?: string,
  errorMessage?: string
) {
  await supabaseAdmin.from('notifications').insert({
    transfer_id: transferId,
    phone: phone,
    message: message,
    status: status,
    twilio_sid: twilioSid || null,
    error_message: errorMessage || null,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  });
}

async function sendSMS(client: any, to: string, body: string, from: string) {
  return await client.messages.create({
    body: body,
    from: from,
    to: to,
  });
}

export async function POST(request: NextRequest) {
  const supabaseAdmin = createAdminClient();
  
  try {
    const data: SMSData = await request.json();

    if (!accountSid || !authToken || !twilioPhoneNumber) {
      console.log('Twilio not configured, skipping SMS');
      
      await Promise.all([
        saveNotification(supabaseAdmin, data.transferId, data.senderPhone, 'SMS no enviado - Twilio no configurado', 'failed'),
        saveNotification(supabaseAdmin, data.transferId, data.receiverPhone, 'SMS no enviado - Twilio no configurado', 'failed'),
      ]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Twilio no configurado, SMS omitido' 
      });
    }

    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);

    const senderMessage = `SendDirect: Su transferencia de ${data.amount} ${data.currency} ha sido registrada correctamente.\n\nRemitente: ${data.senderName}\nDestinatario: ${data.receiverName}\nMonto: ${data.amount} ${data.currency}\nCódigo: ${data.transferCode}\n\nGracias por confiar en SendDirect.`;
    
    const receiverMessage = `SendDirect: Tiene una transferencia disponible de ${data.amount} ${data.currency} de ${data.senderName}.\n\nCiudad: ${data.destinationCity || 'N/A'}\nCódigo de retiro: ${data.transferCode}\n\nAcuda a cualquier agente SendDirect para retirar su dinero.`;

    let senderSid = null;
    let receiverSid = null;
    let senderError = null;
    let receiverError = null;

    try {
      const senderResult = await sendSMS(client, data.senderPhone, senderMessage, twilioPhoneNumber);
      senderSid = senderResult.sid;
    } catch (error: any) {
      senderError = error.message || 'Error sending to sender';
      console.error('Error sending SMS to sender:', senderError);
    }

    try {
      const receiverResult = await sendSMS(client, data.receiverPhone, receiverMessage, twilioPhoneNumber);
      receiverSid = receiverResult.sid;
    } catch (error: any) {
      receiverError = error.message || 'Error sending to receiver';
      console.error('Error sending SMS to receiver:', receiverError);
    }

    await Promise.all([
      saveNotification(
        supabaseAdmin, 
        data.transferId, 
        data.senderPhone, 
        senderMessage, 
        senderSid ? 'sent' : 'failed',
        senderSid || undefined,
        senderError || undefined
      ),
      saveNotification(
        supabaseAdmin, 
        data.transferId, 
        data.receiverPhone, 
        receiverMessage, 
        receiverSid ? 'sent' : 'failed',
        receiverSid || undefined,
        receiverError || undefined
      ),
    ]);

    return NextResponse.json({
      success: true,
      senderSid: senderSid,
      receiverSid: receiverSid,
      senderStatus: senderSid ? 'sent' : 'failed',
      receiverStatus: receiverSid ? 'sent' : 'failed',
      senderError: senderError,
      receiverError: receiverError,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SMS Error:', errorMessage);
    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}
