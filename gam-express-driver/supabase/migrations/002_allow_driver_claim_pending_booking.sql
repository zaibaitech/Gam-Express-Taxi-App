-- ============================================================
-- Fix driver booking update policy so drivers can claim pending rides
-- ============================================================

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drivers_update_bookings" ON public.bookings;
CREATE POLICY "drivers_update_bookings"
  ON public.bookings FOR UPDATE
  USING (
    driver_id = auth.uid()
    OR (status = 'pending' AND driver_id IS NULL)
  )
  WITH CHECK (
    driver_id = auth.uid()
  );
