import React from 'react'
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
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
        const filled = star <= value
        if (readonly) {
          return (
            <View key={star} style={{ marginHorizontal: 1 }}>
              <StarIcon size={size} filled={filled} />
            </View>
          )
        }
        return (
          <TouchableOpacity
            key={star}
            onPress={() => onChange?.(star)}
            style={{ marginHorizontal: 1 }}
            activeOpacity={0.7}
          >
            <StarIcon size={size} filled={filled} />
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const StarIcon: React.FC<{ size: number; filled: boolean }> = ({ size, filled }) => {
  // Use unicode star characters for simplicity (no icon library dep)
  const style = {
    fontSize: size,
    color: filled ? COLORS.warning : COLORS.border,
    lineHeight: size + 4,
  }
  return (
    <View>
      <React.Fragment>
        {React.createElement(
          require('react-native').Text,
          { style },
          filled ? '★' : '☆'
        )}
      </React.Fragment>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
