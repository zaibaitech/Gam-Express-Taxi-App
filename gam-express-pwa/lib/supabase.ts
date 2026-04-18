import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service role key — only used in server-side API routes (admin actions)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client — used in browser/client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — bypasses RLS, only safe to use in server-side code (API routes / Server Actions)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'mobile_money' | 'cash';

export type Booking = {
  id: string;
  created_at: string;
  driver_id: string | null;
  status: BookingStatus;
  driver_accepted_at: string | null;
  completed_at: string | null;
  estimated_fare: number | null;
  payment_method: PaymentMethod | null;
  customer_name: string | null;
  customer_phone: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  booking_reference: string | null;
};

export type Driver = {
  id: string;
  full_name: string;
  phone: string;
  vehicle_plate: string;
  vehicle_model: string;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Phone digits → internal Supabase auth email */
export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@gamexpress.com`;
}
