// Load .env for local dev (dotenv is a no-op in EAS cloud builds — EAS injects
// EXPO_PUBLIC_* vars directly as process.env, so this just handles local runs).
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: { projectId: config.extra?.eas?.projectId },
  },
});
