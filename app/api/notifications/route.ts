import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    let query = adminClient
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (type === 'admin') {
      query = query.eq('is_admin_notification', true);
    } else {
      query = query.eq('is_admin_notification', false);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      userPhone,
      userName, 
      userEmail, 
      message, 
      type, 
      transferId,
      isAdminNotification,
      priority 
    } = body;

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('notifications')
      .insert({
        user_id: userId,
        transfer_id: transferId || null,
        phone: userPhone || null,
        message: message,
        status: 'pending',
        is_admin_notification: isAdminNotification || false,
        priority: priority || 'normal',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification: data });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
