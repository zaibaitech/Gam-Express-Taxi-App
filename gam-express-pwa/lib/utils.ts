// Utility functions for the taxi booking app

// ---------------------------------------------------------------------------
// Plus Code utilities
// A Plus Code looks like: 796RWF8Q+WF  or  WF8Q+WF (short form)
// Full format:  [2-8 chars][+][2+ chars]
// Short format: [2-4 chars][+][2+ chars]  (requires a locality to resolve)
// ---------------------------------------------------------------------------

const PLUS_CODE_RE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,}$/i;

export function isPlusCode(value: string): boolean {
  return PLUS_CODE_RE.test(value.trim().replaceAll(' ', ''));
}

/** Normalise to uppercase with no spaces */
export function normalisePlusCode(value: string): string {
  return value.trim().replaceAll(' ', '').toUpperCase();
}

/**
 * Return a Google Maps URL that opens the Plus Code so drivers can navigate.
 * Works for both full and short codes (short codes resolve relative to Gambia).
 */
export function plusCodeMapsUrl(code: string): string {
  const encoded = encodeURIComponent(normalisePlusCode(code));
  return `https://maps.google.com/?q=${encoded}`;
}

/**
 * Generate a random booking reference ID
 */
export function generateBookingId(): string {
  const prefix = 'GMX';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Haversine distance in km between two lat/lng pairs.
 */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Decode a full Open Location Code (Plus Code) to approximate lat/lng centre.
 * Only handles full codes (8+ characters before +). Short codes return null.
 */
function decodePlusCode(code: string): { lat: number; lng: number } | null {
  const clean = code.trim().toUpperCase().replaceAll(' ', '');
  const plusIdx = clean.indexOf('+');
  if (plusIdx < 8) return null; // short code — can't decode without reference

  const ALPHABET = '23456789CFGHJMPQRVWX';
  const encoded = clean.replaceAll('+', '');

  let lat = -90;
  let lng = -180;
  let latSize = 400;
  let lngSize = 400;

  for (let i = 0; i < Math.min(encoded.length, 10); i++) {
    const digit = ALPHABET.indexOf(encoded[i]);
    if (digit === -1) return null;
    if (i % 2 === 0) {
      lngSize /= 20;
      lng += digit * lngSize;
    } else {
      latSize /= 20;
      lat += digit * latSize;
    }
  }
  return { lat: lat + latSize / 2, lng: lng + lngSize / 2 };
}

/**
 * Estimate fare in GMD.
 * Uses haversine distance when both addresses are decodable Plus Codes,
 * otherwise falls back to a fixed mid-range estimate.
 */
export function calculateEstimatedFare(pickup: string, dropoff: string): number {
  const BASE_FARE = 50;   // GMD
  const PER_KM = 15;      // GMD per km
  const MINIMUM = 50;     // GMD minimum

  const p = decodePlusCode(pickup);
  const d = decodePlusCode(dropoff);

  let fare: number;
  if (p && d) {
    const km = haversineKm(p.lat, p.lng, d.lat, d.lng);
    fare = BASE_FARE + km * PER_KM;
  } else {
    // Can't calculate — return 0 so the UI shows "Agree on pickup"
    return 0;
  }

  return Math.max(MINIMUM, Math.round(fare / 5) * 5);
}

/**
 * Format currency in Gambian Dalasi
 */
export function formatCurrency(amount: number): string {
  return `GMD ${amount.toFixed(0)}`;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +220 XXX XXXX for Gambian numbers
  if (cleaned.startsWith('220')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Validate phone number (simple validation for Gambian numbers)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replaceAll(/\D/g, '');
  return /^(220)?\d{7}$/.test(cleaned);
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
