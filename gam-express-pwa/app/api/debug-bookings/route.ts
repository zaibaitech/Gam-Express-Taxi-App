import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (e: any) {
    return NextResponse.json({ error: 'No service key: ' + e.message }, { status: 500 });
  }

  const { data, error, count } = await supabaseAdmin
    .from('bookings')
    .select('id, booking_reference, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    totalBookings: count,
    recentBookings: data,
    error: error?.message ?? null,
  });
}
