import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { todayISO } from '@/lib/dates';
import { useTaskStore } from '@/store/useTaskStore';
import type { Task } from '@/lib/db';
import { PriorityBadge } from './PriorityBadge';
import {
  Colors,
  Spacing,
  FontSize,
  Radius,
  Shadow,
  CategoryConfig,
} from '@/constants/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_DELETE_THRESHOLD = -70;
const SWIPE_LIMIT = -80;

interface Props {
  task: Task;
  readonly?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskCard({ task, readonly = false }: Props) {
  const router = useRouter();
  const { toggleTask, removeTask } = useTaskStore();
  const translateX = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(1)).current;

  const isCompleted = Boolean(task.is_completed);
  const catConfig = CategoryConfig[task.category] ?? CategoryConfig.general;
  const isOverdue = !isCompleted && task.is_daily === 0 && task.scheduled_date < todayISO();

  // ── Swipe to reveal delete ────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 6 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.5,
      onPanResponderMove: (_, gs) => {
        if (gs.dx <= 0) {
          translateX.setValue(Math.max(gs.dx, SWIPE_LIMIT));
        }
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < SWIPE_DELETE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: SWIPE_LIMIT,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  };

  // ── Checkbox animation ────────────────────────────────────────────────────

  const handleToggle = () => {
    Animated.sequence([
      Animated.spring(checkScale, { toValue: 0.75, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
    ]).start();
    toggleTask(task.id);
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = () => {
    Alert.alert(
      'Eliminar tarea',
      `¿Seguro que quieres eliminar "${task.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: closeSwipe },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeTask(task.id),
        },
      ]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.outerWrapper}>
      {/* Delete zone (behind card) */}
      {!readonly && (
        <View style={styles.deleteZone}>
          <Pressable onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
            <Text style={styles.deleteText}>Borrar</Text>
          </Pressable>
        </View>
      )}

      {/* Swipeable card */}
      <Animated.View
        style={[
          styles.card,
          isCompleted && styles.cardCompleted,
          { transform: [{ translateX }] },
        ]}
        {...(readonly ? {} : panResponder.panHandlers)}
      >
        {/* Left: priority accent line */}
        <View
          style={[
            styles.priorityLine,
            { backgroundColor: getPriorityColor(task.priority) },
          ]}
        />

        {/* Checkbox */}
        {task.is_daily === 1 ? (
          <View style={styles.checkboxWrapper}>
            <View style={[styles.checkboxCircle, { borderColor: Colors.borderLight, backgroundColor: Colors.surfaceElevated }]}>
              <Ionicons name="repeat" size={12} color={Colors.textMuted} />
            </View>
          </View>
        ) : (
          <Pressable
            onPress={handleToggle}
            style={styles.checkboxWrapper}
            hitSlop={10}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isCompleted }}
          >
            <Animated.View
              style={[
                styles.checkboxCircle,
                isCompleted && styles.checkboxChecked,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              {isCompleted && (
                <Ionicons name="checkmark" size={13} color={Colors.white} />
              )}
            </Animated.View>
          </Pressable>
        )}

        {/* Content */}
        <Pressable
          style={styles.content}
          onPress={() => {
            if (!readonly) router.push(`/task/${task.id}`);
          }}
        >
          <Text
            style={[styles.title, isCompleted && styles.titleCompleted]}
            numberOfLines={readonly ? undefined : 1}
          >
            {task.title}
          </Text>
          {task.description ? (
            <Text style={styles.descriptionText} numberOfLines={readonly ? undefined : 2}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            {isOverdue ? (
              <View style={[styles.metaChip, styles.overdueChip]}>
                <Ionicons name="alert-circle-outline" size={11} color={Colors.danger} />
                <Text style={[styles.metaText, { color: Colors.danger }]}>
                  {format(parseISO(task.scheduled_date), 'd MMM', { locale: es })}
                </Text>
              </View>
            ) : null}
            {task.reminder_time ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.metaText}>{task.reminder_time}</Text>
              </View>
            ) : null}
            <View style={styles.metaChip}>
              <Ionicons name={catConfig.icon} size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>{catConfig.label}</Text>
            </View>
            {task.repeat_minutes > 0 && (
              <View style={styles.metaChip}>
                <Ionicons name="repeat-outline" size={11} color={Colors.textMuted} />
                <Text style={styles.metaText}>
                  {task.repeat_minutes < 60
                    ? `${task.repeat_minutes}m`
                    : `${task.repeat_minutes / 60}h`}
                </Text>
              </View>
            )}
          </View>
        </Pressable>

        {/* Priority badge */}
        <PriorityBadge priority={task.priority} size="sm" />
      </Animated.View>
    </View>
  );
}

function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high':   return Colors.danger;
    case 'medium': return Colors.warning;
    case 'low':    return Colors.success;
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  deleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 82,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.dangerDim,
    gap: 2,
  },
  deleteBtn: {
    alignItems: 'center',
    gap: 2,
    padding: Spacing.sm,
  },
  deleteText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    gap: Spacing.sm,
    paddingRight: Spacing.md,
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  cardCompleted: {
    opacity: 0.5,
  },
  priorityLine: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginLeft: 0,
  },
  checkboxWrapper: {
    padding: 2,
  },
  checkboxCircle: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    lineHeight: 20,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  descriptionText: {
    color: Colors.textDim,
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  overdueChip: {
    backgroundColor: 'rgba(248,113,113,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 99,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
});
