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

  const supabaseAdmin = getSupabaseAdmin();
  const { data: booking, error } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_reference, status, pickup_address, dropoff_address, driver_id')
    .eq('booking_reference', reference)
    .single();

  if (error || !booking) {
    return NextResponse.json(
      { error: error?.message ?? 'Booking not found.' },
      { status: 404 }
    );
  }

  return NextResponse.json(booking);
}
