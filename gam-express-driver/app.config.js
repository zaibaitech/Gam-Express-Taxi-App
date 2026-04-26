// require() works in both local dev and EAS cloud builds.
// EXPO_PUBLIC_* vars in eas.json are injected as process.env by EAS,
// so they are available here during the cloud build without dotenv.
try { require('dotenv').config(); } catch (e) { console.debug('dotenv not loaded:', e.message); }

module.exports = function appConfig({ config }) {
  return {
    ...config,
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      eas: { projectId: config.extra?.eas?.projectId },
    },
  };
};
