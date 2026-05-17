import * as Location from 'expo-location';
import { supabase } from './supabase';

let locationSubscription: Location.LocationSubscription | null = null;
let broadcastInterval: ReturnType<typeof setInterval> | null = null;
let latestPosition: { lat: number; lng: number } | null = null;

/** Request foreground + background location permissions */
export async function requestLocationPermissions(): Promise<boolean> {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') return false;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  // Background is best-effort — app still works without it
  if (bgStatus !== 'granted') {
    console.warn('Background location permission not granted — location updates will pause when app is backgrounded');
  }

  return true;
}

/** Start watching GPS and broadcasting to Supabase every 15 seconds */
export async function startLocationBroadcast(driverId: string): Promise<void> {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    throw new Error('Location permission denied');
  }

  // Watch position continuously for smooth UI
  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 5000,   // update every 5s locally
      distanceInterval: 10, // or every 10 metres
    },
    (location) => {
      latestPosition = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    }
  );

  // Broadcast to Supabase every 15 seconds to be gentle on bandwidth
  broadcastInterval = setInterval(async () => {
    if (!latestPosition) return;
    try {
      await supabase
        .from('drivers')
        .update({
          current_lat: latestPosition.lat,
          current_lng: latestPosition.lng,
        })
        .eq('id', driverId);
    } catch (err) {
      console.error('[Location] broadcast update failed', err);
    }
  }, 15_000);
}

/** Stop watching GPS and mark driver offline */
export async function stopLocationBroadcast(driverId: string): Promise<void> {
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }

  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }

  latestPosition = null;

  try {
    await supabase
      .from('drivers')
      .update({ is_online: false, current_lat: null, current_lng: null })
      .eq('id', driverId);
  } catch (err) {
    console.error('[Location] stopLocationBroadcast failed to mark driver offline', err);
  }
}

/** Get the most recently cached position */
export function getLatestPosition() {
  return latestPosition;
}
