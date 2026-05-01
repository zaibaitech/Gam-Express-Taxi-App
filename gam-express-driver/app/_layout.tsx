import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { Urbanist_700Bold, Urbanist_600SemiBold } from '@expo-google-fonts/urbanist';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { registerPushToken } from '../lib/notifications';
import { useDriverStore } from '../store/driverStore';
import type { Driver, Booking } from '../lib/supabase';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Urbanist_700Bold,
    Urbanist_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
  });

  const setDriver = useDriverStore((s) => s.setDriver);
  const setIncomingBooking = useDriverStore((s) => s.setIncomingBooking);
  const [authReady, setAuthReady] = useState(false);

  async function loadDriver(userId: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setDriver(data as Driver);
      registerPushToken(userId).catch((err) => {
        console.error('[Notifications] registerPushToken failed', err);
      });
    } else if (error) {
      console.error('[Drivers] Query error:', error);
    }
  }

  useEffect(() => {
    // Restore session on mount
    const initAuth = async () => {
      // 5-second timeout so a network hang never leaves the app on a black screen
      const timeout = setTimeout(() => setAuthReady(true), 5000);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
        } else if (session?.user) {
          try {
            await loadDriver(session.user.id);
          } catch (err) {
            console.error('[Drivers] Exception:', err);
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        clearTimeout(timeout);
        setAuthReady(true);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setDriver(null);
        } else if (session?.user) {
          try {
            await loadDriver(session.user.id);
          } catch (err) {
            console.error('[Drivers] Exception on auth change:', err);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setDriver]);

  // Handle notification taps — covers background taps and cold-launch from killed state
  async function handleNotificationResponse(response: Notifications.NotificationResponse) {
    const bookingId = response.notification.request.content.data?.bookingId as string | undefined;
    if (!bookingId) return;

    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('status', 'pending')
      .is('driver_id', null)
      .single();

    if (data) {
      setIncomingBooking(data as Booking);
      router.replace('/(driver)/home');
    }
  }

  // Cold-launch: app was killed, user tapped the notification to open it
  const lastResponse = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (lastResponse) handleNotificationResponse(lastResponse);
  }, [lastResponse]);

  useEffect(() => {
    // Background/foreground taps
    const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => sub.remove();
  }, [setIncomingBooking]);

  if (!fontsLoaded || !authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor="#0F0F1A" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(driver)" />
      </Stack>
    </>
  );
}
