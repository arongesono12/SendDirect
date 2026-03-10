import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);

async function fullSweep() {
  console.log('--- Full Database Sweep ---');
  
  const { data: { users: authUsers } } = await client.auth.admin.listUsers();
  console.log('Auth Users:', authUsers.length);
  authUsers.forEach(u => console.log(`- AUTH: ${u.email} (${u.id}) | Phone: ${u.phone}`));

  const { data: publicUsers } = await client.from('users').select('*');
  console.log('Public Users:', publicUsers?.length || 0);
  publicUsers?.forEach(u => console.log(`- PUBLIC: ${u.email} (${u.id}) | Phone: ${u.phone}`));
}

fullSweep();
