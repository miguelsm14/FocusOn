import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '@/store/useTaskStore';
import { cancelAllNotifications } from '@/lib/notifications';
import { areNotificationsEnabled, setNotificationsEnabled } from '@/lib/settings';
import {
  Colors,
  Spacing,
  FontSize,
  Radius,
  Shadow,
} from '@/constants/theme';

// ─── Section Block ────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sStyles.section}>
      <Text style={sStyles.sectionTitle}>{title}</Text>
      <View style={sStyles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingRow({
  icon,
  iconColor = Colors.accent,
  label,
  sublabel,
  onPress,
  right,
  destructive,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        sStyles.row,
        pressed && onPress && sStyles.rowPressed,
      ]}
      disabled={!onPress && !right}
    >
      <View style={[sStyles.iconBox, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={sStyles.rowContent}>
        <Text style={[sStyles.rowLabel, destructive && { color: Colors.danger }]}>
          {label}
        </Text>
        {sublabel && <Text style={sStyles.rowSublabel}>{sublabel}</Text>}
      </View>
      {right ?? (
        onPress
          ? <Ionicons name="chevron-forward" size={16} color={Colors.textDim} />
          : null
      )}
    </Pressable>
  );
}

const sStyles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowPressed: {
    backgroundColor: Colors.surfaceActive,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  rowSublabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { tasks, loadTasks, resetDay, purgeAll, getStats, rescheduleAll } = useTaskStore();
  const [notifEnabled, setNotifEnabled] = useState(areNotificationsEnabled());

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const stats = getStats();

  const handleResetDay = () => {
    Alert.alert(
      'Reiniciar el día',
      'Se marcarán como pendientes las tareas completadas hoy. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          onPress: async () => {
            await resetDay();
          },
        },
      ]
    );
  };

  const handlePurgeAll = () => {
    Alert.alert(
      'Eliminar todo',
      '⚠️ Se eliminarán TODAS tus tareas y rutinas permanentemente. Tus estadísticas se conservan. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: async () => {
            await purgeAll();
          },
        },
      ]
    );
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotifEnabled(value);
    await setNotificationsEnabled(value);
    if (!value) {
      await cancelAllNotifications();
    } else {
      await rescheduleAll();
      Alert.alert(
        "Notificaciones activadas",
        "Se han reprogramado todos tus recordatorios."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>FocusOn v1.0</Text>
        </View>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard label="Total" value={stats.total} color={Colors.accent} icon="list" />
          <StatCard label="Pendientes" value={stats.pending} color={Colors.warning} icon="time-outline" />
          <StatCard label="Completadas" value={stats.completed} color={Colors.success} icon="checkmark-circle" />
        </View>

        {/* ── Notifications ──────────────────────────────────────── */}
        <Section title="Notificaciones">
          <SettingRow
            icon="notifications-outline"
            label="Activar notificaciones"
            sublabel="Recordatorios de las tareas con hora"
            right={
              <Switch
                value={notifEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: Colors.border, true: Colors.accentDim }}
                thumbColor={notifEnabled ? Colors.accent : Colors.textDim}
              />
            }
          />
        </Section>

        {/* ── Tasks ─────────────────────────────────────────────── */}
        <Section title="Gestión de Tareas">
          <SettingRow
            icon="refresh-outline"
            iconColor={Colors.warning}
            label="Reiniciar el día"
            sublabel="Desmarca las tareas completadas hoy"
            onPress={handleResetDay}
          />
          <SettingRow
            icon="trash-outline"
            iconColor={Colors.danger}
            label="Eliminar todas las tareas"
            sublabel="Acción irreversible"
            onPress={handlePurgeAll}
            destructive
          />
        </Section>

        {/* ── About ─────────────────────────────────────────────── */}
        <Section title="Acerca de">
          <SettingRow
            icon="flash"
            iconColor={Colors.accent}
            label="FocusOn"
            sublabel="Tu asistente de tareas diarias"
          />
          <SettingRow
            icon="code-slash-outline"
            iconColor={Colors.textMuted}
            label="Versión"
            sublabel="1.0.0"
          />
        </Section>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={[statStyles.card, { borderColor: `${color}33` }]}>
      <Ionicons name={icon} size={18} color={color} style={{ marginBottom: 4 }} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 2,
    ...Shadow.sm,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    textAlign: 'center',
  },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
    paddingTop: Spacing.sm,
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
});
