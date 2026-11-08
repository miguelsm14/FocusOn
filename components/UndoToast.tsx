import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '@/store/useTaskStore';
import type { Task } from '@/lib/db';
import { Colors, Spacing, FontSize, Radius, Shadow } from '@/constants/theme';

/** Altura de la barra de pestañas (ver app/(tabs)/_layout.tsx). */
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 68;

/** Aviso "Tarea eliminada · Deshacer" que aparece tras deslizar una tarea. */
export function UndoToast() {
  const pending = useTaskStore((s) => s.pendingRemove);
  const undoRemove = useTaskStore((s) => s.undoRemove);
  const anim = useRef(new Animated.Value(0)).current;
  // Se guarda la última tarea para que el texto no desaparezca durante la animación de salida.
  const [shown, setShown] = useState<Task | null>(null);

  useEffect(() => {
    if (pending) {
      setShown(pending);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(
        ({ finished }) => finished && setShown(null)
      );
    }
  }, [pending]);

  if (!shown) return null;

  return (
    <Animated.View
      pointerEvents={pending ? 'box-none' : 'none'}
      style={[
        styles.toast,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      <Ionicons name="trash-outline" size={18} color={Colors.textMuted} />
      <Text style={styles.text} numberOfLines={1}>
        Tarea eliminada
      </Text>
      <Pressable onPress={undoRemove} hitSlop={10} style={styles.undoBtn}>
        <Text style={styles.undoText}>Deshacer</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: Spacing.md,
    right: 24 + 62 + Spacing.md, // deja hueco para el botón "+"
    bottom: TAB_BAR_HEIGHT + 28,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    zIndex: 300,
    ...Shadow.md,
  },
  text: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  undoBtn: {
    paddingVertical: Spacing.xs,
  },
  undoText: {
    color: Colors.accentLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
