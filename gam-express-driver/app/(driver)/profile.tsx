import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { supabase } from '../../lib/supabase';
import { stopLocationBroadcast } from '../../lib/location';
import { useDriverStore } from '../../store/driverStore';

export default function ProfileScreen() {
  const driver = useDriverStore((s) => s.driver);
  const isOnline = useDriverStore((s) => s.isOnline);
  const setDriver = useDriverStore((s) => s.setDriver);
  const reset = useDriverStore((s) => s.reset);

  const [fullName, setFullName] = useState(driver?.full_name ?? '');
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [vehiclePlate, setVehiclePlate] = useState(driver?.vehicle_plate ?? '');
  const [vehicleModel, setVehicleModel] = useState(driver?.vehicle_model ?? '');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSave() {
    if (!driver) return;
    if (!fullName.trim() || !phone.trim() || !vehiclePlate.trim() || !vehicleModel.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          vehicle_plate: vehiclePlate.trim().toUpperCase(),
          vehicle_model: vehicleModel.trim(),
        })
        .eq('id', driver.id)
        .select()
        .single();

      if (error) throw error;
      setDriver(data);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  function confirmLogout() {
    Alert.alert(
      'Sign Out',
      isOnline
        ? 'You are currently online. Going offline and signing out?'
        : 'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: handleLogout },
      ]
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      if (isOnline && driver) {
        // Best-effort — don't block logout if location update fails
        await stopLocationBroadcast(driver.id).catch((err) =>
          console.error('[Profile] stopLocationBroadcast failed during logout', err)
        );
      }
      // Best-effort sign out — clear local state regardless of network result
      await supabase.auth.signOut().catch((err) =>
        console.error('[Profile] supabase.auth.signOut failed', err)
      );
      reset();
      router.replace('/(auth)/login');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not sign out.');
    } finally {
      setLoggingOut(false);
    }
  }

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🚕</Text>
          </View>
          <Text style={styles.driverName}>{driver?.full_name ?? '—'}</Text>
          <Text style={styles.driverId}>Driver ID: {driver?.id?.slice(0, 8).toUpperCase()}</Text>
        </View>

        {/* Edit form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ousman Jallow"
            placeholderTextColor="#6B7280"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+220 XXX XXXX"
            placeholderTextColor="#6B7280"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VEHICLE DETAILS</Text>

          <Text style={styles.label}>Plate Number</Text>
          <TextInput
            style={styles.input}
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
            placeholder="BJL 1234"
            placeholderTextColor="#6B7280"
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Vehicle Model</Text>
          <TextInput
            style={styles.input}
            value={vehicleModel}
            onChangeText={setVehicleModel}
            placeholder="Toyota Corolla 2018"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Save button */}
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.88 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
          )}
        </Pressable>

        {/* Logout button */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.88 }]}
          onPress={confirmLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          )}
        </Pressable>

        {/* App version */}
        <Text style={styles.version}>Gam Express Driver v{appVersion}</Text>
        <Text style={styles.versionSub}>© Gam Express Taxi · Banjul, The Gambia</Text>
      </ScrollView>
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
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    paddingTop: 16,
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1A1A2E',
    borderWidth: 2,
    borderColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarEmoji: {
    fontSize: 42,
  },
  driverName: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 22,
    color: '#FFFFFF',
  },
  driverId: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2D2D44',
    marginBottom: 4,
  },
  saveBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 16,
    color: '#1A1A2E',
    letterSpacing: 1.5,
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
    marginBottom: 32,
  },
  logoutBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: '#EF4444',
  },
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  versionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    marginTop: 4,
  },
});
