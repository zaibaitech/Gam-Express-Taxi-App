import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await context.params;

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err: any) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  // Only allow cancel if still pending or accepted
  const { data: bookingData } = await supabaseAdmin
    .from('bookings')
    .select('status')
    .eq('id', bookingId)
    .single();

  const booking = bookingData as { status: string } | null;

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  if (!['pending', 'accepted'].includes(booking.status)) {
    return NextResponse.json(
      { error: 'This booking can no longer be cancelled.' },
      { status: 409 }
    );
  }

  const { error } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
