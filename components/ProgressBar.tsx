import { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';

interface Props {
  total: number;
  completed: number;
}

export function ProgressBar({ total, completed }: Props) {
  const progress = total === 0 ? 0 : Math.min(completed / total, 1);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: progress,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const percentage = Math.round(progress * 100);
  const allDone = total > 0 && completed === total;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.fraction}>
            <Text style={styles.fractionBig}>{completed}</Text>
            <Text style={styles.fractionGray}> / {total}</Text>
          </Text>
          <Text style={styles.label}>tareas completadas</Text>
        </View>
        <Text style={[styles.percentage, allDone && styles.percentageDone]}>
          {percentage}%
        </Text>
      </View>

      {/* Track */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            allDone && styles.fillDone,
            {
              width: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {allDone && (
        <Text style={styles.congrats}>🎉 ¡Increíble! Todas las tareas completas</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  fraction: {
    lineHeight: 32,
  },
  fractionBig: {
    color: Colors.text,
    fontWeight: '800',
    fontSize: FontSize.xxl,
  },
  fractionGray: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    fontWeight: '400',
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  percentage: {
    color: Colors.accent,
    fontWeight: '800',
    fontSize: FontSize.xl,
  },
  percentageDone: {
    color: Colors.success,
  },
  track: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
  },
  fillDone: {
    backgroundColor: Colors.success,
  },
  congrats: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
