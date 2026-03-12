import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

interface SupportMessage {
  userId?: string;
  userName?: string;
  userEmail?: string;
  message: string;
  targetAdminPhone?: string;
  requestType?: string;
}

async function sendSMS(to: string, body: string) {
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.log('Twilio not configured, skipping SMS');
    return null;
  }

  try {
    const twilio = await import('twilio');
    const client = twilio.default(accountSid, authToken);
    const result = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });
    return result.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: SupportMessage = await request.json();

    if (!data.message || !data.message.trim()) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin.from('support_messages').insert({
      user_id: data.userId || null,
      user_name: data.userName || 'Usuario anónimo',
      user_email: data.userEmail || null,
      message: data.message,
      status: 'pending',
      request_type: data.requestType || null,
    });

    if (error) {
      console.error('Error saving support message:', error);
      return NextResponse.json(
        { error: 'Error al guardar el mensaje' },
        { status: 500 }
      );
    }

    if (data.requestType === 'balance_topup') {
      const typeLabel = 'SOLICITUD DE RECARGA';
      const adminMessage = `SendDirect - ${typeLabel}\n\nDe: ${data.userName}\n\nMensaje:\n${data.message}\n\nEste mensaje fue enviado desde la app móvil.`;

      if (data.targetAdminPhone) {
        const smsSid = await sendSMS(data.targetAdminPhone, adminMessage);
        
        if (smsSid) {
          await supabaseAdmin.from('notifications').insert({
            phone: data.targetAdminPhone,
            message: adminMessage,
            status: 'sent',
            twilio_sid: smsSid,
            is_admin_notification: true,
            priority: 'high',
          });
        }
      }

      await supabaseAdmin.from('notifications').insert({
        message: `${data.userName} ha solicitado una recarga de saldo.\n\nMensaje: ${data.message}`,
        status: 'pending',
        is_admin_notification: true,
        priority: 'high',
        user_id: data.userId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Support API error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabaseAdmin = createAdminClient();
  
  const { data, error } = await supabaseAdmin
    .from('support_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
