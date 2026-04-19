-- ============================================================
-- Gam Express Taxi — Admin Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── 1. Admins table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admins (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can read the admins table (to list other admins)
DROP POLICY IF EXISTS "admins_select" ON public.admins;
CREATE POLICY "admins_select"
  ON public.admins FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Only existing admins can insert new admins (enforced server-side via service role)
-- No direct client insert allowed
DROP POLICY IF EXISTS "admins_insert" ON public.admins;
CREATE POLICY "admins_insert"
  ON public.admins FOR INSERT
  WITH CHECK (false);

-- Only existing admins can delete admins (enforced server-side via service role)
DROP POLICY IF EXISTS "admins_delete" ON public.admins;
CREATE POLICY "admins_delete"
  ON public.admins FOR DELETE
  USING (false);

-- ── 2. Allow admins to read all bookings and drivers ──────────────────────────

-- Admins can read all bookings
DROP POLICY IF EXISTS "admins_select_bookings" ON public.bookings;
CREATE POLICY "admins_select_bookings"
  ON public.bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Admins can update all bookings (e.g. cancel)
DROP POLICY IF EXISTS "admins_update_bookings" ON public.bookings;
CREATE POLICY "admins_update_bookings"
  ON public.bookings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Admins can read all drivers
DROP POLICY IF EXISTS "admins_select_drivers" ON public.drivers;
CREATE POLICY "admins_select_drivers"
  ON public.drivers FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- Admins can update all drivers (e.g. force offline)
DROP POLICY IF EXISTS "admins_update_drivers" ON public.drivers;
CREATE POLICY "admins_update_drivers"
  ON public.drivers FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
