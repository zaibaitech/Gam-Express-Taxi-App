import { Tabs, Redirect } from 'expo-router';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriverStore } from '../../store/driverStore';
import { router } from 'expo-router';

function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function DriverLayout() {
  const driver = useDriverStore((s) => s.driver);
  const activeBooking = useDriverStore((s) => s.activeBooking);
  const insets = useSafeAreaInsets();

  if (!driver) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, { height: 58 + insets.bottom, paddingBottom: insets.bottom + 6 }],
          tabBarActiveTintColor: '#F5C518',
          tabBarInactiveTintColor: '#6B7280',
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🏠" label="Home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="💰" label="Earn" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="📋" label="Trips" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="👤" label="Me" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="active-ride"
          options={{ href: null }}
        />
      </Tabs>

      {/* Active ride floating banner — tappable from anywhere */}
      {activeBooking && (
        <Pressable
          style={[styles.activeRideBanner, { bottom: 58 + insets.bottom + 10 }]}
          onPress={() => router.push('/(driver)/active-ride')}
        >
          <View style={styles.activeRidePulse} />
          <Text style={styles.activeRideBannerText}>
            🚕  Active Ride — Tap to return
          </Text>
          <Text style={styles.activeRideBannerChevron}>›</Text>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1A1A2E',
    borderTopColor: '#2D2D44',
    borderTopWidth: 1,
    height: 68,
    paddingBottom: 10,
    paddingTop: 6,
    elevation: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#6B7280',
    includeFontPadding: false,
  },
  tabLabelFocused: {
    color: '#F5C518',
    fontFamily: 'Inter_500Medium',
  },
  activeRideBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  activeRidePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    opacity: 0.9,
  },
  activeRideBannerText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  activeRideBannerChevron: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
