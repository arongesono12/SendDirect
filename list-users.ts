import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);

async function listAll() {
  console.log('--- AUTH USERS ---');
  const { data: { users } } = await client.auth.admin.listUsers();
  users.forEach(u => console.log(`${u.email} | ID: ${u.id}`));

  console.log('\n--- PUBLIC USERS ---');
  const { data: profiles } = await client.from('users').select('email, id');
  profiles?.forEach(u => console.log(`${u.email} | ID: ${u.id}`));
}

listAll();
