import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native'
import { COLORS, CATEGORIES, CategoryDef } from '@/lib/constants'

interface CategoryPickerProps {
  value?: string | null
  onChange: (categoryId: string) => void
  placeholder?: string
  label?: string
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  value,
  onChange,
  placeholder = 'Choisir une catégorie',
  label,
}) => {
  const [visible, setVisible] = useState(false)

  const selectedCat = CATEGORIES.find((c) => c.id === value)

  const handleSelect = (cat: CategoryDef) => {
    onChange(cat.id)
    setVisible(false)
  }

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={selectedCat ? styles.triggerText : styles.triggerPlaceholder}>
          {selectedCat ? `${selectedCat.icon} ${selectedCat.name}` : placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Catégorie</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.closeBtn}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => {
              const selected = item.id === value
              return (
                <Pressable
                  style={[styles.cell, selected && styles.cellSelected]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.cellIcon}>{item.icon}</Text>
                  <Text style={[styles.cellName, selected && styles.cellNameSelected]}>
                    {item.name}
                  </Text>
                </Pressable>
              )
            }}
          />
        </SafeAreaView>
      </Modal>
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
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  triggerText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  triggerPlaceholder: {
    fontSize: 15,
    color: COLORS.textTertiary,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textTertiary,
    marginTop: -2,
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  grid: {
    padding: 12,
    gap: 8,
  },
  cell: {
    flex: 1,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 88,
  },
  cellSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceElevated,
  },
  cellIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  cellName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  cellNameSelected: {
    color: COLORS.primary,
  },
})
