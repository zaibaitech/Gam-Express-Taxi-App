import { Redirect } from 'expo-router';
import { useDriverStore } from '../store/driverStore';

export default function Index() {
  const driver = useDriverStore((s) => s.driver);

  if (driver) {
    return <Redirect href="/(driver)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
