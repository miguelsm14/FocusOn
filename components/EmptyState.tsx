import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '@/constants/theme';

interface Props {
  message?: string;
  subMessage?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function EmptyState({
  message = 'No hay tareas todavía',
  subMessage = 'Toca el botón + para añadir tu primera tarea',
  icon = 'checkmark-circle-outline',
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={64} color={Colors.accent} style={styles.icon} />
      </View>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subMessage}>{subMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  iconWrapper: {
    marginBottom: Spacing.md,
  },
  icon: {
    opacity: 0.35,
  },
  message: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  subMessage: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
