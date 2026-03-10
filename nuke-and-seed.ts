import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);

async function nukeAndSeed() {
  console.log('--- Cleaning up ALL test users ---');
  
  const emailsToDelete = [
    'aesono_test@gmail.com',
    'newadmin@test.com',
    'aesono_temp@segesa.gq',
    'aesono-admin@segesa.gq',
    'admin.aesono@outlook.es'
  ];

  const { data: { users } } = await client.auth.admin.listUsers();
  
  for (const email of emailsToDelete) {
    const user = users.find(u => u.email === email);
    if (user) {
      console.log(`Deleting ${email} (${user.id})...`);
      await client.auth.admin.deleteUser(user.id);
    }
    // Also delete from public.users specifically just in case trigger didn't handle something
    await client.from('users').delete().eq('email', email);
  }

  console.log('\n--- Attempting to create the REAL admin ---');
  const { data, error } = await client.auth.admin.createUser({
    email: 'aesono@segesa.gq',
    password: 'Admin1234@',
    email_confirm: true,
    user_metadata: {
      name: 'Administrador Principal',
      phone: '+240555877465',
      role: 'admin',
    },
  });

  if (error) {
    console.error('FINAL FAILURE:', JSON.stringify(error, null, 2));
    console.log('\nSi esto falla con "unexpected_failure", el email "aesono@segesa.gq" tiene un conflicto interno en Supabase que solo puedes solucionar borrando el usuario desde el panel de Supabase o con SQL: DELETE FROM auth.users WHERE email = \'aesono@segesa.gq\';');
  } else {
    console.log('¡ÉXITO! Usuario creado:', data.user.id);
  }
}

nukeAndSeed();
