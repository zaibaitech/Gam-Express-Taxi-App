-- ============================================================
-- Add push_token to drivers so Expo push tokens are persisted.
-- ============================================================

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS push_token TEXT;
