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

  const supabaseAdmin = getSupabaseAdmin();
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('status, driver_id')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: bookingError?.message ?? 'Booking not found.' },
      { status: 404 }
    );
  }

  let driver = null;
  if (booking.driver_id) {
    const { data: driverData } = await supabaseAdmin
      .from('drivers')
      .select('full_name, vehicle_plate, vehicle_model, phone')
      .eq('id', booking.driver_id)
      .single();
    driver = driverData;
  }

  return NextResponse.json({ status: booking.status, driver });
}
