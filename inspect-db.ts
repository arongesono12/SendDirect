import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);

async function inspect() {
  console.log('--- Inspecting public.users ---');
  const { data: users, error: usersError } = await client.from('users').select('*');
  if (usersError) {
    console.error('Error fetching public.users:', usersError.message);
  } else {
    console.log('Public users count:', users.length);
    users.forEach(u => console.log(`- ${u.email} | Phone: ${u.phone} | Role: ${u.role}`));
  }

  console.log('\n--- Inspecting auth.users ---');
  const { data: { users: authUsers }, error: authError } = await client.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth.users:', authError.message);
  } else {
    console.log('Auth users count:', authUsers.length);
    authUsers.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`));
  }
}

inspect();
