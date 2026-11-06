import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Task } from './db';
import { areNotificationsEnabled } from './settings';

// ─── Motivational Messages ────────────────────────────────────────────────────

export const MOTIVATIONAL_MESSAGES = [
  '¡Hazlo ahora, no lo dejes! 💪',
  'Una tarea menos, un paso más adelante ✅',
  '¡Tú puedes! Este es tu momento 🔥',
  'No lo dejes para después ⚡',
  'Recuerda: pequeños pasos, grandes resultados 🎯',
  '¡Vamos! Puedes con esto y mucho más 🚀',
  'El momento perfecto es ahora mismo ⏰',
  'Cada tarea completada es una victoria 🏆',
  'No lo pienses más, ¡empieza ya! 🎯',
];

export function getRandomMotivationalMessage(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

/**
 * Máximo de avisos de seguimiento ("¿Ya lo hiciste?") por tarea.
 * Se programan como avisos sueltos a partir de la hora del recordatorio,
 * nunca más allá del final de ese día. iOS solo admite 64 avisos pendientes
 * en total, por eso hay un tope.
 */
const MAX_FOLLOWUPS = 4;

// ─── Notification Handler (foreground) ───────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Create Android notification channel for high-importance alerts
  if (Platform.OS === 'android' && finalStatus === 'granted') {
    await Notifications.setNotificationChannelAsync('focuson-tasks', {
      name: 'Recordatorios de Tareas',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C63FF',
      sound: 'default',
    });
  }

  return finalStatus === 'granted';
}

// ─── Schedule / Cancel ────────────────────────────────────────────────────────

export interface NotificationIds {
  notification_id: string | null;
  repeat_notification_id: string | null; // JSON array de IDs
}

const NO_IDS: NotificationIds = { notification_id: null, repeat_notification_id: null };

function scheduleAt(title: string, body: string, date: Date, taskId: number): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { taskId },
      ...(Platform.OS === 'android' ? { channelId: 'focuson-tasks' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === 'android' ? { channelId: 'focuson-tasks' } : {}),
    },
  });
}

/**
 * Programa el aviso principal y los de seguimiento de una tarea concreta.
 * No programa nada si: no tiene hora, está completada, es una plantilla de
 * rutina (los avisos van en sus copias diarias) o el usuario los ha desactivado.
 */
export async function scheduleTaskNotification(task: Task): Promise<NotificationIds> {
  if (
    Platform.OS === 'web' ||
    !task.reminder_time ||
    task.is_daily === 1 ||
    task.is_completed === 1 ||
    !areNotificationsEnabled()
  ) {
    return NO_IDS;
  }

  try {
    const [hour, minute] = task.reminder_time.split(':').map((n) => parseInt(n, 10));
    if (isNaN(hour) || isNaN(minute)) return NO_IDS;

    const reminderAt = new Date(task.scheduled_date + 'T00:00:00');
    reminderAt.setHours(hour, minute, 0, 0);
    const now = Date.now();

    let notification_id: string | null = null;
    if (reminderAt.getTime() > now) {
      notification_id = await scheduleAt(
        `📌 ${task.title}`,
        getRandomMotivationalMessage(),
        reminderAt,
        task.id
      );
    }

    // Avisos de seguimiento: reminder + k * intervalo, solo dentro de ese día.
    const followUpIds: string[] = [];
    if (task.repeat_minutes > 0) {
      const endOfDay = new Date(reminderAt);
      endOfDay.setHours(23, 59, 59, 0);
      for (let k = 1; k <= MAX_FOLLOWUPS; k++) {
        const at = new Date(reminderAt.getTime() + k * task.repeat_minutes * 60_000);
        if (at > endOfDay) break;
        if (at.getTime() <= now) continue;
        followUpIds.push(
          await scheduleAt('¿Ya lo hiciste?', `${task.title} sigue pendiente`, at, task.id)
        );
      }
    }

    return {
      notification_id,
      repeat_notification_id: followUpIds.length ? JSON.stringify(followUpIds) : null,
    };
  } catch (e) {
    console.warn('[FocusOn] Error scheduling notification:', e);
    return NO_IDS;
  }
}

/** Acepta el formato nuevo (array JSON) y el antiguo (un único ID). */
function parseIds(value: string | null): string[] {
  if (!value) return [];
  if (value.startsWith('[')) {
    try {
      return JSON.parse(value) as string[];
    } catch {
      return [];
    }
  }
  return [value];
}

export async function cancelTaskNotifications(
  notification_id: string | null,
  repeat_notification_id: string | null
): Promise<void> {
  if (Platform.OS === 'web') return;
  const ids = [...parseIds(notification_id), ...parseIds(repeat_notification_id)];
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn('[FocusOn] Error canceling notification:', e);
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
