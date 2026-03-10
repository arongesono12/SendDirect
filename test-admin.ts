import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);
console.log('Admin present:', !!client.auth.admin);

async function test() {
  const { data: { users }, error } = await client.auth.admin.listUsers();
  if (error) console.error('Error:', error.message);
  else {
    console.log('Users found:', users.length);
    users.forEach(u => console.log(`- ${u.email} (ID: ${u.id})`));
  }
}

test();
