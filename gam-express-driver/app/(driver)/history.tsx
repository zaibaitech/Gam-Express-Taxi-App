import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { useDriverStore } from '../../store/driverStore';
import { TripCard } from '../../components/TripCard';
import type { Booking } from '../../lib/supabase';

type Filter = 'today' | 'week' | 'all';

export default function HistoryScreen() {
  const driver = useDriverStore((s) => s.driver);
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('week');

  useEffect(() => {
    fetchTrips();
  }, [filter, driver]);

  async function fetchTrips() {
    if (!driver) return;
    setLoading(true);

    try {
      let query = supabase
        .from('bookings')
        .select('*')
        .eq('driver_id', driver.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('completed_at', today.toISOString());
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('completed_at', weekAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setTrips((data as Booking[]) ?? []);
    } catch (err) {
      console.error('[History] fetchTrips failed', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  const totalEarnings = trips.reduce((sum, b) => sum + (b.estimated_fare ?? 0), 0);

  function emptySubtext(f: Filter) {
    if (f === 'today') return 'No trips today — go online to start earning!';
    if (f === 'week') return 'No trips this week — go online to start earning!';
    return 'No trips found for this period.';
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Trip History</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{trips.length}</Text>
          <Text style={styles.summaryLabel}>Trips</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>D {totalEarnings.toFixed(0)}</Text>
          <Text style={styles.summaryLabel}>Earned</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {trips.length > 0 ? `D ${(totalEarnings / trips.length).toFixed(0)}` : '—'}
          </Text>
          <Text style={styles.summaryLabel}>Avg / Trip</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#F5C518" />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>No completed trips yet</Text>
          <Text style={styles.emptySubtext}>
            {emptySubtext(filter)}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TripCard booking={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D44',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 22,
    color: '#F5C518',
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9CA3AF',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#2D2D44',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  filterTabActive: {
    backgroundColor: '#F5C518',
    borderColor: '#F5C518',
  },
  filterTabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#9CA3AF',
  },
  filterTabTextActive: {
    color: '#1A1A2E',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
});
