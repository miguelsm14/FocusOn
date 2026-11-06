import AsyncStorage from '@react-native-async-storage/async-storage';

// Ajustes del usuario persistidos en el dispositivo.
// Se cargan una vez al arrancar (loadSettings) y se leen de forma síncrona.

const NOTIFICATIONS_KEY = '@focuson_notifications_enabled';

let notificationsEnabled = true;

export async function loadSettings(): Promise<void> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    notificationsEnabled = value !== 'false';
  } catch (e) {
    console.warn('[FocusOn] Error loading settings:', e);
  }
}

export function areNotificationsEnabled(): boolean {
  return notificationsEnabled;
}

export async function setNotificationsEnabled(value: boolean): Promise<void> {
  notificationsEnabled = value;
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, String(value));
  } catch (e) {
    console.warn('[FocusOn] Error saving settings:', e);
  }
}
