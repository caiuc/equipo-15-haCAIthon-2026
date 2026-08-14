import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { usePushNotifications } from './src/services/notifications';
import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';

function Root() {
  const { user } = useAuth();
  usePushNotifications(user, () => {
    if (navigationRef.isReady()) navigationRef.navigate('Chat');
  });

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
