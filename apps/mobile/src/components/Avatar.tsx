import React from 'react'
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native'
import { COLORS } from '@/lib/constants'

interface AvatarProps {
  uri?: string | null
  name?: string | null
  size?: number
  style?: ViewStyle
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40, style }) => {
  const initials = React.useMemo(() => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }, [name])

  const fontSize = Math.round(size * 0.38)

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
          style,
        ]}
      />
    )
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.border,
  },
  fallback: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
