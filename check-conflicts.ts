import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);

async function checkConflicts() {
  const adminEmail = 'aesono@segesa.gq';
  const adminPhone = '+240555877465';

  console.log('--- Checking for conflicts ---');
  
  const { data: byEmail } = await client.from('users').select('*').eq('email', adminEmail);
  const { data: byPhone } = await client.from('users').select('*').eq('phone', adminPhone);

  if (byEmail && byEmail.length > 0) {
    console.log(`Conflict found: Email ${adminEmail} exists in public.users (ID: ${byEmail[0].id})`);
  } else {
    console.log(`Email ${adminEmail} is free in public.users`);
  }

  if (byPhone && byPhone.length > 0) {
    console.log(`Conflict found: Phone ${adminPhone} exists in public.users (ID: ${byPhone[0].id})`);
  } else {
    console.log(`Phone ${adminPhone} is free in public.users`);
  }
  
  const { data: { users } } = await client.auth.admin.listUsers();
  const authUser = users.find(u => u.email === adminEmail || u.phone === adminPhone);
  if (authUser) {
    console.log(`Conflict found in auth.users: ${authUser.email} (ID: ${authUser.id})`);
  } else {
    console.log('No conflicts in auth.users');
  }
}

checkConflicts();
