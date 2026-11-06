import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '@/store/useTaskStore';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { getDailyMessage } from '@/constants/messages';
import { countPending } from '@/lib/db';
import { toISODate, todayISO } from '@/lib/dates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DailyLogEntry = { date: string; completed_count: number; total_count: number };

function calcStreak(log: DailyLogEntry[]): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = toISODate(d);
    const entry = log.find(l => l.date === iso);
    if (entry && entry.completed_count > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    minHeight: 72,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function WeeklyBarChart({ dailyLog }: { dailyLog: DailyLogEntry[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const counts = days.map((d) => {
    const iso = toISODate(d);
    const entry = dailyLog.find(l => l.date === iso);
    return entry?.completed_count ?? 0;
  });
  
  const maxCount = Math.max(...counts, 1);
  const todayIdx = 6; // last element is today

  // Map days to DAY_LABELS starting from the weekday of `days[0]`
  const labels = days.map((d) => {
    const jsDay = d.getDay(); // 0=Sun, 1=Mon...
    const mapped = jsDay === 0 ? 6 : jsDay - 1; // Mon=0 ... Sun=6
    return DAY_LABELS[mapped];
  });

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsRow}>
        {counts.map((count, i) => {
          const heightPct = (count / maxCount) * 100;
          const isToday = i === todayIdx;
          return (
            <View key={i} style={chartStyles.barWrapper}>
              <View style={chartStyles.barTrack}>
                <View
                  style={[
                    chartStyles.bar,
                    {
                      height: `${Math.max(heightPct, 6)}%` as any,
                      backgroundColor: isToday
                        ? Colors.accent
                        : Colors.accentDim,
                      borderWidth: isToday ? 0 : 0,
                    },
                  ]}
                />
              </View>
              <Text style={[chartStyles.dayLabel, isToday && chartStyles.dayLabelToday]}>
                {labels[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    height: 120,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: Radius.sm,
    minHeight: 6,
  },
  dayLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  dayLabelToday: {
    color: Colors.accent,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StatsScreen() {
  const { loadTasks, dailyLog, loadDailyLog, tasks } = useTaskStore();

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadDailyLog();
    }, [])
  );

  const stats = useMemo(() => {
    // Solo hasta hoy: las copias de rutina de días futuros no cuentan todavía.
    const today = todayISO();
    const pastLog = dailyLog.filter((d) => d.date <= today);
    const totalCompleted = pastLog.reduce((acc, d) => acc + d.completed_count, 0);
    const totalCreated = pastLog.reduce((acc, d) => acc + d.total_count, 0);
    const pending = countPending(today);
    const pct = totalCreated > 0 ? Math.min(100, Math.round((totalCompleted / totalCreated) * 100)) : 0;
    const streak = calcStreak(dailyLog);
    return { total: totalCreated, completed: totalCompleted, pending, pct, streak };
  }, [dailyLog, tasks]);

  const message = getDailyMessage();
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const todayFormatted = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header gradient block ─────────────────────────────────────── */}
      <View style={styles.headerBlock}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Tus estadísticas</Text>
            <Text style={styles.headerSub}>
              {stats.pct >= 80
                ? 'Esta semana vas muy bien 🔥'
                : stats.pct >= 40
                ? 'Buen ritmo, sigue así 💪'
                : 'Cada tarea cuenta, ¡adelante! ✨'}
            </Text>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="stats-chart" size={20} color={Colors.white} />
          </View>
        </View>
        <Text style={styles.headerDate}>{todayFormatted}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stat cards ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.cardsRow}>
            <StatCard
              value={String(stats.streak)}
              label="Racha días"
              color={Colors.accent}
            />
            <StatCard
              value={`${stats.pct}%`}
              label="Completadas"
              color={Colors.success}
            />
            <StatCard
              value={String(stats.pending)}
              label="Pendientes"
              color={Colors.warning}
            />
          </View>
        </View>

        {/* ── Weekly activity ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVIDAD SEMANAL</Text>
          <View style={styles.card}>
            <WeeklyBarChart dailyLog={dailyLog} />
          </View>
        </View>

        {/* ── Daily message ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MENSAJE DEL DÍA</Text>
          <View style={styles.messageCard}>
            <Ionicons
              name="chatbubble-ellipses"
              size={18}
              color={Colors.accent}
              style={{ marginBottom: Spacing.sm }}
            />
            <Text style={styles.messageText}>{message}</Text>
          </View>
        </View>

        {/* ── Extra summary ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN TOTAL</Text>
          <View style={styles.card}>
            <SummaryRow
              label="Tareas creadas"
              value={String(stats.total)}
              icon="create-outline"
              color={Colors.textMuted}
            />
            <View style={styles.divider} />
            <SummaryRow
              label="Completadas"
              value={String(stats.completed)}
              icon="checkmark-circle-outline"
              color={Colors.success}
            />
            <View style={styles.divider} />
            <SummaryRow
              label="Pendientes"
              value={String(stats.pending)}
              icon="time-outline"
              color={Colors.warning}
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}) {
  return (
    <View style={summaryStyles.row}>
      <View style={[summaryStyles.iconBox, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={[summaryStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBlock: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginTop: 4,
  },
  headerDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: Spacing.sm,
    letterSpacing: 0.3,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  messageCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    padding: Spacing.md,
  },
  messageText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
