import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { COLORS } from '@/lib/constants'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  size?: number
  readonly?: boolean
  style?: ViewStyle
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 24,
  readonly = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value)
        if (readonly) {
          return (
            <Text key={star} style={{ fontSize: size, color: filled ? COLORS.warning : COLORS.border, lineHeight: size + 4 }}>
              {filled ? '★' : '☆'}
            </Text>
          )
        }
        return (
          <TouchableOpacity key={star} onPress={() => onChange?.(star)} activeOpacity={0.7}>
            <Text style={{ fontSize: size, color: filled ? COLORS.warning : COLORS.border, lineHeight: size + 4 }}>
              {filled ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
