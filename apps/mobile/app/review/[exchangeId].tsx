import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { COLORS } from '@/lib/constants'
import { Avatar } from '@/components/Avatar'
import { StarRating } from '@/components/StarRating'

interface ExchangeParticipantInfo {
  id: string
  display_name: string | null
  username: string
  avatar_url: string | null
}

export default function ReviewScreen() {
  const { exchangeId } = useLocalSearchParams<{ exchangeId: string }>()
  const router = useRouter()
  const { profile } = useAuthStore()

  const [reviewee, setReviewee] = useState<ExchangeParticipantInfo | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  useEffect(() => {
    loadReviewTarget()
  }, [exchangeId])

  async function loadReviewTarget() {
    if (!profile) return

    // Check if already reviewed
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('exchange_id', exchangeId)
      .eq('reviewer_id', profile.id)
      .single()

    if (existing) {
      setAlreadyReviewed(true)
      setLoading(false)
      return
    }

    // Get exchange to find the other participant
    const { data: exchange } = await supabase
      .from('exchanges')
      .select('participants')
      .eq('id', exchangeId)
      .single()

    if (!exchange) {
      Alert.alert('Erreur', 'Échange introuvable')
      router.back()
      return
    }

    const otherId = (exchange.participants as string[]).find((id) => id !== profile.id)
    if (!otherId) {
      Alert.alert('Erreur', 'Participant introuvable')
      router.back()
      return
    }

    const { data: otherProfile } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .eq('id', otherId)
      .single()

    setReviewee(otherProfile as ExchangeParticipantInfo)
    setLoading(false)
  }

  async function submitReview() {
    if (!profile || !reviewee) return
    if (rating === 0) {
      Alert.alert('Note requise', 'Veuillez attribuer une note avant de soumettre.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        exchange_id: exchangeId,
        reviewer_id: profile.id,
        reviewee_id: reviewee.id,
        rating,
        comment: comment.trim() || null,
      })

      if (error) throw error

      Alert.alert(
        '⭐ Avis envoyé !',
        'Merci pour votre retour. Il aide la communauté à se faire confiance.',
        [{ text: 'Super !', onPress: () => router.replace('/(tabs)/') }],
      )
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  }

  if (alreadyReviewed) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48 }}>✅</Text>
        <Text style={styles.alreadyTitle}>Avis déjà envoyé</Text>
        <Text style={styles.alreadySub}>Vous avez déjà laissé un avis pour cet échange.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)/')}>
          <Text style={styles.backBtnText}>Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const STAR_LABELS = ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent']

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Laisser un avis</Text>
          <Text style={styles.sub}>Partagez votre expérience pour aider la communauté</Text>

          {/* Reviewee profile */}
          {reviewee && (
            <View style={styles.revieweeCard}>
              <Avatar uri={reviewee.avatar_url} name={reviewee.display_name ?? reviewee.username} size={64} />
              <Text style={styles.revieweeName}>{reviewee.display_name ?? reviewee.username}</Text>
            </View>
          )}

          {/* Star rating */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Note globale</Text>
            <StarRating value={rating} onChange={setRating} size={40} />
            {rating > 0 && (
              <Text style={styles.ratingWord}>{STAR_LABELS[rating]}</Text>
            )}
          </View>

          {/* Comment */}
          <View style={styles.commentSection}>
            <Text style={styles.commentLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Décrivez votre expérience avec cet échangeur…"
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={5}
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>
          </View>

          {/* Trust reminder */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Les avis sont publics et contribuent au score de réputation. Soyez honnête et respectueux.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
            onPress={submitReview}
            disabled={rating === 0 || submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.submitBtnText}>⭐ Envoyer mon avis</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)/')}>
            <Text style={styles.skipText}>Passer pour l'instant</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  heading: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.textSecondary },
  revieweeCard: {
    alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  revieweeName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  ratingSection: { alignItems: 'center', gap: 12 },
  ratingLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  ratingWord: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  commentSection: { gap: 8 },
  commentLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  commentInput: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    fontSize: 15, color: COLORS.text, minHeight: 120, textAlignVertical: 'top',
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  charCount: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'right' },
  infoBox: { backgroundColor: '#F0EEFF', borderRadius: 12, padding: 14 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: COLORS.textTertiary },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: COLORS.textSecondary, fontSize: 14 },
  alreadyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  alreadySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  backBtn: {
    marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  backBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
})
