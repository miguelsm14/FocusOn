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
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore, FilterType, CategoryFilter } from '@/store/useTaskStore';
import { TaskCard } from '@/components/TaskCard';
import { AddTaskFAB } from '@/components/AddTaskFAB';
import { EmptyState } from '@/components/EmptyState';
import {
  Colors,
  Spacing,
  FontSize,
  Radius,
  CategoryConfig,
} from '@/constants/theme';

// ─── Filter Pills ─────────────────────────────────────────────────────────────

const STATUS_FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all',       label: 'Todas' },
  { key: 'pending',   label: 'Pendientes' },
  { key: 'completed', label: 'Completadas' },
  { key: 'routines',  label: 'Rutinas' },
  { key: 'high',      label: '🔴 Alta' },
  { key: 'medium',    label: '🟡 Media' },
  { key: 'low',       label: '🟢 Baja' },
];

const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: 'all',      label: 'Todo' },
  { key: 'general',  label: CategoryConfig.general.label },
  { key: 'trabajo',  label: CategoryConfig.trabajo.label },
  { key: 'salud',    label: CategoryConfig.salud.label },
  { key: 'personal', label: CategoryConfig.personal.label },
];

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TasksScreen() {
  const {
    loadTasks,
    filter,
    categoryFilter,
    setFilter,
    setCategoryFilter,
    getFilteredTasks,
    getStats,
  } = useTaskStore();

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const filteredTasks = getFilteredTasks();
  const stats = getStats();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Mis Tareas</Text>
            <Text style={styles.subtitle}>
              {stats.pending} pendientes · {stats.completed} completadas
            </Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{stats.total}</Text>
          </View>
        </View>

        {/* ── Status filter ─────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {STATUS_FILTERS.map((f) => (
            <Pill
              key={f.key}
              label={f.label}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        {/* ── Category filter ───────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterScroll}
        >
          {CATEGORY_FILTERS.map((f) => (
            <Pill
              key={f.key}
              label={f.label}
              active={categoryFilter === f.key}
              onPress={() => setCategoryFilter(f.key)}
            />
          ))}
        </ScrollView>

        {/* ── Divider ───────────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Task list ─────────────────────────────────────────── */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            message="Sin tareas aquí"
            subMessage={
              filter === 'all' && categoryFilter === 'all'
                ? 'Toca + para añadir tu primera tarea'
                : 'Prueba cambiando los filtros'
            }
            icon="funnel-outline"
          />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

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
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  totalBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalText: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  pillText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.xs,
  },
});
