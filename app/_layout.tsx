import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { initDB } from '@/lib/db';
import { requestNotificationPermissions } from '@/lib/notifications';
import { loadSettings } from '@/lib/settings';
import { useTaskStore } from '@/store/useTaskStore';
import { UndoToast } from '@/components/UndoToast';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const syncRoutines = useTaskStore((s) => s.syncRoutines);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        // 1. Init database (sync on native / async on web)
        await initDB();
        // 2. Load persisted settings (notifications on/off)
        await loadSettings();
        // 3. Load tasks into Zustand store
        loadTasks();
        // 4. Request notification permissions (async)
        await requestNotificationPermissions();
        // 5. Generate routine copies (and their reminders) for the coming days
        await syncRoutines();
      } catch (e) {
        console.error('[FocusOn] Bootstrap error:', e);
      } finally {
        await SplashScreen.hideAsync();
        setReady(true);
      }
    }
    bootstrap();
  }, []);

  // Tocar una notificación abre la tarea correspondiente
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;

    const openTask = (response: Notifications.NotificationResponse | null) => {
      const taskId = response?.notification.request.content.data?.taskId;
      if (taskId != null) router.push(`/task/${taskId}`);
    };

    // App abierta desde una notificación estando cerrada
    Notifications.getLastNotificationResponseAsync().then((response) => {
      openTask(response);
      if (response) Notifications.clearLastNotificationResponse();
    });

    const sub = Notifications.addNotificationResponseReceivedListener(openTask);
    return () => sub.remove();
  }, [ready]);

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/new"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <UndoToast />
    </>
  );
}
