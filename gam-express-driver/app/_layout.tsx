import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { Urbanist_700Bold, Urbanist_600SemiBold } from '@expo-google-fonts/urbanist';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { supabase } from '../lib/supabase';
import { useDriverStore } from '../store/driverStore';
import type { Driver } from '../lib/supabase';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Urbanist_700Bold,
    Urbanist_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
  });

  const setDriver = useDriverStore((s) => s.setDriver);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Restore session on mount
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('[Auth] Session error:', sessionError);
        } else if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('drivers')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (error) {
              console.error('[Drivers] Query error:', error);
            } else if (data) {
              setDriver(data as Driver);
            }
          } catch (err) {
            console.error('[Drivers] Exception:', err);
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
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
            const { data, error } = await supabase
              .from('drivers')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (error) {
              console.error('[Drivers] Query error on auth change:', error);
            } else if (data) {
              setDriver(data as Driver);
            }
          } catch (err) {
            console.error('[Drivers] Exception on auth change:', err);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setDriver]);

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
