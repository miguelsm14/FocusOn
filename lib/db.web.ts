/**
 * lib/db.web.ts — Web-compatible database layer using AsyncStorage.
 *
 * Expo uses platform-specific file resolution:
 * on web → this file  |  on native → lib/db.ts (SQLite)
 *
 * Strategy: in-memory task cache initialised async from AsyncStorage,
 * with fire-and-forget background persistence after every mutation.
 * All public functions stay synchronous so the Zustand store works unchanged.
 * The public API must match lib/db.ts exactly.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateOf, todayISO } from './dates';

// ─── Types (must match lib/db.ts exactly) ────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low';
export type Category = 'general' | 'trabajo' | 'salud' | 'personal';

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  scheduled_date: string;       // 'YYYY-MM-DD'
  reminder_time: string | null;
  repeat_minutes: number;
  is_completed: number;
  completed_at: string | null;
  created_at: string;
  notification_id: string | null;
  repeat_notification_id: string | null;
  is_daily: number;             // 1 if it's a daily template, 0 otherwise
  parent_id: number | null;     // ID of the template task for generated copies
}

export type NewTask = Omit<
  Task,
  'id' | 'created_at' | 'completed_at' | 'is_completed' | 'notification_id' | 'repeat_notification_id' | 'parent_id'
>;

export interface DailyLogEntry {
  date: string;
  completed_count: number;
  total_count: number;
}

// ─── In-memory store ─────────────────────────────────────────────────────────

const STORAGE_KEY = '@focuson_tasks_v1';
const LOG_STORAGE_KEY = '@focuson_log_v1';

let tasks: Task[] = [];
let dailyLog: DailyLogEntry[] = [];
let nextId = 1;

function persist(): void {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch((e) =>
    console.warn('[FocusOn:web] Persist error:', e)
  );
}

function persistLog(): void {
  AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(dailyLog)).catch((e) =>
    console.warn('[FocusOn:web] Persist log error:', e)
  );
}

// ─── Init (async — awaited in _layout.tsx) ───────────────────────────────────

export async function initDB(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      tasks = (JSON.parse(stored) as Task[]).map((t) => ({
        ...t,
        is_daily: t.is_daily ?? 0,
        parent_id: t.parent_id ?? null,
        repeat_notification_id: t.repeat_notification_id ?? null,
      }));
      nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    }

    const storedLog = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    if (storedLog) {
      dailyLog = JSON.parse(storedLog);
    }
  } catch (e) {
    console.warn('[FocusOn:web] Init error:', e);
    tasks = [];
    dailyLog = [];
    nextId = 1;
  }
}

// ─── Queries (synchronous) ───────────────────────────────────────────────────

function priorityRank(p: Priority): number {
  return p === 'high' ? 1 : p === 'medium' ? 2 : 3;
}

function sortTasks(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed - b.is_completed;
    const pd = priorityRank(a.priority) - priorityRank(b.priority);
    if (pd !== 0) return pd;
    const ta = a.reminder_time ?? '99:99';
    const tb = b.reminder_time ?? '99:99';
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.created_at < b.created_at ? 1 : -1;
  });
}

export function getAllTasks(today: string): Task[] {
  return sortTasks(tasks.filter((t) => t.parent_id === null || t.scheduled_date === today));
}

export function getTaskById(id: number): Task | null {
  return tasks.find((t) => t.id === id) ?? null;
}

export function getTasksByDate(date: string): Task[] {
  return sortTasks(tasks.filter((t) => t.scheduled_date === date && t.is_daily === 0));
}

export function getTasksForToday(today: string): Task[] {
  return sortTasks(
    tasks.filter(
      (t) =>
        t.is_daily === 0 &&
        (t.scheduled_date === today ||
          (t.scheduled_date < today &&
            t.parent_id === null &&
            (t.is_completed === 0 || localDateOf(t.completed_at) === today)))
    )
  );
}

export function getDailyTemplates(): Task[] {
  return tasks.filter((t) => t.is_daily === 1);
}

export function hasRoutineClone(templateId: number, date: string): boolean {
  return tasks.some((t) => t.parent_id === templateId && t.scheduled_date === date);
}

export function getRoutineClones(templateId: number, fromDate: string): Task[] {
  return tasks.filter((t) => t.parent_id === templateId && t.scheduled_date >= fromDate);
}

export function getPendingWithReminder(fromDate: string): Task[] {
  return tasks.filter(
    (t) => t.is_daily === 0 && t.is_completed === 0 && t.reminder_time && t.scheduled_date >= fromDate
  );
}

export function countPending(today: string): number {
  return tasks.filter(
    (t) =>
      t.is_daily === 0 &&
      t.is_completed === 0 &&
      (t.scheduled_date === today || (t.scheduled_date < today && t.parent_id === null))
  ).length;
}

// ─── Mutations (synchronous + background persist) ────────────────────────────

export function createTask(task: NewTask & { parent_id?: number }): number {
  const id = nextId++;
  tasks.push({
    ...task,
    id,
    scheduled_date: task.scheduled_date ?? todayISO(),
    is_completed: 0,
    completed_at: null,
    created_at: new Date().toISOString(),
    notification_id: null,
    repeat_notification_id: null,
    is_daily: task.is_daily ?? 0,
    parent_id: task.parent_id ?? null,
  });
  persist();
  return id;
}

export function updateTask(
  id: number,
  fields: Partial<Omit<Task, 'id' | 'created_at'>>
): void {
  tasks = tasks.map((t) => (t.id === id ? { ...t, ...fields } : t));
  persist();
}

export function deleteTask(id: number): void {
  tasks = tasks.filter((t) => t.id !== id);
  persist();
}

export function toggleTaskComplete(id: number, completed: boolean): void {
  updateTask(id, {
    is_completed: completed ? 1 : 0,
    completed_at: completed ? new Date().toISOString() : null,
  });
}

export function deleteAllTasks(): void {
  tasks = [];
  nextId = 1;
  persist();
}

// ─── Daily log (historial permanente, por incrementos) ───────────────────────

export function bumpDailyLog(date: string, completedDelta: number, totalDelta: number): void {
  const i = dailyLog.findIndex((l) => l.date === date);
  if (i >= 0) {
    const e = dailyLog[i];
    dailyLog[i] = {
      date,
      completed_count: Math.max(e.completed_count + completedDelta, 0),
      total_count: Math.max(e.total_count + totalDelta, 0),
    };
  } else {
    dailyLog.push({
      date,
      completed_count: Math.max(completedDelta, 0),
      total_count: Math.max(totalDelta, 0),
    });
  }
  persistLog();
}

export function getDailyLog(): DailyLogEntry[] {
  return [...dailyLog].sort((a, b) => (a.date < b.date ? 1 : -1));
}
