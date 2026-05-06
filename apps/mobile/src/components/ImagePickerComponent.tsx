import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import * as ExpoImagePicker from 'expo-image-picker'
import { COLORS, MAX_LISTING_IMAGES } from '@/lib/constants'

interface ImagePickerComponentProps {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
}

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  images,
  onChange,
  label,
}) => {
  const handleAdd = async () => {
    if (images.length >= MAX_LISTING_IMAGES) {
      Alert.alert('Limite atteinte', `Maximum ${MAX_LISTING_IMAGES} photos par annonce.`)
      return
    }

    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Troc a besoin d\'accéder à votre galerie pour ajouter des photos.'
      )
      return
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    })

    if (!result.canceled && result.assets.length > 0) {
      const newUri = result.assets[0].uri
      onChange([...images, newUri])
    }
  }

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {images.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(index)}
              activeOpacity={0.8}
            >
              <Text style={styles.removeBtnText}>×</Text>
            </TouchableOpacity>
            {index === 0 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Principal</Text>
              </View>
            )}
          </View>
        ))}
        {images.length < MAX_LISTING_IMAGES && (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.7}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addText}>
              {images.length === 0 ? 'Ajouter une photo' : 'Ajouter'}
            </Text>
            <Text style={styles.addCount}>
              {images.length}/{MAX_LISTING_IMAGES}
            </Text>
          </TouchableOpacity>
        )}
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
    gap: 10,
    paddingVertical: 2,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeBtnText: {
    color: '#FFF',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mainBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  addBtn: {
    width: 100,
    height: 100,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceElevated,
    gap: 2,
  },
  addIcon: {
    fontSize: 28,
    color: COLORS.primary,
    lineHeight: 32,
    fontWeight: '300',
  },
  addText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  addCount: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
})
