import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { supabase, phoneToEmail } from '../../lib/supabase';
import { useDriverStore } from '../../store/driverStore';
import type { Driver } from '../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

type Mode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setDriver = useDriverStore((s) => s.setDriver);

  async function handleLogin() {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || !password) {
      Alert.alert('Missing fields', 'Please enter your phone number and password.');
      return;
    }

    setLoading(true);
    try {
      const email = phoneToEmail(trimmedPhone);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        const msg = error.message.includes('Email not confirmed')
          ? 'Account not confirmed. Contact your manager.'
          : 'Incorrect phone number or password.';
        Alert.alert('Login failed', msg);
        return;
      }

      if (!data.user) {
        Alert.alert('Login failed', 'Could not retrieve account. Please try again.');
        return;
      }

      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (driverError || !driverData) {
        Alert.alert('Not a driver account', 'Your account is not registered as a driver. Contact your manager.');
        await supabase.auth.signOut();
        return;
      }

      setDriver(driverData as Driver);
      router.replace('/(driver)/home');
    } catch (err: any) {
      const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
      const msg = isTimeout
        ? 'Server took too long to respond. Check your connection and try again.'
        : (err?.message ?? 'Something went wrong. Please try again.');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const email = phoneToEmail(trimmedPhone);

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        // Translate internal errors — never expose the email format to drivers
        let msg = 'Could not create account. Try again.';
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
          msg = 'This phone number already has an account. Use Sign In instead.';
        } else if (error.message.includes('invalid') || error.message.includes('email')) {
          msg = 'Invalid phone number. Use Gambian format: +220 XXX XXXX';
        } else if (error.message.includes('Password')) {
          msg = 'Password must be at least 6 characters.';
        }
        Alert.alert('Registration failed', msg);
        return;
      }

      if (!data.user) {
        Alert.alert('Registration failed', 'Could not create account. Try again.');
        return;
      }

      // Check a driver profile exists for this phone (pre-created by manager)
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (driverError || !driverData) {
        Alert.alert(
          'Not pre-registered',
          'No driver profile found for this number. Ask your manager to add you first, then register here.',
        );
        await supabase.auth.signOut();
        return;
      }

      setDriver(driverData as Driver);
      router.replace('/(driver)/home');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandSection}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>Gam Express</Text>
            <Text style={styles.brandSub}>Driver App</Text>
          </View>

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <Pressable
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                Sign In
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
                First Time Setup
              </Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'register' && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>
                  Your manager must add your phone number first. Then use this form to set your password.
                </Text>
              </View>
            )}

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+220 XXX XXXX"
              placeholderTextColor="#6B7280"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'register' ? 'new-password' : 'password'}
            />

            {mode === 'register' && (
              <>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor="#6B7280"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                />
              </>
            )}

            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A1A2E" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.footer}>Gam Express Taxi · Banjul, The Gambia</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 16,
  },
  brandName: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 32,
    color: '#F5C518',
    letterSpacing: 1,
  },
  brandSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#F5C518',
  },
  modeTabText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  modeTabTextActive: {
    color: '#1A1A2E',
    fontFamily: 'Urbanist_700Bold',
  },
  form: {
    gap: 8,
  },
  infoBanner: {
    backgroundColor: 'rgba(245,197,24,0.08)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.2)',
    marginBottom: 4,
  },
  infoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#D1A800',
    lineHeight: 18,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  submitBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 18,
    color: '#1A1A2E',
    letterSpacing: 2,
  },
  footer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 40,
  },
});
