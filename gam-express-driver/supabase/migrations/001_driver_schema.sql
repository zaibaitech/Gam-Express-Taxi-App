-- ============================================================
-- Gam Express Taxi — Driver Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── 1. Enable UUID extension (already enabled in most Supabase projects) ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. Create drivers table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.drivers (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  vehicle_plate   TEXT NOT NULL,
  vehicle_model   TEXT NOT NULL,
  is_online       BOOLEAN NOT NULL DEFAULT FALSE,
  current_lat     FLOAT8,
  current_lng     FLOAT8,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- ── 3. Extend bookings table ───────────────────────────────────────────────
-- Create the bookings table if it doesn't exist yet (in case this runs before
-- the customer PWA migration). If it already exists, the ALTER TABLE
-- statements below will safely add only the missing columns.

CREATE TABLE IF NOT EXISTS public.bookings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status enum (safe to run even if type already exists)
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending', 'accepted', 'en_route', 'arrived', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'mobile_money', 'cash'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add columns only if they don't already exist
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS driver_id           UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status              booking_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS driver_accepted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS estimated_fare      NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS payment_method      payment_method,
  ADD COLUMN IF NOT EXISTS customer_name       TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone      TEXT,
  ADD COLUMN IF NOT EXISTS pickup_address      TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_address     TEXT,
  ADD COLUMN IF NOT EXISTS pickup_lat          FLOAT8,
  ADD COLUMN IF NOT EXISTS pickup_lng          FLOAT8,
  ADD COLUMN IF NOT EXISTS dropoff_lat         FLOAT8,
  ADD COLUMN IF NOT EXISTS dropoff_lng         FLOAT8,
  ADD COLUMN IF NOT EXISTS booking_reference   TEXT UNIQUE;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies — drivers table ────────────────────────────────────────

-- Drivers can view only their own profile
DROP POLICY IF EXISTS "drivers_select_own" ON public.drivers;
CREATE POLICY "drivers_select_own"
  ON public.drivers FOR SELECT
  USING (auth.uid() = id);

-- Drivers can update only their own profile (online status, location)
DROP POLICY IF EXISTS "drivers_update_own" ON public.drivers;
CREATE POLICY "drivers_update_own"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = id);

-- Drivers can insert their own profile row (on first sign-up)
DROP POLICY IF EXISTS "drivers_insert_own" ON public.drivers;
CREATE POLICY "drivers_insert_own"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ── 5. RLS Policies — bookings table ───────────────────────────────────────

-- Drivers can view:
--   a) bookings assigned to them
--   b) pending bookings with no driver (unassigned ride requests)
DROP POLICY IF EXISTS "drivers_select_bookings" ON public.bookings;
CREATE POLICY "drivers_select_bookings"
  ON public.bookings FOR SELECT
  USING (
    driver_id = auth.uid()
    OR (status = 'pending' AND driver_id IS NULL)
  );

-- Drivers can update bookings that are assigned to them
DROP POLICY IF EXISTS "drivers_update_bookings" ON public.bookings;
CREATE POLICY "drivers_update_bookings"
  ON public.bookings FOR UPDATE
  USING (driver_id = auth.uid());

-- ── 6. Realtime — enable on both tables ────────────────────────────────────
-- Run in Supabase dashboard: Database → Replication → enable tables below
-- Or via CLI:
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;

-- ── 7. Index for common query patterns ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id    ON public.bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at   ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drivers_is_online     ON public.drivers(is_online);

-- ── 8. Helper: seed a driver user ──────────────────────────────────────────
-- After creating the Supabase Auth user via the dashboard or Admin API, run:
--
--   INSERT INTO public.drivers (id, full_name, phone, vehicle_plate, vehicle_model)
--   VALUES (
--     '<auth-user-uuid>',
--     'Ousman Jallow',
--     '+220 123 4567',
--     'BJL 1234',
--     'Toyota Corolla 2018'
--   );
--
-- The auth email should be: <phone_digits>@gamexpress.com
-- e.g. for +220 123 4567 → 2201234567@gamexpress.com
