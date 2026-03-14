import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = await import('@/lib/supabase/admin').then(m => m.createAdminClient());
    
    const { data: apiKeys, error } = await adminClient
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(apiKeys || []);

  } catch (error) {
    console.error('API Keys GET Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { app_name, app_description, role_access = 'cliente', permissions } = body;

    if (!app_name) {
      return NextResponse.json(
        { error: 'El nombre de la app es requerido' },
        { status: 400 }
      );
    }

    const adminClient = await import('@/lib/supabase/admin').then(m => m.createAdminClient());
    
    const { data: keyData, error: keyError } = await adminClient
      .rpc('generate_api_key');

    const { data: secretData, error: secretError } = await adminClient
      .rpc('generate_api_secret');

    if (keyError || secretError) {
      return NextResponse.json(
        { error: 'Error al generar credenciales' },
        { status: 500 }
      );
    }

    const { data: apiKey, error: insertError } = await adminClient
      .from('api_keys')
      .insert({
        app_name,
        app_description,
        api_key: keyData,
        api_secret: secretData,
        user_id: user.id,
        role_access,
        permissions: permissions || {
          balance: true,
          transfer: role_access === 'gestor',
          history: true,
        },
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        app_name: apiKey.app_name,
        api_key: keyData,
        api_secret: secretData,
        role_access: apiKey.role_access,
        permissions: apiKey.permissions,
        created_at: apiKey.created_at,
      },
    });

  } catch (error) {
    console.error('API Keys POST Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { error: 'ID de API key requerido' },
        { status: 400 }
      );
    }

    const adminClient = await import('@/lib/supabase/admin').then(m => m.createAdminClient());
    
    const { error } = await adminClient
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API Keys DELETE Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
