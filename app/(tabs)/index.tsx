import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '@/store/useTaskStore';
import { TaskCard } from '@/components/TaskCard';
import { AddTaskFAB } from '@/components/AddTaskFAB';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';
import {
  Colors,
  Spacing,
  FontSize,
  PriorityConfig,
} from '@/constants/theme';
import type { Task } from '@/lib/db';
import { todayISO } from '@/lib/dates';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '¡Buenos días! ☀️';
  if (hour < 19) return '¡Buenas tardes! 👋';
  return '¡Buenas noches! 🌙';
}

function groupByPriority(tasks: Task[], today: string) {
  const pendingAll = tasks.filter((t) => !t.is_completed);
  const overdue = pendingAll.filter((t) => t.scheduled_date < today);
  const pending = pendingAll.filter((t) => t.scheduled_date >= today);
  const completed = tasks.filter((t) => !!t.is_completed);
  return {
    overdue,
    high: pending.filter((t) => t.priority === 'high'),
    medium: pending.filter((t) => t.priority === 'medium'),
    low: pending.filter((t) => t.priority === 'low'),
    completed,
  };
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  color,
  count,
}: {
  label: string;
  color: string;
  count: number;
}) {
  return (
    <View style={sectionStyles.header}>
      <View style={[sectionStyles.dot, { backgroundColor: color }]} />
      <Text style={sectionStyles.label}>{label}</Text>
      <View style={[sectionStyles.count, { backgroundColor: `${color}25` }]}>
        <Text style={[sectionStyles.countText, { color }]}>{count}</Text>
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    flex: 1,
  },
  count: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const { tasks, loadTasksForDate, getStats } = useTaskStore();

  useFocusEffect(
    useCallback(() => {
      loadTasksForDate(todayISO());
    }, [])
  );

  const stats = getStats();
  const groups = groupByPriority(tasks, todayISO());
  const isEmpty = tasks.length === 0;

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.date}>{todayFormatted}</Text>
          </View>
          <View style={styles.logoMark}>
            <Ionicons name="flash" size={22} color={Colors.accent} />
          </View>
        </View>

        {/* ── Progress ──────────────────────────────────────────── */}
        {!isEmpty && (
          <View style={styles.progressCard}>
            <ProgressBar total={stats.total} completed={stats.completed} />
          </View>
        )}

        {/* ── Task List ─────────────────────────────────────────── */}
        {isEmpty ? (
          <EmptyState
            message="¡Sin tareas por hoy!"
            subMessage="Toca el + para añadir tu primera tarea del día"
            icon="flash-outline"
          />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Overdue: pending tasks from previous days */}
            {groups.overdue.length > 0 && (
              <>
                <SectionHeader
                  label="Atrasadas"
                  color={Colors.danger}
                  count={groups.overdue.length}
                />
                {groups.overdue.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </>
            )}

            {/* High priority */}
            {groups.high.length > 0 && (
              <>
                <SectionHeader
                  label="Alta prioridad"
                  color={PriorityConfig.high.color}
                  count={groups.high.length}
                />
                {groups.high.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </>
            )}

            {/* Medium priority */}
            {groups.medium.length > 0 && (
              <>
                <SectionHeader
                  label="Prioridad media"
                  color={PriorityConfig.medium.color}
                  count={groups.medium.length}
                />
                {groups.medium.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </>
            )}

            {/* Low priority */}
            {groups.low.length > 0 && (
              <>
                <SectionHeader
                  label="Baja prioridad"
                  color={PriorityConfig.low.color}
                  count={groups.low.length}
                />
                {groups.low.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </>
            )}

            {/* Completed */}
            {groups.completed.length > 0 && (
              <>
                <SectionHeader
                  label="Completadas"
                  color={Colors.textDim}
                  count={groups.completed.length}
                />
                {groups.completed.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </>
            )}

            {/* Bottom padding for FAB */}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* ── FAB ───────────────────────────────────────────────── */}
        <AddTaskFAB />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  date: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.sm,
  },
});
