import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);

async function checkIds() {
  console.log('--- ID Comparison Sync ---');
  
  const { data: { users: authUsers } } = await client.auth.admin.listUsers();
  const authUser = authUsers.find(u => u.email === 'aesono@segesa.gq');
  
  if (!authUser) {
    console.log('No user found in auth.users for aesono@segesa.gq');
    return;
  }
  
  console.log('Auth User ID:', authUser.id);

  const { data: profile } = await client
    .from('users')
    .select('*')
    .eq('email', 'aesono@segesa.gq')
    .single();

  if (profile) {
    console.log('Public User ID:', profile.id);
    if (authUser.id === profile.id) {
      console.log('IDs match! Success.');
    } else {
      console.log('IDs DO NOT MATCH! This is the problem.');
    }
  } else {
    console.log('No profile found in public.users for aesono@segesa.gq');
  }
}

checkIds();
