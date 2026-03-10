import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DashboardLayoutWrapper } from '@/components/layout/dashboard-layout-wrapper';
import { AppProvider } from '@/components/providers/app-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    redirect('/login');
  }

  const adminClient = createAdminClient();
  const { data: user, error: profileError } = await adminClient
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError || !user) {
    console.error('No profile found for user:', authUser.id, profileError);
    redirect('/login');
  }

  return (
    <AppProvider initialUser={user}>
      <DashboardLayoutWrapper>
        {children}
      </DashboardLayoutWrapper>
    </AppProvider>
  );
}
