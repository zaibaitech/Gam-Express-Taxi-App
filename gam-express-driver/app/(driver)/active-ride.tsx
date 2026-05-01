import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useDriverStore } from '../../store/driverStore';
import type { BookingStatus } from '../../lib/supabase';

type StatusConfig = {
  btnLabel: string;
  nextStatus: BookingStatus;
  btnColor: string;
};

const PLUS_CODE_RE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,}$/i;
function isPlusCode(v: string) { return PLUS_CODE_RE.test(v.trim()); }
function openInMaps(address: string) {
  Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address.trim())}`);
}
function navigateTo(address: string) {
  const encoded = encodeURIComponent(address.trim());
  Linking.canOpenURL('waze://').then((wazeAvailable) => {
    if (wazeAvailable) {
      Linking.openURL(`waze://?q=${encoded}&navigate=yes`);
    } else {
      Linking.openURL(`https://maps.google.com/?q=${encoded}&navigate=yes`);
    }
  });
}

const STATUS_FLOW: Partial<Record<BookingStatus, StatusConfig>> = {
  accepted: {
    btnLabel: "I'VE ARRIVED",
    nextStatus: 'arrived',
    btnColor: '#F5C518',
  },
  arrived: {
    btnLabel: 'START TRIP',
    nextStatus: 'en_route',
    btnColor: '#3B82F6',
  },
  en_route: {
    btnLabel: 'COMPLETE TRIP',
    nextStatus: 'completed',
    btnColor: '#22C55E',
  },
};

export default function ActiveRideScreen() {
  const activeBooking = useDriverStore((s) => s.activeBooking);
  const setActiveBooking = useDriverStore((s) => s.setActiveBooking);
  const driver = useDriverStore((s) => s.driver);
  const setEarningsToday = useDriverStore((s) => s.setEarningsToday);
  const setTripsToday = useDriverStore((s) => s.setTripsToday);
  const earningsToday = useDriverStore((s) => s.earningsToday);
  const tripsToday = useDriverStore((s) => s.tripsToday);

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);

  // Subscribe to real-time cancellation by admin/customer
  useEffect(() => {
    if (!activeBooking) return;

    const channel = supabase
      .channel(`booking-${activeBooking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${activeBooking.id}`,
        },
        (payload) => {
          const updated = payload.new;
          if (updated.status === 'cancelled') {
            Alert.alert(
              'Ride Cancelled',
              'This ride has been cancelled.',
              [{ text: 'OK', onPress: () => { setActiveBooking(null); router.replace('/(driver)/home'); } }]
            );
          } else {
            setActiveBooking({ ...activeBooking, ...updated });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBooking?.id]);

  function onTripCompleted() {
    setEarningsToday(earningsToday + (activeBooking?.estimated_fare ?? 0));
    setTripsToday(tripsToday + 1);
    setShowCompletionSheet(true);
  }

  async function advanceStatus() {
    if (!activeBooking || !driver) return;
    const config = STATUS_FLOW[activeBooking.status];
    if (!config) return;

    setUpdatingStatus(true);
    const isCompleting = config.nextStatus === 'completed';
    const updatePayload: Record<string, unknown> = { status: config.nextStatus };
    if (isCompleting) updatePayload.completed_at = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updatePayload)
        .eq('id', activeBooking.id)
        .select('*')
        .single();

      if (error || !data) throw error ?? new Error('Could not update ride status.');

      setActiveBooking({ ...activeBooking, status: config.nextStatus });
      if (isCompleting) onTripCompleted();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not update ride status.');
    } finally {
      setUpdatingStatus(false);
    }
  }

  function confirmCancelRide() {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride? The passenger will be notified.',
      [
        { text: 'Keep Ride', style: 'cancel' },
        { text: 'Cancel Ride', style: 'destructive', onPress: handleCancelRide },
      ]
    );
  }

  async function handleCancelRide() {
    if (!activeBooking) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', activeBooking.id);
      if (error) throw error;
      setActiveBooking(null);
      router.replace('/(driver)/home');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not cancel ride.');
    } finally {
      setCancelling(false);
    }
  }

  const navigateTarget =
    activeBooking?.status === 'en_route'
      ? activeBooking.dropoff_address
      : activeBooking?.pickup_address;

  function openPhone() {
    if (!activeBooking?.customer_phone) return;
    Linking.openURL(`tel:${activeBooking.customer_phone}`);
  }

  function openWhatsApp() {
    if (!activeBooking?.customer_phone) return;
    const digits = activeBooking.customer_phone.replaceAll(/\D/g, '');
    Linking.openURL(`https://wa.me/${digits}`);
  }

  function handleCompletionDone() {
    setShowCompletionSheet(false);
    setActiveBooking(null);
    router.replace('/(driver)/home');
  }

  if (!activeBooking) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active ride.</Text>
          <Pressable onPress={() => router.replace('/(driver)/home')} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_FLOW[activeBooking.status];

  const statusLabels: Record<BookingStatus, string> = {
    pending: 'Pending',
    accepted: 'Heading to Pickup',
    arrived: 'At Pickup — Waiting',
    en_route: 'En Route to Dropoff',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Status header */}
      <View style={styles.statusHeader}>
        <Text style={styles.statusHeaderText}>{statusLabels[activeBooking.status]}</Text>
        {activeBooking.booking_reference && (
          <Text style={styles.statusHeaderRef}>#{activeBooking.booking_reference}</Text>
        )}
      </View>

      {/* Bottom info panel */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer card */}
        <View style={styles.customerCard}>
          <View style={styles.customerInfo}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View>
              <Text style={styles.customerName}>
                {activeBooking.customer_name ?? 'Customer'}
              </Text>
              <Text style={styles.customerPhone}>
                {activeBooking.customer_phone ?? 'No phone provided'}
              </Text>
            </View>
          </View>
          <View style={styles.contactBtns}>
            <Pressable
              style={({ pressed }) => [styles.contactBtn, styles.callBtn, pressed && { opacity: 0.8 }]}
              onPress={openPhone}
            >
              <Text style={styles.contactBtnText}>📞 Call</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.contactBtn, styles.whatsappBtn, pressed && { opacity: 0.8 }]}
              onPress={openWhatsApp}
            >
              <Text style={styles.contactBtnText}>💬 WhatsApp</Text>
            </Pressable>
          </View>
        </View>

        {/* Route summary */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#22C55E' }]} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Pressable onPress={() => activeBooking.pickup_address && openInMaps(activeBooking.pickup_address)}>
                <Text style={isPlusCode(activeBooking.pickup_address ?? '') ? [styles.routeAddress, styles.plusCode] : styles.routeAddress}>
                  {activeBooking.pickup_address ?? 'Location on map'}
                </Text>
                {isPlusCode(activeBooking.pickup_address ?? '') && (
                  <Text style={styles.plusCodeHint}>📍 Tap to navigate</Text>
                )}
              </Pressable>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
            <View style={styles.routeText}>
              <Text style={styles.routeLabel}>DROPOFF</Text>
              <Pressable onPress={() => activeBooking.dropoff_address && openInMaps(activeBooking.dropoff_address)}>
                <Text style={isPlusCode(activeBooking.dropoff_address ?? '') ? [styles.routeAddress, styles.plusCode] : styles.routeAddress}>
                  {activeBooking.dropoff_address ?? 'Location on map'}
                </Text>
                {isPlusCode(activeBooking.dropoff_address ?? '') && (
                  <Text style={styles.plusCodeHint}>📍 Tap to navigate</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Fare + payment */}
        <View style={styles.fareRow}>
          <View>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareValue}>
              {activeBooking.estimated_fare ? `D ${activeBooking.estimated_fare}` : 'Agree on pickup'}
            </Text>
          </View>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentBadgeText}>
              {activeBooking.payment_method === 'mobile_money' ? '📱 Mobile Money' : '💵 Cash'}
            </Text>
          </View>
        </View>

        {/* Navigate button */}
        {!!navigateTarget && (
          <Pressable
            style={({ pressed }) => [styles.navigateBtn, pressed && { opacity: 0.88 }]}
            onPress={() => navigateTo(navigateTarget)}
          >
            <Text style={styles.navigateBtnIcon}>🗺️</Text>
            <View>
              <Text style={styles.navigateBtnLabel}>Navigate</Text>
              <Text style={styles.navigateBtnSub}>
                {activeBooking.status === 'en_route' ? 'To Dropoff' : 'To Pickup'} · Waze / Google Maps
              </Text>
            </View>
            <Text style={styles.navigateBtnChevron}>›</Text>
          </Pressable>
        )}

        {/* Action button */}
        {statusConfig && (
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: statusConfig.btnColor },
              pressed && { opacity: 0.88 },
              updatingStatus && { opacity: 0.6 },
            ]}
            onPress={advanceStatus}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.actionBtnText}>{statusConfig.btnLabel}</Text>
            )}
          </Pressable>
        )}

        {/* Cancel ride — only available before trip starts (accepted/arrived) */}
        {(activeBooking.status === 'accepted' || activeBooking.status === 'arrived') && (
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.8 }]}
            onPress={confirmCancelRide}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="#EF4444" size="small" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancel Ride</Text>
            )}
          </Pressable>
        )}
      </ScrollView>

      {/* Trip Completion Sheet */}
      <Modal transparent visible={showCompletionSheet} animationType="slide">
        <View style={styles.completionOverlay}>
          <View style={styles.completionSheet}>
            <Text style={styles.completionEmoji}>🎉</Text>
            <Text style={styles.completionTitle}>Trip Complete!</Text>
            <Text style={styles.completionFare}>
              {activeBooking.estimated_fare ? `D ${activeBooking.estimated_fare}` : 'Collect fare'}
            </Text>
            <Text style={styles.completionFareLabel}>
              {activeBooking.payment_method === 'mobile_money'
                ? 'Collect via Mobile Money'
                : 'Collect Cash from Passenger'}
            </Text>
            <Text style={styles.completionStats}>
              Today: {tripsToday} trips · D {earningsToday.toFixed(0)} earned
            </Text>
            <Pressable
              style={({ pressed }) => [styles.completionBtn, pressed && { opacity: 0.88 }]}
              onPress={handleCompletionDone}
            >
              <Text style={styles.completionBtnText}>DONE — BACK TO HOME</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  statusHeader: {
    backgroundColor: '#1A1A2E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#F5C518',
    alignItems: 'center',
  },
  statusHeaderText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 16,
    color: '#F5C518',
    letterSpacing: 0.5,
  },
  statusHeaderRef: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  panel: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  panelContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 64,
  },
  customerCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D2D44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  customerName: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  customerPhone: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  contactBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  callBtn: {
    backgroundColor: '#1E3A5F',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  whatsappBtn: {
    backgroundColor: '#1A3A25',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  contactBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
  },
  routeCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D2D44',
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
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#2D2D44',
    marginLeft: 5,
    marginVertical: 2,
  },
  routeText: {
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
  },
  fareLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  fareValue: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 26,
    color: '#F5C518',
    marginTop: 2,
  },
  paymentBadge: {
    backgroundColor: 'rgba(245,197,24,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.25)',
  },
  paymentBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#F5C518',
  },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  cancelBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  cancelBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#9CA3AF',
  },
  backBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 16,
    color: '#1A1A2E',
  },
  // Completion sheet
  completionOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  completionSheet: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 32,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 2,
    borderTopColor: '#22C55E',
  },
  completionEmoji: {
    fontSize: 56,
  },
  completionTitle: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  completionFare: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 40,
    color: '#F5C518',
    marginTop: 4,
  },
  completionFareLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  completionStats: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  completionBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  completionBtnText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A5F',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 12,
  },
  navigateBtnIcon: {
    fontSize: 26,
  },
  navigateBtnLabel: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  navigateBtnSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  navigateBtnChevron: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 24,
    color: '#3B82F6',
    marginLeft: 'auto',
  },
  plusCode: {
    fontFamily: 'Inter_500Medium',
    color: '#F5C518',
    letterSpacing: 0.5,
  },
  plusCodeHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
