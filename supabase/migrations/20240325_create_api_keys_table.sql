-- ============================================
-- Migration: Create API Keys table for external apps
-- Run this in Supabase SQL Editor
-- ============================================

-- Table to store API keys for external applications
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_name TEXT NOT NULL,
  app_description TEXT,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role_access TEXT NOT NULL DEFAULT 'cliente' CHECK (role_access IN ('admin', 'gestor', 'cliente')),
  permissions JSONB DEFAULT '{"balance": true, "transfer": true, "history": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  rate_limit INTEGER DEFAULT 100,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for API key queries
CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON public.api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own API keys
CREATE POLICY "Users can manage own API keys"
  ON public.api_keys FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to generate secure API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key_text TEXT;
BEGIN
  key_text := 'sk_' || encode(gen_random_bytes(24), 'hex');
  RETURN key_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate API secret
CREATE OR REPLACE FUNCTION public.generate_api_secret()
RETURNS TEXT AS $$
DECLARE
  secret_text TEXT;
BEGIN
  secret_text := encode(gen_random_bytes(32), 'hex');
  RETURN secret_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
