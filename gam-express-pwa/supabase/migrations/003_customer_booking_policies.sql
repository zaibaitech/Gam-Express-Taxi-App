-- ============================================================
-- Allow anonymous customers to create and read their own bookings
-- ============================================================

-- Customers (unauthenticated / anon) can insert new bookings
DROP POLICY IF EXISTS "customers_insert_bookings" ON public.bookings;
CREATE POLICY "customers_insert_bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (true);

-- The confirmation page polls /api/bookings/[id] which uses the service role
-- key (bypasses RLS), so no anon SELECT policy is needed for status tracking.
-- Admin and driver SELECT policies cover all other read access.
