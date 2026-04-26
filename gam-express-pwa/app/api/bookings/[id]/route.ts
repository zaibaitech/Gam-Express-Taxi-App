import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await context.params;
  if (!bookingId) {
    return NextResponse.json({ error: 'Booking id is required.' }, { status: 400 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err: any) {
    return NextResponse.json({ error: 'Server configuration error: ' + err.message }, { status: 500 });
  }

  const { data: bookingData, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_reference, status, driver_id, pickup_address, dropoff_address, customer_name, customer_phone, estimated_fare, payment_method')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  if (!bookingData) {
    const { count } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true });
    return NextResponse.json(
      { error: 'Booking not found.', id: bookingId, visibleBookings: count },
      { status: 404 }
    );
  }

  const booking = bookingData as {
    id: string;
    booking_reference: string;
    status: string;
    driver_id: string | null;
    pickup_address: string | null;
    dropoff_address: string | null;
    customer_name: string | null;
    customer_phone: string | null;
    estimated_fare: number | null;
    payment_method: string | null;
  };

  let driver = null;
  if (booking.driver_id) {
    const { data: driverData } = await supabaseAdmin
      .from('drivers')
      .select('full_name, vehicle_plate, vehicle_model, phone')
      .eq('id', booking.driver_id)
      .single();
    driver = driverData;
  }

  return NextResponse.json({ ...booking, driver });
}
