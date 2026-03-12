import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const SUPA_KEY = '__supabase_client_instance__';

function getGlobal<T>(key: string): T | undefined {
  if (typeof globalThis === 'undefined') return undefined;
  return (globalThis as Record<string, unknown>)[key] as T | undefined;
}

function setGlobal<T>(key: string, value: T): void {
  if (typeof globalThis !== 'undefined') {
    (globalThis as Record<string, unknown>)[key] = value;
  }
}

export function createClient(): SupabaseClient {
  const cached = getGlobal<SupabaseClient>(SUPA_KEY);
  if (cached) {
    return cached;
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  setGlobal(SUPA_KEY, client);
  return client;
}
