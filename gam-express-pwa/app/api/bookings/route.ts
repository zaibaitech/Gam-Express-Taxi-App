import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get('reference');

  if (!reference) {
    return NextResponse.json(
      { error: 'Booking reference is required.' },
      { status: 400 }
    );
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  const bookingResult = await supabaseAdmin
    .from('bookings')
    .select('id, booking_reference, status, pickup_address, dropoff_address, driver_id')
    .eq('booking_reference', reference)
    .single();

  const booking = bookingResult.data as {
    id: string;
    booking_reference: string;
    status: string;
    pickup_address: string | null;
    dropoff_address: string | null;
    driver_id: string | null;
  } | null;

  if (bookingResult.error || !booking) {
    return NextResponse.json(
      { error: bookingResult.error?.message ?? 'Booking not found.' },
      { status: 404 }
    );
  }

  let driver = null;
  if (booking.driver_id) {
    const { data: driverData } = await supabaseAdmin
      .from('drivers')
      .select('full_name, vehicle_plate')
      .eq('id', booking.driver_id)
      .single();
    driver = driverData;
  }

  return NextResponse.json({ ...booking, driver });
}
