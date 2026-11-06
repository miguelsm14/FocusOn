import { View, Text, StyleSheet } from 'react-native';
import { PriorityConfig, FontSize, Radius } from '@/constants/theme';

type PriorityKey = 'high' | 'medium' | 'low';

interface Props {
  priority: PriorityKey;
  size?: 'sm' | 'md';
}

export function PriorityBadge({ priority, size = 'md' }: Props) {
  const config = PriorityConfig[priority];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.dimColor,
          borderColor: config.color,
          paddingHorizontal: isSmall ? 7 : 10,
          paddingVertical: isSmall ? 2 : 5,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.color, fontSize: isSmall ? FontSize.xs : FontSize.sm },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
