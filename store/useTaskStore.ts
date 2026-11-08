import { create } from 'zustand';
import * as DB from '@/lib/db';
import { scheduleTaskNotification, cancelTaskNotifications, cancelAllNotifications } from '@/lib/notifications';
import { todayISO, addDaysISO, localDateOf } from '@/lib/dates';

/** Cuántos días por delante se generan las copias de cada rutina. */
const ROUTINE_DAYS_AHEAD = 7;

// ─── Helpers de notificaciones ────────────────────────────────────────────────

async function cancelFor(task: DB.Task): Promise<void> {
  await cancelTaskNotifications(task.notification_id, task.repeat_notification_id);
}

/**
 * Cancela los avisos actuales de la tarea y vuelve a programarlos según su
 * estado real (si está completada o es una plantilla, se quedan sin avisos).
 */
async function rescheduleFor(id: number): Promise<void> {
  const task = DB.getTaskById(id);
  if (!task) return;
  await cancelFor(task);
  const ids = await scheduleTaskNotification(task);
  DB.updateTask(id, ids);
}

// ─── Rutinas ──────────────────────────────────────────────────────────────────

let routineSync: Promise<void> | null = null;

/**
 * Asegura que cada rutina tiene su copia para hoy y los próximos días,
 * cada una con sus propios avisos. Así, al completar la de hoy solo se
 * cancelan los avisos de hoy. Protegida contra ejecuciones simultáneas.
 */
function ensureRoutineClones(today: string): Promise<void> {
  if (routineSync) return routineSync;
  routineSync = (async () => {
    try {
      for (const t of DB.getDailyTemplates()) {
        // Versiones antiguas programaban un aviso diario en la plantilla: se elimina.
        if (t.notification_id || t.repeat_notification_id) {
          await cancelFor(t);
          DB.updateTask(t.id, { notification_id: null, repeat_notification_id: null });
        }
        for (let i = 0; i < ROUTINE_DAYS_AHEAD; i++) {
          const date = addDaysISO(today, i);
          if (date < t.scheduled_date || DB.hasRoutineClone(t.id, date)) continue;
          const cloneId = DB.createTask({
            title: t.title,
            description: t.description,
            priority: t.priority,
            category: t.category,
            scheduled_date: date,
            reminder_time: t.reminder_time,
            repeat_minutes: t.repeat_minutes,
            is_daily: 0,
            parent_id: t.id,
          });
          DB.bumpDailyLog(date, 0, 1);
          await rescheduleFor(cloneId);
        }
      }
    } catch (e) {
      console.error('[FocusOn] Error generating routine copies:', e);
    } finally {
      routineSync = null;
    }
  })();
  return routineSync;
}

/** Borra las copias pendientes de una rutina de hoy en adelante (las completadas se quedan). */
async function removeFutureClones(templateId: number, today: string): Promise<void> {
  for (const clone of DB.getRoutineClones(templateId, today)) {
    if (clone.is_completed) continue;
    await cancelFor(clone);
    DB.deleteTask(clone.id);
    DB.bumpDailyLog(clone.scheduled_date, 0, -1);
  }
}

// ─── Borrado con opción de deshacer ───────────────────────────────────────────

/** Tiempo que se muestra el aviso de "Deshacer" antes de borrar de verdad. */
export const UNDO_DELETE_MS = 4000;

/** Tareas ocultas en la lista porque están pendientes de borrarse. */
const hiddenIds = new Set<number>();
let undoTimer: ReturnType<typeof setTimeout> | null = null;

function visible(tasks: DB.Task[]): DB.Task[] {
  return hiddenIds.size ? tasks.filter((t) => !hiddenIds.has(t.id)) : tasks;
}

function queryForDate(date: string): DB.Task[] {
  return visible(date === todayISO() ? DB.getTasksForToday(date) : DB.getTasksByDate(date));
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterType = 'all' | 'pending' | 'completed' | 'routines' | 'high' | 'medium' | 'low';
export type CategoryFilter = 'all' | 'general' | 'trabajo' | 'salud' | 'personal';

interface TaskStore {
  tasks: DB.Task[];
  currentDate: string | null;
  dailyLog: DB.DailyLogEntry[];
  filter: FilterType;
  categoryFilter: CategoryFilter;

  // Data operations
  loadTasks: () => void;                            // loads ALL tasks (Tareas / Ajustes)
  loadDailyLog: () => void;
  loadTasksForDate: (date: string) => Promise<void>; // "Hoy" (incluye atrasadas)
  refreshTasks: () => void;                         // reloads current view
  syncRoutines: () => Promise<void>;
  addTask: (task: DB.NewTask) => Promise<number>;
  editTask: (id: number, updates: Partial<DB.Task>) => Promise<void>;
  removeTask: (id: number) => Promise<void>;
  /** Oculta la tarea y la borra pasados unos segundos salvo que se deshaga. */
  removeTaskWithUndo: (id: number) => Promise<void>;
  undoRemove: () => void;
  commitPendingRemove: () => Promise<void>;
  pendingRemove: DB.Task | null;
  toggleTask: (id: number) => Promise<void>;
  resetDay: () => Promise<void>;
  purgeAll: () => Promise<void>;
  rescheduleAll: () => Promise<void>;

  // Filter controls
  setFilter: (filter: FilterType) => void;
  setCategoryFilter: (cat: CategoryFilter) => void;

  // Derived data
  getFilteredTasks: () => DB.Task[];
  getStats: () => { total: number; completed: number; pending: number };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentDate: null,
  pendingRemove: null,
  dailyLog: [],
  filter: 'all',
  categoryFilter: 'all',

  // ── Load ─────────────────────────────────────────────────────────────────

  loadTasks: () => {
    try {
      set({ tasks: visible(DB.getAllTasks(todayISO())), currentDate: null });
    } catch (e) {
      console.error('[FocusOn] Error loading tasks:', e);
    }
  },

  loadDailyLog: () => {
    try {
      set({ dailyLog: DB.getDailyLog() });
    } catch (e) {
      console.error('[FocusOn] Error loading daily log:', e);
    }
  },

  loadTasksForDate: async (date) => {
    try {
      set({ tasks: queryForDate(date), currentDate: date });
      await ensureRoutineClones(todayISO());
      if (get().currentDate === date) set({ tasks: queryForDate(date) });
    } catch (e) {
      console.error('[FocusOn] Error loading tasks for date:', e);
    }
  },

  refreshTasks: () => {
    const { currentDate } = get();
    try {
      set({ tasks: currentDate ? queryForDate(currentDate) : visible(DB.getAllTasks(todayISO())) });
    } catch (e) {
      console.error('[FocusOn] Error refreshing tasks:', e);
    }
  },

  syncRoutines: () => ensureRoutineClones(todayISO()),

  // ── Add ──────────────────────────────────────────────────────────────────

  addTask: async (taskData) => {
    const id = DB.createTask(taskData);
    if (taskData.is_daily) {
      await ensureRoutineClones(todayISO());
    } else {
      DB.bumpDailyLog(taskData.scheduled_date, 0, 1);
      await rescheduleFor(id);
    }
    get().refreshTasks();
    return id;
  },

  // ── Edit ─────────────────────────────────────────────────────────────────

  editTask: async (id, updates) => {
    const existing = DB.getTaskById(id);
    if (!existing) return;

    const today = todayISO();
    const fields = { ...updates };
    const wasTemplate = existing.is_daily === 1;
    const willBeTemplate = (fields.is_daily ?? existing.is_daily) === 1;

    // Una rutina que deja de serlo pasa a ser una tarea normal de hoy como pronto.
    if (wasTemplate && !willBeTemplate && (fields.scheduled_date ?? existing.scheduled_date) < today) {
      fields.scheduled_date = today;
    }

    DB.updateTask(id, fields);
    const updated = DB.getTaskById(id);
    if (!updated) return;

    // Historial: mover una tarea pendiente de día la cambia de día en el registro.
    if (!existing.is_completed) {
      if (!wasTemplate && !willBeTemplate && existing.scheduled_date !== updated.scheduled_date) {
        DB.bumpDailyLog(existing.scheduled_date, 0, -1);
        DB.bumpDailyLog(updated.scheduled_date, 0, 1);
      } else if (!wasTemplate && willBeTemplate) {
        DB.bumpDailyLog(existing.scheduled_date, 0, -1);
      } else if (wasTemplate && !willBeTemplate) {
        DB.bumpDailyLog(updated.scheduled_date, 0, 1);
      }
    }

    // Siempre se reprograma: cubre cambios de hora, título, día, repetición o tipo.
    await rescheduleFor(id);

    // Las copias futuras de una rutina se rehacen con los datos nuevos.
    if (wasTemplate || willBeTemplate) {
      await removeFutureClones(id, today);
      if (willBeTemplate) await ensureRoutineClones(today);
    }

    get().refreshTasks();
  },

  // ── Remove ───────────────────────────────────────────────────────────────

  removeTask: async (id) => {
    const task = DB.getTaskById(id);
    if (task) {
      await cancelFor(task);
      if (task.is_daily) {
        await removeFutureClones(id, todayISO());
      } else if (!task.is_completed) {
        // Las completadas se quedan en el historial; las pendientes dejan de contar.
        DB.bumpDailyLog(task.scheduled_date, 0, -1);
      }
      DB.deleteTask(id);
    }
    get().refreshTasks();
  },

  removeTaskWithUndo: async (id) => {
    const task = get().tasks.find((t) => t.id === id) ?? DB.getTaskById(id);
    if (!task) return;
    // Solo se puede deshacer el último borrado: el anterior se confirma ya.
    await get().commitPendingRemove();
    hiddenIds.add(id);
    set({ pendingRemove: task, tasks: get().tasks.filter((t) => t.id !== id) });
    undoTimer = setTimeout(() => { get().commitPendingRemove(); }, UNDO_DELETE_MS);
  },

  undoRemove: () => {
    const pending = get().pendingRemove;
    if (!pending) return;
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = null;
    hiddenIds.delete(pending.id);
    set({ pendingRemove: null });
    get().refreshTasks();
  },

  commitPendingRemove: async () => {
    const pending = get().pendingRemove;
    if (!pending) return;
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = null;
    set({ pendingRemove: null });
    try {
      await get().removeTask(pending.id);
    } finally {
      hiddenIds.delete(pending.id);
    }
  },

  // ── Toggle complete ───────────────────────────────────────────────────────

  toggleTask: async (id) => {
    const task = DB.getTaskById(id);
    if (!task || task.is_daily) return;

    if (!task.is_completed) {
      DB.toggleTaskComplete(id, true);
      DB.bumpDailyLog(todayISO(), 1, 0); // cuenta el día en que se hace, no el previsto
    } else {
      const completedDay = localDateOf(task.completed_at) ?? todayISO();
      DB.toggleTaskComplete(id, false);
      DB.bumpDailyLog(completedDay, -1, 0);
    }

    await rescheduleFor(id); // completada → sin avisos; desmarcada → vuelven
    get().refreshTasks();
  },

  // ── Reset & Purge ─────────────────────────────────────────────────────────

  /** Desmarca solo las tareas de hoy (antes desmarcaba todo el historial). */
  resetDay: async () => {
    const today = todayISO();
    for (const task of DB.getTasksForToday(today)) {
      if (!task.is_completed) continue;
      DB.toggleTaskComplete(task.id, false);
      DB.bumpDailyLog(localDateOf(task.completed_at) ?? today, -1, 0);
      await rescheduleFor(task.id);
    }
    get().refreshTasks();
  },

  /** Borra todas las tareas. El historial de estadísticas se conserva. */
  purgeAll: async () => {
    await cancelAllNotifications();
    DB.deleteAllTasks();
    set({ tasks: [] });
  },

  rescheduleAll: async () => {
    for (const task of DB.getPendingWithReminder(todayISO())) {
      await rescheduleFor(task.id);
    }
    get().refreshTasks();
  },

  // ── Filters ───────────────────────────────────────────────────────────────

  setFilter: (filter) => set({ filter }),
  setCategoryFilter: (cat) => set({ categoryFilter: cat }),

  getFilteredTasks: () => {
    const { tasks, filter, categoryFilter } = get();
    let filtered = tasks;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (filter === 'routines') {
      return filtered.filter((t) => t.is_daily === 1);
    }

    // Hide templates from all other filters
    filtered = filtered.filter((t) => t.is_daily === 0);

    switch (filter) {
      case 'pending':   return filtered.filter((t) => !t.is_completed);
      case 'completed': return filtered.filter((t) => !!t.is_completed);
      case 'high':
      case 'medium':
      case 'low':       return filtered.filter((t) => t.priority === filter);
      default:          return filtered;
    }
  },

  getStats: () => {
    const { tasks } = get();
    const actionable = tasks.filter((t) => t.is_daily === 0);
    const completed = actionable.filter((t) => !!t.is_completed).length;
    return { total: actionable.length, completed, pending: actionable.length - completed };
  },
}));
