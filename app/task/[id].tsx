import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTaskStore } from '@/store/useTaskStore';
import { DayPicker } from '@/components/DayPicker';
import { getTaskById } from '@/lib/db';
import type { Priority, Category } from '@/lib/db';
import {
  Colors,
  Spacing,
  FontSize,
  Radius,
  Shadow,
  PriorityConfig,
  CategoryConfig,
  RepeatOptions,
} from '@/constants/theme';

// ─── Reused Time Picker ───────────────────────────────────────────────────────

function TimePicker({
  hour,
  minute,
  onHourChange,
  onMinuteChange,
}: {
  hour: number;
  minute: number;
  onHourChange: (h: number) => void;
  onMinuteChange: (m: number) => void;
}) {
  return (
    <View style={tp.container}>
      <View style={tp.column}>
        <Pressable onPress={() => onHourChange((hour + 1) % 24)} style={tp.arrowBtn} hitSlop={8}>
          <Ionicons name="chevron-up" size={20} color={Colors.accent} />
        </Pressable>
        <View style={tp.valueBox}>
          <Text style={tp.valueText}>{String(hour).padStart(2, '0')}</Text>
        </View>
        <Pressable onPress={() => onHourChange((hour - 1 + 24) % 24)} style={tp.arrowBtn} hitSlop={8}>
          <Ionicons name="chevron-down" size={20} color={Colors.accent} />
        </Pressable>
        <Text style={tp.unitLabel}>h</Text>
      </View>
      <Text style={tp.colon}>:</Text>
      <View style={tp.column}>
        <Pressable onPress={() => onMinuteChange((minute + 5) % 60)} style={tp.arrowBtn} hitSlop={8}>
          <Ionicons name="chevron-up" size={20} color={Colors.accent} />
        </Pressable>
        <View style={tp.valueBox}>
          <Text style={tp.valueText}>{String(minute).padStart(2, '0')}</Text>
        </View>
        <Pressable onPress={() => onMinuteChange((minute - 5 + 60) % 60)} style={tp.arrowBtn} hitSlop={8}>
          <Ionicons name="chevron-down" size={20} color={Colors.accent} />
        </Pressable>
        <Text style={tp.unitLabel}>min</Text>
      </View>
    </View>
  );
}

const tp = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingVertical: Spacing.md },
  column: { alignItems: 'center', gap: 4 },
  arrowBtn: { padding: 4 },
  valueBox: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.accent, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, minWidth: 70, alignItems: 'center' },
  valueText: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', letterSpacing: 2 },
  colon: { color: Colors.accent, fontSize: FontSize.xxl, fontWeight: '800', marginBottom: 4 },
  unitLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
});

function FieldLabel({ label }: { label: string }) {
  return <Text style={fieldStyles.label}>{label}</Text>;
}
const fieldStyles = StyleSheet.create({
  label: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.md },
});


// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function EditTaskModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { editTask, removeTask } = useTaskStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('general');
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isDaily, setIsDaily] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [repeatMinutes, setRepeatMinutes] = useState(0);

  // Load existing task data
  useEffect(() => {
    if (!id) return;
    try {
      const task = getTaskById(Number(id));
      if (!task) {
        Alert.alert('Error', 'Tarea no encontrada');
        router.back();
        return;
      }
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setCategory(task.category);
      setScheduledDate(task.scheduled_date ?? format(new Date(), 'yyyy-MM-dd'));
      setIsDaily(task.is_daily === 1);
      setRepeatMinutes(task.repeat_minutes ?? 0);
      if (task.reminder_time) {
        setHasReminder(true);
        const [h, m] = task.reminder_time.split(':').map(Number);
        setHour(h ?? 8);
        setMinute(m ?? 0);
      }
    } catch (e) {
      console.error('[FocusOn] Error loading task:', e);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Título requerido', 'Por favor escribe el nombre de la tarea');
      return;
    }
    setIsSaving(true);
    try {
      await editTask(Number(id), {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        scheduled_date: scheduledDate,
        is_daily: isDaily ? 1 : 0,
        reminder_time: hasReminder
          ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
          : null,
        repeat_minutes: hasReminder ? repeatMinutes : 0,
      });
      router.back();
    } catch (e) {
      console.error('[FocusOn] Error saving task:', e);
      Alert.alert('Error', 'No se pudo guardar la tarea.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar tarea',
      `¿Seguro que quieres eliminar "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await removeTask(Number(id));
            router.back();
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Top Bar ───────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={24} color={Colors.textMuted} />
          </Pressable>
          <Text style={styles.modalTitle}>Editar Tarea</Text>
          <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
          </Pressable>
        </View>
        <View style={styles.handle} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Title ─────────────────────────────────────────── */}
          <TextInput
            style={styles.titleInput}
            placeholder="¿Qué tienes que hacer?"
            placeholderTextColor={Colors.textDim}
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />

          {/* ── Description ───────────────────────────────────── */}
          <TextInput
            style={styles.descInput}
            placeholder="Descripción (opcional)..."
            placeholderTextColor={Colors.textDim}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={300}
          />

          {/* ── Día ───────────────────────────────────────────── */}
          {!isDaily && (
            <>
              <FieldLabel label="Día / Rutina" />
              <DayPicker selected={scheduledDate} onChange={setScheduledDate} daysAhead={14} />
            </>
          )}

          {/* ── Repetir diariamente ────────────────────────────── */}
          <Pressable
            style={[styles.toggleRow, { marginTop: Spacing.md }, isDaily && styles.toggleRowActive]}
            onPress={() => setIsDaily((v) => !v)}
          >
            <View style={styles.toggleLeft}>
              <Ionicons
                name="repeat"
                size={20}
                color={isDaily ? Colors.accent : Colors.textMuted}
              />
              <Text style={[styles.toggleText, isDaily && styles.toggleTextActive]}>
                {isDaily ? 'Se repite todos los días' : 'No se repite'}
              </Text>
            </View>
            <View style={[styles.togglePill, isDaily && styles.togglePillActive]}>
              <View style={[styles.toggleThumb, isDaily && styles.toggleThumbActive]} />
            </View>
          </Pressable>

          {/* ── Priority ──────────────────────────────────────── */}
          <FieldLabel label="Prioridad" />
          <View style={styles.optionRow}>
            {(Object.keys(PriorityConfig) as Priority[]).map((p) => {
              const cfg = PriorityConfig[p];
              const active = priority === p;
              return (
                <Pressable
                  key={p}
                  style={[styles.optionBtn, active && { backgroundColor: cfg.dimColor, borderColor: cfg.color }]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
                  <Text style={[styles.optionText, active && { color: cfg.color }]}>{cfg.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Category ──────────────────────────────────────── */}
          <FieldLabel label="Categoría" />
          <View style={styles.optionRow}>
            {(Object.keys(CategoryConfig) as Category[]).map((c) => {
              const cfg = CategoryConfig[c];
              const active = category === c;
              return (
                <Pressable
                  key={c}
                  style={[styles.optionChip, active && styles.optionChipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Ionicons name={cfg.icon} size={14} color={active ? Colors.accent : Colors.textMuted} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{cfg.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Reminder toggle ───────────────────────────────── */}
          <FieldLabel label="Notificación" />
          <Pressable
            style={[styles.toggleRow, hasReminder && styles.toggleRowActive]}
            onPress={() => setHasReminder((v) => !v)}
          >
            <View style={styles.toggleLeft}>
              <Ionicons name="notifications-outline" size={20} color={hasReminder ? Colors.accent : Colors.textMuted} />
              <Text style={[styles.toggleText, hasReminder && styles.toggleTextActive]}>
                {hasReminder ? 'Recordatorio activado' : 'Sin recordatorio'}
              </Text>
            </View>
            <View style={[styles.togglePill, hasReminder && styles.togglePillActive]}>
              <View style={[styles.toggleThumb, hasReminder && styles.toggleThumbActive]} />
            </View>
          </Pressable>

          {hasReminder && (
            <>
              <View style={styles.timePickerCard}>
                <TimePicker hour={hour} minute={minute} onHourChange={setHour} onMinuteChange={setMinute} />
              </View>
              <FieldLabel label="Repetir recordatorio" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.repeatRow}>
                {RepeatOptions.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.optionChip, repeatMinutes === opt.value && styles.optionChipActive]}
                    onPress={() => setRepeatMinutes(opt.value)}
                  >
                    <Text style={[styles.chipText, repeatMinutes === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        {/* ── Save Button ───────────────────────────────────────── */}
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed, isSaving && styles.saveBtnLoading]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
            <Text style={styles.saveBtnText}>{isSaving ? 'Guardando...' : 'Guardar cambios'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.dangerDim },
  modalTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },
  titleInput: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: Colors.accent, marginBottom: Spacing.sm },
  descInput: { color: Colors.text, fontSize: FontSize.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, minHeight: 60, marginBottom: Spacing.sm, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  optionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated, gap: Spacing.xs, minWidth: 90 },
  optionText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  optionChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated },
  optionChipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  chipText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  chipTextActive: { color: Colors.accent },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md },
  toggleRowActive: { borderColor: Colors.accent, backgroundColor: Colors.accentGlow },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  toggleText: { color: Colors.textMuted, fontSize: FontSize.md, fontWeight: '500' },
  toggleTextActive: { color: Colors.accent },
  togglePill: { width: 46, height: 26, borderRadius: 13, backgroundColor: Colors.border, justifyContent: 'center', paddingHorizontal: 3 },
  togglePillActive: { backgroundColor: Colors.accent },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.textMuted, alignSelf: 'flex-start' },
  toggleThumbActive: { alignSelf: 'flex-end', backgroundColor: Colors.white },
  timePickerCard: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.accent, marginTop: Spacing.sm, overflow: 'hidden' },
  repeatRow: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  footer: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.accent, borderRadius: Radius.lg, paddingVertical: Spacing.md + 2, ...Shadow.glow },
  saveBtnPressed: { backgroundColor: Colors.accentDark, transform: [{ scale: 0.98 }] },
  saveBtnLoading: { opacity: 0.7 },
  saveBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' },
});
