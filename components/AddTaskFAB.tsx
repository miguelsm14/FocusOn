import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Colors, Radius, Shadow } from '@/constants/theme';

export function AddTaskFAB() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      tension: 120,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 120,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, { pointerEvents: 'box-none' }]}>
      <Animated.View style={[styles.fabWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/task/new')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel="Añadir nueva tarea"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={30} color={Colors.white} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    zIndex: 200,
  },
  fabWrapper: {
    ...Shadow.glow,
    borderRadius: Radius.full,
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
