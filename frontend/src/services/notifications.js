import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '../api/client';

// Foreground notifications still show a banner/sound (default behavior changed across SDKs).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Push (remote) notifications require a development build on Android from SDK 53+ and won't
// register inside plain Expo Go — this throws there, which is expected, not a bug.
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

// Registers the device's push token against the logged-in profile and wires up notification
// listeners. `onNotificationTapped` fires when the user taps a Sanito reminder, so the caller
// can navigate straight to the chat screen.
export function usePushNotifications(user, onNotificationTapped) {
  const responseListener = useRef();

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync()
      .then((token) => token && api.updateMe({ expoPushToken: token }))
      .catch((err) => console.warn('Push registration falló (¿estás en Expo Go?):', err.message));

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      onNotificationTapped?.(response.notification.request.content);
    });

    return () => responseListener.current?.remove();
  }, [user?.id]);
}
