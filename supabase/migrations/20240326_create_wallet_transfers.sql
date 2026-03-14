-- ============================================
-- Migration: Create wallet_transfers table for client-to-client transfers
-- Run this in Supabase SQL Editor
-- ============================================

-- Table for client wallet transfers
CREATE TABLE IF NOT EXISTS public.wallet_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XAF',
  verification_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'expired')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_sender_id ON public.wallet_transfers(sender_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_receiver_id ON public.wallet_transfers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_status ON public.wallet_transfers(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_created_at ON public.wallet_transfers(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transfers_verification_code ON public.wallet_transfers(verification_code);

-- Enable RLS
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own wallet transfers"
  ON public.wallet_transfers FOR SELECT
  USING (
    sender_id = auth.uid()
    OR receiver_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add missing columns to notifications table if not exists
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_admin_notification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'low'));

-- Create indexes for notifications user_id
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_admin ON public.notifications(is_admin_notification);
