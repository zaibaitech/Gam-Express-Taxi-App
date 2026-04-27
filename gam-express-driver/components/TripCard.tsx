import { View, Text, StyleSheet } from 'react-native';
import type { Booking } from '../lib/supabase';

type Props = {
  booking: Booking;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TripCard({ booking }: Props) {
  const paymentLabel =
    booking.payment_method === 'mobile_money' ? '📱 Mobile Money' : '💵 Cash';

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.ref}>
          {booking.booking_reference ? `#${booking.booking_reference}` : `#${booking.id.slice(0, 8).toUpperCase()}`}
        </Text>
        <Text style={styles.fare}>
          {booking.estimated_fare ? `D ${booking.estimated_fare}` : '—'}
        </Text>
      </View>

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {booking.pickup_address ?? 'Pickup location'}
          </Text>
        </View>
        <View style={styles.vertLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.routeText} numberOfLines={1}>
            {booking.dropoff_address ?? 'Dropoff location'}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.date}>{formatDate(booking.completed_at)}</Text>
        <View style={styles.rightBadges}>
          {booking.rating !== null && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{'⭐'.repeat(booking.rating)} {booking.rating}/5</Text>
            </View>
          )}
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentText}>{paymentLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D2D44',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ref: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  fare: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 20,
    color: '#F5C518',
  },
  routeContainer: {
    gap: 2,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  vertLine: {
    width: 1,
    height: 12,
    backgroundColor: '#2D2D44',
    marginLeft: 4,
    marginVertical: 1,
  },
  routeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#E5E7EB',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  rightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBadge: {
    backgroundColor: 'rgba(245,197,24,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
  },
  ratingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#F5C518',
  },
  paymentBadge: {
    backgroundColor: 'rgba(245,197,24,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.2)',
  },
  paymentText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#D1A800',
  },
});
