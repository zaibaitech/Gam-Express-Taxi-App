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
 * Calculate estimated fare based on distance (mock calculation)
 * In a real app, this would use actual routes and pricing
 */
export function calculateEstimatedFare(pickup: string, dropoff: string): number {
  // Mock calculation - in reality would use distance/route calculations
  const basefare = 50; // Base fare in GMD
  const perKmRate = 15; // GMD per km
  
  // Simulate different distances based on location names length (just for demo)
  const mockDistance = Math.max(2, (pickup.length + dropoff.length) / 5);
  
  const fare = basefare + (mockDistance * perKmRate);
  
  // Round to nearest 10 GMD
  return Math.round(fare / 10) * 10;
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
  const cleaned = phone.replace(/\D/g, '');
  // Gambian numbers: +220 followed by 7 digits or just 7 digits
  return /^(220)?[0-9]{7}$/.test(cleaned);
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
