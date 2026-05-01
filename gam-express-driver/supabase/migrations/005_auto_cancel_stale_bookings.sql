-- Function: cancel pending bookings older than 15 minutes with no driver
CREATE OR REPLACE FUNCTION public.cancel_stale_pending_bookings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND driver_id IS NULL
    AND created_at < NOW() - INTERVAL '15 minutes';
END;
$$;

-- Trigger: runs the cleanup on every new booking INSERT
-- so stale bookings are cleared before drivers see the list
CREATE OR REPLACE FUNCTION public.trigger_cancel_stale_bookings()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.cancel_stale_pending_bookings();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_inserted_cleanup ON public.bookings;
CREATE TRIGGER on_booking_inserted_cleanup
  BEFORE INSERT ON public.bookings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_cancel_stale_bookings();
