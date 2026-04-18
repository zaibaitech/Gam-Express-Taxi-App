// Explicitly loads EXPO_PUBLIC_ vars from .env into the bundle
// This ensures env vars are available on all Expo SDK versions
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
