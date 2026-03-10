import { createAdminClient } from './lib/supabase/admin';

async function seedAdmin() {
  const adminClient = createAdminClient();
  const user_email = 'aesono@segesa.gq';
  const user_password = 'Admin1234@';

  console.log('--- Iniciando Seed de Administrador ---');
  
  // 1. Intentar obtener el usuario si existe
  const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    console.error('Error al listar usuarios:', listError.message);
    return;
  }

  const existingUser = users.find(u => u.email === user_email);

  if (existingUser) {
    console.log('Usuario ya existe en auth.users. Actualizando contraseña y metadatos...');
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      existingUser.id,
      { 
        password: user_password,
        user_metadata: { role: 'admin' },
        email_confirm: true
      }
    );
    if (updateError) {
      console.error('Error al actualizar:', updateError.message);
    } else {
      console.log('--- Administrador actualizado con éxito ---');
    }
  } else {
    console.log('Creando nuevo usuario administrador...');
    const { data, error: createError } = await adminClient.auth.admin.createUser({
      email: user_email,
      password: user_password,
      email_confirm: true,
      user_metadata: {
        name: 'Administrador Principal',
        phone: '+240555877465',
        role: 'admin',
      },
    });

    if (createError) {
      console.error('Error al crear:', createError.message);
      console.error('Detalles completos:', JSON.stringify(createError, null, 2));
    } else {
      console.log('--- Administrador creado con éxito ---');
    }
  }
}

seedAdmin().catch(err => {
  console.error('Error fatal en el script:', err);
});
