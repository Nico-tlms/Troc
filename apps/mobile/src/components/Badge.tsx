import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import { COLORS } from '@/lib/constants'

interface BadgeProps {
  label: string
  color?: string
  textColor?: string
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
  textStyle?: TextStyle
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = COLORS.primary,
  textColor = '#FFFFFF',
  size = 'md',
  style,
  textStyle,
}) => {
  const paddingH = size === 'sm' ? 6 : size === 'lg' ? 12 : 8
  const paddingV = size === 'sm' ? 2 : size === 'lg' ? 6 : 4
  const fontSize = size === 'sm' ? 10 : size === 'lg' ? 14 : 12

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color, paddingHorizontal: paddingH, paddingVertical: paddingV },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor, fontSize }, textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})
