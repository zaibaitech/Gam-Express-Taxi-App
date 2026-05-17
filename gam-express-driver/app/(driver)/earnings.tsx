'use client';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useDriverStore } from '../../store/driverStore';
import type { Booking } from '../../lib/supabase';

type Period = 'today' | 'week' | 'month';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

function getStartDate(period: Period): Date {
  const d = new Date();
  if (period === 'today') {
    d.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
  } else {
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function EarningsScreen() {
  const driver = useDriverStore((s) => s.driver);
  const [period, setPeriod] = useState<Period>('today');
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [period, driver]);

  async function fetchEarnings() {
    if (!driver) return;
    setLoading(true);

    try {
      const start = getStartDate(period);
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('status', 'completed')
        .gte('completed_at', start.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setTrips((data as Booking[]) ?? []);
    } catch (err) {
      console.error('[Earnings] fetchEarnings failed', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  const totalEarnings = trips.reduce((sum, b) => sum + (b.estimated_fare ?? 0), 0);
  const avgEarnings = trips.length > 0 ? totalEarnings / trips.length : 0;
  const cashTrips = trips.filter((b) => b.payment_method === 'cash').length;
  const mmTrips = trips.filter((b) => b.payment_method === 'mobile_money').length;

  // Build a simple bar chart by hour (today) or by day (week/month)
  const barData = buildBarData(trips, period);
  const maxBarValue = Math.max(...barData.map((b) => b.value), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Earnings</Text>
        </View>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <Pressable
              key={p.key}
              style={[styles.periodTab, period === p.key && styles.periodTabActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodTabText, period === p.key && styles.periodTabTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#F5C518" size="large" />
          </View>
        ) : (
          <>
            {/* Big earnings number */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Total Earned</Text>
              <Text style={styles.heroValue}>D {totalEarnings.toFixed(0)}</Text>
              <Text style={styles.heroSub}>{trips.length} completed trips</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>D {avgEarnings.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Avg / Trip</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{cashTrips}</Text>
                <Text style={styles.statLabel}>💵 Cash</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{mmTrips}</Text>
                <Text style={styles.statLabel}>📱 Mobile</Text>
              </View>
            </View>

            {/* Bar chart */}
            {barData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>
                  {period === 'today' ? 'Earnings by Hour' : 'Earnings by Day'}
                </Text>
                <View style={styles.chartArea}>
                  {barData.map((bar) => (
                    <View key={bar.label} style={styles.barGroup}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { height: `${Math.round((bar.value / maxBarValue) * 100)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{bar.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Recent trips list */}
            {trips.length > 0 ? (
              <View style={styles.tripsSection}>
                <Text style={styles.tripsSectionTitle}>RECENT TRIPS</Text>
                {trips.slice(0, 20).map((trip) => (
                  <View key={trip.id} style={styles.tripRow}>
                    <View style={styles.tripLeft}>
                      <Text style={styles.tripRef}>#{trip.id.slice(0, 6).toUpperCase()}</Text>
                      <Text style={styles.tripRoute} numberOfLines={1}>
                        {trip.pickup_address ?? 'Pickup'} → {trip.dropoff_address ?? 'Dropoff'}
                      </Text>
                      <Text style={styles.tripTime}>
                        {formatDate(trip.completed_at ?? null)}  ·  {formatTime(trip.completed_at ?? null)}
                      </Text>
                    </View>
                    <View style={styles.tripRight}>
                      <Text style={styles.tripFare}>
                        D {trip.estimated_fare?.toFixed(0) ?? '—'}
                      </Text>
                      <View style={[
                        styles.tripPayBadge,
                        trip.payment_method === 'mobile_money' && styles.tripPayBadgeMM,
                      ]}>
                        <Text style={styles.tripPayText}>
                          {trip.payment_method === 'mobile_money' ? '📱' : '💵'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>💰</Text>
                <Text style={styles.emptyText}>No earnings yet</Text>
                <Text style={styles.emptySub}>
                  {period === 'today'
                    ? 'Go online to start earning today!'
                    : 'No completed trips in this period.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function buildBarData(trips: Booking[], period: Period): { label: string; value: number }[] {
  if (period === 'today') {
    const hours: Record<number, number> = {};
    for (let h = 6; h <= 22; h++) hours[h] = 0;
    trips.forEach((t) => {
      if (!t.completed_at) return;
      const h = new Date(t.completed_at).getHours();
      if (h in hours) hours[h] += t.estimated_fare ?? 0;
    });
    return Object.entries(hours).map(([h, v]) => ({
      label: `${h}`,
      value: v,
    }));
  }

  // week or month — group by day
  const days: Record<string, number> = {};
  trips.forEach((t) => {
    if (!t.completed_at) return;
    const d = new Date(t.completed_at);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    days[key] = (days[key] ?? 0) + (t.estimated_fare ?? 0);
  });
  return Object.entries(days)
    .map(([label, value]) => ({ label, value }))
    .slice(0, 14);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginVertical: 16,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  periodTabActive: {
    backgroundColor: '#F5C518',
    borderColor: '#F5C518',
  },
  periodTabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#9CA3AF',
  },
  periodTabTextActive: {
    color: '#1A1A2E',
    fontFamily: 'Inter_500Medium',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  heroCard: {
    marginHorizontal: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D44',
    marginBottom: 12,
  },
  heroLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 52,
    color: '#F5C518',
    marginTop: 4,
  },
  heroSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D44',
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: '#2D2D44' },
  statValue: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },
  chartCard: {
    marginHorizontal: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2D2D44',
    marginBottom: 20,
  },
  chartTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    gap: 4,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    maxWidth: 20,
  },
  barFill: {
    backgroundColor: '#F5C518',
    borderRadius: 4,
    minHeight: 4,
    width: '100%',
  },
  barLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 8,
    color: '#6B7280',
  },
  tripsSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  tripsSectionTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  tripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  tripLeft: { flex: 1, gap: 3, marginRight: 12 },
  tripRef: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#F5C518',
    letterSpacing: 0.5,
  },
  tripRoute: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
  },
  tripTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#6B7280',
  },
  tripRight: { alignItems: 'flex-end', gap: 6 },
  tripFare: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 17,
    color: '#F5C518',
  },
  tripPayBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tripPayBadgeMM: {
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  tripPayText: { fontSize: 12 },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 10,
    marginBottom: 40,
  },
  emptyEmoji: { fontSize: 52 },
  emptyText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
