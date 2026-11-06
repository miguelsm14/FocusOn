import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { format, addDays, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { Colors, Spacing, FontSize, Radius } from "@/constants/theme";

interface DayOption {
  iso: string;
  label: string;
  sublabel: string;
}

function buildDays(count: number): DayOption[] {
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(new Date(), i);
    const iso = format(date, "yyyy-MM-dd");
    const label = isToday(date)
      ? "Hoy"
      : isTomorrow(date)
      ? "Mañana"
      : format(date, "EEE", { locale: es });
    const sublabel = format(date, "d MMM", { locale: es });
    return { iso, label, sublabel };
  });
}

interface DayPickerProps {
  selected: string;
  onChange: (iso: string) => void;
  daysAhead?: number;  // default: 7
}

export function DayPicker({ selected, onChange, daysAhead = 7 }: DayPickerProps) {
  const days = buildDays(daysAhead);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {days.map(day => (
        <TouchableOpacity
          key={day.iso}
          onPress={() => onChange(day.iso)}
          style={[styles.chip, selected === day.iso && styles.chipActive]}
        >
          <Text style={[styles.label, selected === day.iso && styles.labelActive]}>
            {day.label}
          </Text>
          <Text style={[styles.sub, selected === day.iso && styles.subActive]}>
            {day.sublabel}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    minWidth: 64,
    marginRight: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  labelActive: {
    color: Colors.accent,
  },
  sub: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  subActive: {
    color: Colors.accentLight,
  },
});
