import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { useListingsStore } from '@/stores/listings'
import { CategoryPicker } from '@/components/CategoryPicker'
import { ConditionPicker } from '@/components/ConditionPicker'
import { ImagePickerComponent } from '@/components/ImagePickerComponent'
import { COLORS, CATEGORIES } from '@/lib/constants'
import type { ItemCondition } from '@/types'

interface FormState {
  propose_title: string
  propose_description: string
  propose_category_id: string
  propose_condition: ItemCondition | ''
  propose_estimated_value: string
  propose_images: string[]
  search_title: string
  search_description: string
  search_category_id: string
  search_condition_min: ItemCondition | ''
  search_value_min: string
  search_value_max: string
  search_keywords: string
  location_city: string
  max_distance_km: string
}

const INITIAL: FormState = {
  propose_title: '', propose_description: '', propose_category_id: '',
  propose_condition: '', propose_estimated_value: '', propose_images: [],
  search_title: '', search_description: '', search_category_id: '',
  search_condition_min: '', search_value_min: '', search_value_max: '',
  search_keywords: '', location_city: '', max_distance_km: '50',
}

function SectionHeader({ emoji, title, color }: { emoji: string; title: string; color: string }) {
  return (
    <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
      <Text style={styles.sectionHeaderEmoji}>{emoji}</Text>
      <Text style={[styles.sectionHeaderText, { color }]}>{title}</Text>
    </View>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      {children}
    </View>
  )
}

export default function CreateListingScreen() {
  const router = useRouter()
  const { createListing } = useListingsStore()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const set = (key: keyof FormState) => (val: string | string[]) =>
    setForm((f) => ({ ...f, [key]: val }))

  const autoLocate = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Activez la géolocalisation pour utiliser cette fonction.')
      return
    }
    const loc = await Location.getCurrentPositionAsync({})
    const [place] = await Location.reverseGeocodeAsync(loc.coords)
    setForm((f) => ({
      ...f,
      location_city: place?.city ?? place?.region ?? '',
    }))
  }

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.propose_title.trim()) e.propose_title = 'Titre requis'
    if (!form.search_title.trim()) e.search_title = 'Titre requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await createListing({
        propose_title: form.propose_title.trim(),
        propose_description: form.propose_description.trim() || undefined,
        propose_category_id: form.propose_category_id || undefined,
        propose_condition: (form.propose_condition as ItemCondition) || undefined,
        propose_estimated_value: form.propose_estimated_value ? Math.round(parseFloat(form.propose_estimated_value) * 100) : undefined,
        propose_images: form.propose_images,
        search_title: form.search_title.trim(),
        search_description: form.search_description.trim() || undefined,
        search_category_id: form.search_category_id || undefined,
        search_condition_min: (form.search_condition_min as ItemCondition) || undefined,
        search_value_min: form.search_value_min ? Math.round(parseFloat(form.search_value_min) * 100) : undefined,
        search_value_max: form.search_value_max ? Math.round(parseFloat(form.search_value_max) * 100) : undefined,
        search_keywords: form.search_keywords ? form.search_keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        location_city: form.location_city.trim() || undefined,
        max_distance_km: parseInt(form.max_distance_km) || 50,
      })
      router.back()
    } catch (err: unknown) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de créer l\'annonce.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Je propose ────────────────────── */}
          <SectionHeader emoji="🟦" title="Ce que je propose" color={COLORS.primary} />

          <Field label="Titre" required>
            <TextInput
              style={[styles.input, errors.propose_title && styles.inputError]}
              value={form.propose_title}
              onChangeText={set('propose_title')}
              placeholder="Ex : iPhone 13 Pro en bon état"
              placeholderTextColor={COLORS.textTertiary}
            />
            {errors.propose_title && <Text style={styles.errorText}>{errors.propose_title}</Text>}
          </Field>

          <Field label="Description">
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={form.propose_description}
              onChangeText={set('propose_description')}
              placeholder="Décrivez votre objet (état, accessoires inclus…)"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
            />
          </Field>

          <Field label="Catégorie">
            <CategoryPicker
              value={form.propose_category_id}
              onChange={(id) => setForm((f) => ({ ...f, propose_category_id: id }))}
            />
          </Field>

          <Field label="État">
            <ConditionPicker
              value={form.propose_condition as ItemCondition | undefined}
              onChange={(c) => setForm((f) => ({ ...f, propose_condition: c }))}
            />
          </Field>

          <Field label="Valeur estimée (€)">
            <TextInput
              style={styles.input}
              value={form.propose_estimated_value}
              onChangeText={set('propose_estimated_value')}
              placeholder="Ex : 200"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
            />
          </Field>

          <Field label="Photos (max 5)">
            <ImagePickerComponent
              images={form.propose_images}
              onImagesChange={(imgs) => setForm((f) => ({ ...f, propose_images: imgs }))}
              maxImages={5}
            />
          </Field>

          {/* ── Je cherche ────────────────────── */}
          <SectionHeader emoji="🟥" title="Ce que je cherche en échange" color={COLORS.secondary} />

          <Field label="Titre" required>
            <TextInput
              style={[styles.input, errors.search_title && styles.inputError]}
              value={form.search_title}
              onChangeText={set('search_title')}
              placeholder="Ex : Console PS5 avec manettes"
              placeholderTextColor={COLORS.textTertiary}
            />
            {errors.search_title && <Text style={styles.errorText}>{errors.search_title}</Text>}
          </Field>

          <Field label="Description">
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={form.search_description}
              onChangeText={set('search_description')}
              placeholder="Précisez vos attentes…"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
            />
          </Field>

          <Field label="Catégorie souhaitée">
            <CategoryPicker
              value={form.search_category_id}
              onChange={(id) => setForm((f) => ({ ...f, search_category_id: id }))}
            />
          </Field>

          <Field label="État minimum accepté">
            <ConditionPicker
              value={form.search_condition_min as ItemCondition | undefined}
              onChange={(c) => setForm((f) => ({ ...f, search_condition_min: c }))}
            />
          </Field>

          <View style={styles.rangeRow}>
            <View style={styles.rangeField}>
              <Text style={styles.fieldLabel}>Valeur min (€)</Text>
              <TextInput
                style={styles.input}
                value={form.search_value_min}
                onChangeText={set('search_value_min')}
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={styles.rangeDash}>—</Text>
            <View style={styles.rangeField}>
              <Text style={styles.fieldLabel}>Valeur max (€)</Text>
              <TextInput
                style={styles.input}
                value={form.search_value_max}
                onChangeText={set('search_value_max')}
                placeholder="∞"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Field label="Mots-clés (séparés par des virgules)">
            <TextInput
              style={styles.input}
              value={form.search_keywords}
              onChangeText={set('search_keywords')}
              placeholder="Ex : apple, reconditionné, 256go"
              placeholderTextColor={COLORS.textTertiary}
            />
          </Field>

          {/* ── Localisation ─────────────────── */}
          <SectionHeader emoji="📍" title="Localisation" color={COLORS.text} />

          <Field label="Ville">
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={form.location_city}
                onChangeText={set('location_city')}
                placeholder="Ex : Bordeaux"
                placeholderTextColor={COLORS.textTertiary}
              />
              <TouchableOpacity style={styles.locateBtn} onPress={autoLocate}>
                <Text style={styles.locateBtnText}>📍 Ma position</Text>
              </TouchableOpacity>
            </View>
          </Field>

          <Field label={`Distance max : ${form.max_distance_km} km`}>
            <View style={styles.distanceRow}>
              {[10, 25, 50, 100].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.distanceChip, form.max_distance_km === String(d) && styles.distanceChipActive]}
                  onPress={() => setForm((f) => ({ ...f, max_distance_km: String(d) }))}
                >
                  <Text style={[styles.distanceChipText, form.max_distance_km === String(d) && styles.distanceChipTextActive]}>
                    {d} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Publier l'annonce ✨</Text>}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderLeftWidth: 4, paddingLeft: 12, paddingVertical: 6,
    marginTop: 8,
  },
  sectionHeaderEmoji: { fontSize: 18 },
  sectionHeaderText: { fontSize: 16, fontWeight: '800' },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  required: { color: COLORS.error },
  input: {
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.text,
  },
  inputError: { borderColor: COLORS.error },
  inputMulti: { height: 88, textAlignVertical: 'top', paddingTop: 12 },
  errorText: { fontSize: 12, color: COLORS.error },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  rangeField: { flex: 1, gap: 6 },
  rangeDash: { fontSize: 18, color: COLORS.textTertiary, marginBottom: 13 },
  locationRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  locationInput: { flex: 1 },
  locateBtn: {
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13,
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  locateBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  distanceRow: { flexDirection: 'row', gap: 10 },
  distanceChip: {
    flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  distanceChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  distanceChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  distanceChipTextActive: { color: '#FFF' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center', marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
})
