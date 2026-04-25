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
    console.error('Supabase Admin initialization error:', err.message);
    return NextResponse.json({ error: 'Server configuration error: ' + err.message }, { status: 500 });
  }
  const { data: bookingData, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('status, driver_id')
    .eq('id', bookingId)
    .maybeSingle();

  const booking = bookingData as { status: string; driver_id: string | null } | null;

  if (bookingError) {
    return NextResponse.json(
      { error: bookingError.message, code: bookingError.code },
      { status: 500 }
    );
  }

  if (!booking) {
    // Diagnostic: count total bookings visible to this client
    const { count } = await supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact', head: true });
    return NextResponse.json(
      { error: 'Booking not found.', id: bookingId, visibleBookings: count },
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
    driver = driverData as { full_name: string; vehicle_plate: string; vehicle_model: string; phone: string } | null;
  }

  return NextResponse.json({ status: booking.status, driver });
}
