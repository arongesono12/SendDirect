import { createClient } from '@supabase/supabase-js';

const url = 'https://vomypzeatjtylpfplvyz.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvbXlwemVhdGp0eWxwZnBsdnl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjcxMDE3MSwiZXhwIjoyMDg4Mjg2MTcxfQ.bkekgHKuqr6mMKaU2xo2AvMmHJ1ZM_sWjYD1a8wgZ_k';

const client = createClient(url, key);

async function cleanup() {
  const adminEmail = 'aesono@segesa.gq';
  const adminPhone = '+240555877465';

  console.log('--- Cleaning up orphaned records ---');
  
  // Delete by email
  const { error: delEmailError } = await client.from('users').delete().eq('email', adminEmail);
  if (delEmailError) {
    console.error('Error deleting by email:', delEmailError.message);
  } else {
    console.log(`Deleted orphaned record with email ${adminEmail} from public.users`);
  }

  // Delete by phone
  const { error: delPhoneError } = await client.from('users').delete().eq('phone', adminPhone);
  if (delPhoneError) {
    console.error('Error deleting by phone:', delPhoneError.message);
  } else {
    console.log(`Deleted orphaned record with phone ${adminPhone} from public.users`);
  }

  console.log('--- Cleanup complete. You can now run seed-admin.ts ---');
}

cleanup();
