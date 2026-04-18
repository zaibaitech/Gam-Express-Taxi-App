import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Read from EXPO_PUBLIC_ env vars (injected by Metro) or app.config.js extra as fallback
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl;

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey;

// Custom storage adapter using expo-secure-store for token persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    // Force React Native's native fetch — prevents whatwg-fetch polyfill conflicts
    fetch: fetch.bind(globalThis),
  },
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/** Converts a Gambian phone number to the internal auth email format */
export function phoneToEmail(phone: string): string {
  // Strip all non-digits
  const digits = phone.replace(/\D/g, '');
  return `${digits}@gamexpress.com`;
}
