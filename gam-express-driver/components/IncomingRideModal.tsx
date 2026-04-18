import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import type { Booking } from '../lib/supabase';

const COUNTDOWN_SECONDS = 15;

type Props = {
  booking: Booking;
  onAccept: (booking: Booking) => void;
  onDecline: () => void;
};

export function IncomingRideModal({ booking, onAccept, onDecline }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const slideAnim = useRef(new Animated.Value(400)).current; // starts off-screen below

  // Slide up on mount + haptic
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Vibration.vibrate([0, 300, 100, 300]);

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 10,
    }).start();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      onDecline();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const paymentLabel = booking.payment_method === 'mobile_money'
    ? '📱 Mobile Money'
    : '💵 Cash';

  const countdownColor = secondsLeft <= 5 ? '#EF4444' : secondsLeft <= 10 ? '#F5C518' : '#22C55E';

  return (
    <Modal
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>🚨 New Ride Request!</Text>
            <View style={[styles.countdown, { borderColor: countdownColor }]}>
              <Text style={[styles.countdownText, { color: countdownColor }]}>
                {secondsLeft}s
              </Text>
            </View>
          </View>

          {/* Booking reference */}
          {booking.booking_reference && (
            <Text style={styles.refText}>Ref: {booking.booking_reference}</Text>
          )}

          {/* Customer info */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>
              {booking.customer_name ?? `Rider #${booking.booking_reference?.slice(-4) ?? '—'}`}
            </Text>
          </View>

          {/* Route */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.routeDotGreen]} />
              <View style={styles.routeTextWrapper}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {booking.pickup_address ?? 'Location shared'}
                </Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.routeRow}>
              <View style={[styles.routeDot, styles.routeDotRed]} />
              <View style={styles.routeTextWrapper}>
                <Text style={styles.routeLabel}>DROPOFF</Text>
                <Text style={styles.routeAddress} numberOfLines={2}>
                  {booking.dropoff_address ?? 'Location shared'}
                </Text>
              </View>
            </View>
          </View>

          {/* Fare & Payment */}
          <View style={styles.fareRow}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Est. Fare</Text>
              <Text style={styles.fareValue}>
                {booking.estimated_fare ? `D ${booking.estimated_fare}` : 'Agree on pickup'}
              </Text>
            </View>
            <View style={styles.paymentBadge}>
              <Text style={styles.paymentText}>{paymentLabel}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.8 }]}
              onPress={onDecline}
            >
              <Text style={styles.declineBtnText}>❌  DECLINE</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.88 }]}
              onPress={() => onAccept(booking)}
            >
              <Text style={styles.acceptBtnText}>✅  ACCEPT</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 2,
    borderTopColor: '#F5C518',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
  },
  countdown: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 16,
  },
  refText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9CA3AF',
  },
  infoValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  routeCard: {
    backgroundColor: '#0F0F1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 14,
  },
  routeDotGreen: {
    backgroundColor: '#22C55E',
  },
  routeDotRed: {
    backgroundColor: '#EF4444',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#2D2D44',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeTextWrapper: {
    flex: 1,
  },
  routeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 2,
  },
  routeAddress: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  fareItem: {},
  fareLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  fareValue: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 24,
    color: '#F5C518',
    marginTop: 2,
  },
  paymentBadge: {
    backgroundColor: 'rgba(245, 197, 24, 0.12)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 24, 0.3)',
  },
  paymentText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#F5C518',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  declineBtnText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 15,
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
