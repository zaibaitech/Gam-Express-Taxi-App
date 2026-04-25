import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { startLocationBroadcast, stopLocationBroadcast } from '../../lib/location';
import { useDriverStore } from '../../store/driverStore';
import { IncomingRideModal } from '../../components/IncomingRideModal';
import type { Booking } from '../../lib/supabase';

export default function HomeScreen() {
  const driver = useDriverStore((s) => s.driver);
  const isOnline = useDriverStore((s) => s.isOnline);
  const setIsOnline = useDriverStore((s) => s.setIsOnline);
  const setActiveBooking = useDriverStore((s) => s.setActiveBooking);
  const incomingBooking = useDriverStore((s) => s.incomingBooking);
  const setIncomingBooking = useDriverStore((s) => s.setIncomingBooking);
  const earningsToday = useDriverStore((s) => s.earningsToday);
  const tripsToday = useDriverStore((s) => s.tripsToday);
  const setEarningsToday = useDriverStore((s) => s.setEarningsToday);
  const setTripsToday = useDriverStore((s) => s.setTripsToday);

  const [togglingStatus, setTogglingStatus] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  // Pulsing animation for "waiting" state
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isOnline) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      pulseLoop.current?.stop();
    };
  }, [isOnline]);

  // Load today's stats on mount
  useEffect(() => {
    if (!driver) return;
    loadTodayStats();
  }, [driver]);

  async function loadTodayStats() {
    if (!driver) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('bookings')
      .select('estimated_fare')
      .eq('driver_id', driver.id)
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString());

    if (data) {
      const total = data.reduce((sum: number, b: { estimated_fare: number | null }) => sum + (b.estimated_fare ?? 0), 0);
      setEarningsToday(total);
      setTripsToday(data.length);
    }

    // Load average rating from all completed trips with a rating
    const { data: ratingData } = await supabase
      .from('bookings')
      .select('rating')
      .eq('driver_id', driver.id)
      .eq('status', 'completed')
      .not('rating', 'is', null);

    if (ratingData && ratingData.length > 0) {
      const avg = ratingData.reduce((sum: number, b: { rating: number | null }) => sum + (b.rating ?? 0), 0) / ratingData.length;
      setRating(Math.round(avg * 10) / 10);
    }
  }

  // Subscribe to pending bookings when online
  useEffect(() => {
    if (!isOnline || !driver) return;

    const channel = supabase
      .channel('pending-bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: 'status=eq.pending',
        },
        (payload) => {
          const booking = payload.new as Booking;
          // Only show if no driver assigned
          if (!booking.driver_id) {
            setIncomingBooking(booking);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline, driver]);

  async function toggleOnlineStatus() {
    if (!driver) return;
    setTogglingStatus(true);

    try {
      if (!isOnline) {
        // Going ONLINE
        await startLocationBroadcast(driver.id);
        await supabase
          .from('drivers')
          .update({ is_online: true })
          .eq('id', driver.id);
        setIsOnline(true);
      } else {
        // Going OFFLINE
        await stopLocationBroadcast(driver.id);
        setIsOnline(false);
        setIncomingBooking(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not update status. Check location permissions.');
    } finally {
      setTogglingStatus(false);
    }
  }

  async function handleAcceptRide(booking: Booking) {
    if (!driver) return;

    const { data, error } = await supabase
      .from('bookings')
      .update({
        driver_id: driver.id,
        status: 'accepted',
        driver_accepted_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .eq('status', 'pending') // Optimistic lock — only claim if still pending
      .is('driver_id', null)
      .select('*')
      .single();

    if (error || !data) {
      Alert.alert(
        'Ride taken',
        error?.message ?? 'This ride was already accepted by another driver.'
      );
      setIncomingBooking(null);
      return;
    }

    setActiveBooking({ ...booking, driver_id: driver.id, status: 'accepted' });
    setIncomingBooking(null);
    router.push('/(driver)/active-ride');
  }

  function handleDeclineRide() {
    setIncomingBooking(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey, {driver?.full_name?.split(' ')[0]} 👋</Text>
            <Text style={styles.vehicleTag}>{driver?.vehicle_plate} · {driver?.vehicle_model}</Text>
          </View>
          <View style={[styles.statusBadge, isOnline ? styles.statusBadgeOnline : styles.statusBadgeOffline]}>
            <Text style={styles.statusBadgeText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
        </View>

        {/* Big toggle button */}
        <View style={styles.toggleSection}>
          <Pressable
            onPress={toggleOnlineStatus}
            disabled={togglingStatus}
            style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
          >
            <Animated.View
              style={[
                styles.toggleBtn,
                isOnline ? styles.toggleBtnOnline : styles.toggleBtnOffline,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              {togglingStatus ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.toggleBtnEmoji}>{isOnline ? '🟢' : '🔴'}</Text>
                  <Text style={styles.toggleBtnLabel}>
                    {isOnline ? 'GO\nOFFLINE' : 'GO\nONLINE'}
                  </Text>
                </>
              )}
            </Animated.View>
          </Pressable>

          <Text style={styles.toggleHint}>
            {isOnline
              ? 'Waiting for ride requests...'
              : 'Tap to start accepting rides'}
          </Text>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tripsToday}</Text>
            <Text style={styles.statLabel}>Trips Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>D {earningsToday.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Earnings Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[
              styles.statusDot,
              isOnline ? styles.statusDotOnline : styles.statusDotOffline,
            ]} />
            <Text style={styles.statLabel}>{isOnline ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>

        {/* Rating + Support row */}
        <View style={styles.quickRow}>
          <View style={styles.ratingCard}>
            <Text style={styles.ratingEmoji}>⭐</Text>
            <Text style={styles.ratingValue}>
              {rating !== null ? rating.toFixed(1) : '—'}
            </Text>
            <Text style={styles.ratingLabel}>Your Rating</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.supportCard, pressed && { opacity: 0.8 }]}
            onPress={() => Linking.openURL('tel:+2203456789')}
          >
            <Text style={styles.supportEmoji}>📞</Text>
            <Text style={styles.supportTitle}>Support</Text>
            <Text style={styles.supportSub}>Call us anytime</Text>
          </Pressable>
        </View>

        {/* Online tip */}
        {isOnline && (
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              📍 Your location is being shared every 15 seconds. Ride requests will appear automatically.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Incoming Ride Modal */}
      {incomingBooking && (
        <IncomingRideModal
          booking={incomingBooking}
          onAccept={handleAcceptRide}
          onDecline={handleDeclineRide}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 16,
    marginBottom: 8,
  },
  greeting: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  vehicleTag: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusBadgeOnline: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  statusBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  toggleSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  toggleBtn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    gap: 4,
  },
  toggleBtnOnline: {
    backgroundColor: '#22C55E',
  },
  toggleBtnOffline: {
    backgroundColor: '#EF4444',
  },
  toggleBtnEmoji: {
    fontSize: 32,
  },
  toggleBtnLabel: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 24,
  },
  toggleHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 20,
    textAlign: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 22,
    color: '#F5C518',
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#2D2D44',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusDotOnline: {
    backgroundColor: '#22C55E',
  },
  statusDotOffline: {
    backgroundColor: '#EF4444',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 4,
  },
  ratingCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  ratingEmoji: { fontSize: 24 },
  ratingValue: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 26,
    color: '#F5C518',
  },
  ratingLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },
  supportCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  supportEmoji: { fontSize: 24 },
  supportTitle: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  supportSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },
  tipCard: {
    backgroundColor: 'rgba(245, 197, 24, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 24, 0.2)',
  },
  tipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#D1A800',
    lineHeight: 20,
  },
});
