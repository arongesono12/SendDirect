import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);

async function testNewUser() {
  console.log('--- Testing creation of a TOTALLY NEW user ---');
  
  const { data, error } = await client.auth.admin.createUser({
    email: 'newadmin@test.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      name: 'Test Admin',
      phone: '+11111111111',
      role: 'admin',
    },
  });

  if (error) {
    console.error('Failure:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success! User created:', data.user.id);
  }
}

testNewUser();
