import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data) setDriver(data as Driver);
      }
      setAuthReady(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setDriver(null);
        } else if (session?.user) {
          const { data } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data) setDriver(data as Driver);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded || !authReady) return null;

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
