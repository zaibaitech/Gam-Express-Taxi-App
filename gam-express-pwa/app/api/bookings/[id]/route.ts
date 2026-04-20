import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

type BookingStatusResponse = {
  status: string;
  driver_id: string | null;
};

type DriverInfo = {
  full_name: string;
  vehicle_plate: string;
  vehicle_model: string;
  phone: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await context.params;
  if (!bookingId) {
    return NextResponse.json({ error: 'Booking id is required.' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('status, driver_id')
    .eq('id', bookingId)
    .single();

  const booking = data as BookingStatusResponse | null;
  if (bookingError || !booking) {
    return NextResponse.json(
      { error: bookingError?.message ?? 'Booking not found.' },
      { status: 404 }
    );
  }

  let driver = null;
  if (booking.driver_id) {
    const { data, error: driverError } = await supabaseAdmin
      .from('drivers')
      .select('full_name, vehicle_plate, vehicle_model, phone')
      .eq('id', booking.driver_id)
      .single();

    const driverData = data as DriverInfo | null;
    if (driverError || !driverData) {
      return NextResponse.json(
        { error: driverError?.message ?? 'Failed to load driver info.' },
        { status: 500 }
      );
    }

    driver = driverData;
  }

  return NextResponse.json({ status: booking.status, driver });
}
