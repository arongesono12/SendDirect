-- ============================================
-- Migration: Add user_id and admin fields to notifications for client notifications
-- Run this in Supabase SQL Editor
-- ============================================

-- Add columns for client notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_admin_notification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'low'));

-- Create index for user_id queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Create index for is_admin_notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_is_admin ON public.notifications(is_admin_notification);

-- Create index for priority queries
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- Drop and recreate the function to get unread count for clients
CREATE OR REPLACE FUNCTION get_unread_notification_count_client(client_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_val INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_val
  FROM public.notifications 
  WHERE user_id = client_id
  AND (is_read IS NULL OR is_read = FALSE);
  
  RETURN count_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for clients to read their own notifications
DROP POLICY IF EXISTS "Clients can read own notifications" ON public.notifications;

CREATE POLICY "Clients can read own notifications"
  ON public.notifications FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.transfers t
      WHERE t.id = transfer_id AND t.agent_id = auth.uid()
    )
    OR is_admin_notification = true
  );

-- Allow clients to update their own notification read status
DROP POLICY IF EXISTS "Clients can update own notifications" ON public.notifications;

CREATE POLICY "Clients can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow clients to delete their own notifications
DROP POLICY IF EXISTS "Clients can delete own notifications" ON public.notifications;

CREATE POLICY "Clients can delete own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());
