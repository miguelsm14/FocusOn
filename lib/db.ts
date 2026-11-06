import * as SQLite from 'expo-sqlite';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low';
export type Category = 'general' | 'trabajo' | 'salud' | 'personal';

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  scheduled_date: string;       // 'YYYY-MM-DD' — the day this task belongs to
  reminder_time: string | null; // 'HH:mm' format or null
  repeat_minutes: number;       // 0 = no repeat
  is_completed: number;         // 0 or 1 (SQLite has no boolean)
  completed_at: string | null;
  created_at: string;
  notification_id: string | null;
  repeat_notification_id: string | null; // JSON array of follow-up notification IDs
  is_daily: number;             // 1 if it's a daily template, 0 otherwise
  parent_id: number | null;     // ID of the template task for generated copies
}

export type NewTask = Omit<
  Task,
  'id' | 'created_at' | 'completed_at' | 'is_completed' | 'notification_id' | 'repeat_notification_id' | 'parent_id'
>;

export interface DailyLogEntry {
  date: string;
  completed_count: number; // tareas completadas ESE día (según completed_at)
  total_count: number;     // tareas programadas para ese día
}

// ─── Database Instance ────────────────────────────────────────────────────────

let db: SQLite.SQLiteDatabase;

export function initDB(): void {
  if (db) return; // Already initialized
  db = SQLite.openDatabaseSync('focuson.db');
  db.execSync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      title           TEXT    NOT NULL,
      description     TEXT    DEFAULT '',
      priority        TEXT    DEFAULT 'medium',
      category        TEXT    DEFAULT 'general',
      scheduled_date  TEXT    DEFAULT (date('now', 'localtime')),
      reminder_time   TEXT,
      repeat_minutes  INTEGER DEFAULT 0,
      is_completed    INTEGER DEFAULT 0,
      completed_at    TEXT,
      created_at      TEXT    DEFAULT CURRENT_TIMESTAMP,
      notification_id TEXT,
      repeat_notification_id TEXT,
      is_daily        INTEGER DEFAULT 0,
      parent_id       INTEGER
    );
  `);
  db.execSync(`
    CREATE TABLE IF NOT EXISTS daily_log (
      date TEXT PRIMARY KEY,
      completed_count INTEGER DEFAULT 0,
      total_count INTEGER DEFAULT 0
    )
  `);
  // Migrations for older databases (each one fails silently if already applied)
  try {
    db.execSync(`ALTER TABLE tasks ADD COLUMN scheduled_date TEXT`);
    db.execSync(`UPDATE tasks SET scheduled_date = date('now', 'localtime') WHERE scheduled_date IS NULL`);
  } catch (_) { }
  try { db.execSync(`ALTER TABLE tasks ADD COLUMN is_daily INTEGER DEFAULT 0`); } catch (_) { }
  try { db.execSync(`ALTER TABLE tasks ADD COLUMN parent_id INTEGER`); } catch (_) { }
  try { db.execSync(`ALTER TABLE tasks ADD COLUMN repeat_notification_id TEXT`); } catch (_) { }

  db.execSync(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks (scheduled_date)`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks (parent_id, scheduled_date)`);
}

const ORDER_BY = `
  ORDER BY
    is_completed ASC,
    CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END ASC,
    CASE WHEN reminder_time IS NOT NULL THEN reminder_time ELSE '99:99' END ASC,
    created_at DESC
`;

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Todas las tareas sueltas + plantillas de rutina + copias de rutina de hoy. */
export function getAllTasks(today: string): Task[] {
  return db.getAllSync<Task>(
    `SELECT * FROM tasks
     WHERE parent_id IS NULL OR scheduled_date = ?
     ${ORDER_BY}`,
    [today]
  );
}

export function getTaskById(id: number): Task | null {
  return db.getFirstSync<Task>('SELECT * FROM tasks WHERE id = ?', [id]) ?? null;
}

/** Tareas de un día concreto (sin plantillas). */
export function getTasksByDate(date: string): Task[] {
  return db.getAllSync<Task>(
    `SELECT * FROM tasks WHERE scheduled_date = ? AND is_daily = 0 ${ORDER_BY}`,
    [date]
  );
}

/**
 * Lo que debe verse en "Hoy":
 *  - las tareas programadas para hoy
 *  - las tareas sueltas de días anteriores que siguen pendientes (atrasadas)
 *  - las atrasadas que se han completado hoy (para que no desaparezcan al marcarlas)
 * Las copias de rutina de días pasados no se arrastran.
 */
export function getTasksForToday(today: string): Task[] {
  return db.getAllSync<Task>(
    `SELECT * FROM tasks
     WHERE is_daily = 0 AND (
       scheduled_date = ?
       OR (
         scheduled_date < ? AND parent_id IS NULL
         AND (is_completed = 0 OR date(completed_at, 'localtime') = ?)
       )
     )
     ${ORDER_BY}`,
    [today, today, today]
  );
}

export function getDailyTemplates(): Task[] {
  return db.getAllSync<Task>(`SELECT * FROM tasks WHERE is_daily = 1`);
}

export function hasRoutineClone(templateId: number, date: string): boolean {
  return !!db.getFirstSync(
    'SELECT 1 FROM tasks WHERE parent_id = ? AND scheduled_date = ?',
    [templateId, date]
  );
}

/** Copias de una rutina desde una fecha en adelante. */
export function getRoutineClones(templateId: number, fromDate: string): Task[] {
  return db.getAllSync<Task>(
    'SELECT * FROM tasks WHERE parent_id = ? AND scheduled_date >= ?',
    [templateId, fromDate]
  );
}

/** Tareas pendientes con recordatorio de hoy en adelante (para reprogramar avisos). */
export function getPendingWithReminder(fromDate: string): Task[] {
  return db.getAllSync<Task>(
    `SELECT * FROM tasks
     WHERE is_daily = 0 AND is_completed = 0 AND reminder_time IS NOT NULL AND scheduled_date >= ?`,
    [fromDate]
  );
}

/** Pendientes reales: hoy + atrasadas (sin copias de rutina pasadas ni futuras). */
export function countPending(today: string): number {
  const row = db.getFirstSync<{ n: number }>(
    `SELECT COUNT(*) as n FROM tasks
     WHERE is_daily = 0 AND is_completed = 0 AND (
       scheduled_date = ? OR (scheduled_date < ? AND parent_id IS NULL)
     )`,
    [today, today]
  );
  return row?.n ?? 0;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function createTask(task: NewTask & { parent_id?: number }): number {
  const result = db.runSync(
    `INSERT INTO tasks (title, description, priority, category, scheduled_date, reminder_time, repeat_minutes, is_daily, parent_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.title,
      task.description,
      task.priority,
      task.category,
      task.scheduled_date,
      task.reminder_time ?? null,
      task.repeat_minutes,
      task.is_daily,
      task.parent_id ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export function updateTask(
  id: number,
  fields: Partial<Omit<Task, 'id' | 'created_at'>>
): void {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const assignments = keys.map((k) => `${k} = ?`).join(', ');
  const values = [...Object.values(fields), id] as SQLite.SQLiteBindValue[];
  db.runSync(`UPDATE tasks SET ${assignments} WHERE id = ?`, values);
}

export function deleteTask(id: number): void {
  db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
}

export function toggleTaskComplete(id: number, completed: boolean): void {
  db.runSync(
    'UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ?',
    [completed ? 1 : 0, completed ? new Date().toISOString() : null, id]
  );
}

export function deleteAllTasks(): void {
  db.runSync('DELETE FROM tasks');
}

// ─── Daily log (historial permanente) ────────────────────────────────────────
// Se actualiza por incrementos, nunca recalculando desde la tabla tasks,
// para que borrar tareas no borre el historial ni rompa la racha.

export function bumpDailyLog(date: string, completedDelta: number, totalDelta: number): void {
  db.runSync(
    `INSERT INTO daily_log (date, completed_count, total_count)
     VALUES (?, max(?, 0), max(?, 0))
     ON CONFLICT(date) DO UPDATE SET
       completed_count = max(completed_count + ?, 0),
       total_count     = max(total_count + ?, 0)`,
    [date, completedDelta, totalDelta, completedDelta, totalDelta]
  );
}

export function getDailyLog(): DailyLogEntry[] {
  return db.getAllSync<DailyLogEntry>(`SELECT * FROM daily_log ORDER BY date DESC`);
}
