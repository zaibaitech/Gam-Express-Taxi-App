import { create } from 'zustand';
import type { Driver, Booking } from '../lib/supabase';

interface DriverState {
  // Auth
  driver: Driver | null;
  setDriver: (driver: Driver | null) => void;

  // Online / GPS state
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Active booking (currently accepted ride)
  activeBooking: Booking | null;
  setActiveBooking: (booking: Booking | null) => void;

  // Pending incoming ride that triggered the modal
  incomingBooking: Booking | null;
  setIncomingBooking: (booking: Booking | null) => void;

  // Trip history (completed)
  tripHistory: Booking[];
  setTripHistory: (trips: Booking[]) => void;

  // Earnings today (derived from completed trips)
  earningsToday: number;
  setEarningsToday: (amount: number) => void;

  // Trips today count
  tripsToday: number;
  setTripsToday: (count: number) => void;

  // Reset all state (on logout)
  reset: () => void;
}

const initialState = {
  driver: null,
  isOnline: false,
  activeBooking: null,
  incomingBooking: null,
  tripHistory: [],
  earningsToday: 0,
  tripsToday: 0,
};

export const useDriverStore = create<DriverState>((set) => ({
  ...initialState,

  setDriver: (driver) => set({ driver }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setActiveBooking: (activeBooking) => set({ activeBooking }),
  setIncomingBooking: (incomingBooking) => set({ incomingBooking }),
  setTripHistory: (tripHistory) => set({ tripHistory }),
  setEarningsToday: (earningsToday) => set({ earningsToday }),
  setTripsToday: (tripsToday) => set({ tripsToday }),

  reset: () => set(initialState),
}));
