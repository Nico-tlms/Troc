import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { COLORS, CONDITION_COLORS } from '@/lib/constants'
import { CONDITION_LABELS, ItemCondition, CONDITION_ORDER } from '@/types'

interface ConditionPickerProps {
  value?: ItemCondition | null
  onChange: (condition: ItemCondition) => void
  label?: string
}

export const ConditionPicker: React.FC<ConditionPickerProps> = ({
  value,
  onChange,
  label,
}) => {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CONDITION_ORDER.map((condition) => {
          const selected = value === condition
          const condColor = CONDITION_COLORS[condition] ?? COLORS.primary
          return (
            <TouchableOpacity
              key={condition}
              onPress={() => onChange(condition)}
              style={[
                styles.pill,
                selected
                  ? { backgroundColor: condColor, borderColor: condColor }
                  : { backgroundColor: COLORS.surface, borderColor: COLORS.border },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: selected ? '#FFFFFF' : COLORS.textSecondary },
                ]}
              >
                {CONDITION_LABELS[condition]}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 2,
    gap: 8,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
})
