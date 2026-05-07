import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { COLORS } from '@/lib/constants'
import type { Exchange } from '@/types'

// QR display uses raw code string (react-native-qrcode-svg can be added for production)

export default function QRExchangeScreen() {
  const { exchangeId, conversationId } = useLocalSearchParams<{
    exchangeId?: string
    conversationId?: string
  }>()
  const router = useRouter()
  const { profile } = useAuthStore()

  const [exchange, setExchange] = useState<Exchange | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'show' | 'scan'>('show')
  const [scanValue, setScanValue] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (exchangeId) {
      loadExchange(exchangeId)
    } else if (conversationId) {
      createExchange(conversationId)
    }
  }, [exchangeId, conversationId])

  async function loadExchange(id: string) {
    const { data, error } = await supabase
      .from('exchanges')
      .select(`
        *,
        match:matches(
          *,
          listing_a:listings!listing_a_id(propose_title, propose_images),
          listing_b:listings!listing_b_id(propose_title, propose_images)
        )
      `)
      .eq('id', id)
      .single()

    if (!error) setExchange(data as Exchange)
    setLoading(false)
  }

  async function createExchange(convId: string) {
    if (!profile) return

    // Get the match from the conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('match_id, participant_ids')
      .eq('id', convId)
      .single()

    if (!conv?.match_id) {
      Alert.alert('Erreur', "Impossible de créer l'échange : match introuvable.")
      router.back()
      return
    }

    const { data: existing } = await supabase
      .from('exchanges')
      .select('*')
      .eq('match_id', conv.match_id)
      .neq('status', 'cancelled')
      .single()

    if (existing) {
      setExchange(existing as Exchange)
      setLoading(false)
      return
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2h

    const { data, error } = await supabase
      .from('exchanges')
      .insert({
        match_id: conv.match_id,
        initiator_id: profile.id,
        participants: conv.participant_ids,
        qr_expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) {
      Alert.alert('Erreur', error.message)
      router.back()
      return
    }

    setExchange(data as Exchange)
    setLoading(false)
  }

  async function confirmExchange() {
    if (!exchange || !profile) return
    setConfirming(true)

    try {
      const alreadyConfirmed = exchange.confirmed_by.includes(profile.id)
      if (alreadyConfirmed) {
        Alert.alert('Déjà confirmé', 'Vous avez déjà confirmé cet échange.')
        setConfirming(false)
        return
      }

      const newConfirmedBy = [...exchange.confirmed_by, profile.id]
      const allConfirmed = newConfirmedBy.length >= exchange.participants.length

      const { error } = await supabase
        .from('exchanges')
        .update({
          confirmed_by: newConfirmedBy,
          status: allConfirmed ? 'completed' : 'confirmed',
          completed_at: allConfirmed ? new Date().toISOString() : null,
        })
        .eq('id', exchange.id)

      if (error) throw error

      if (allConfirmed) {
        // Update match status
        if (exchange.match_id) {
          await supabase.from('matches').update({ status: 'completed' }).eq('id', exchange.match_id)
        }
        Alert.alert(
          '🎉 Échange validé !',
          "Félicitations ! N'oubliez pas de laisser un avis.",
          [
            {
              text: 'Laisser un avis',
              onPress: () => router.replace(`/review/${exchange.id}`),
            },
            { text: 'Plus tard', onPress: () => router.replace('/(tabs)/') },
          ],
        )
      } else {
        Alert.alert(
          '✅ Confirmation enregistrée',
          "En attente de la confirmation de l'autre participant.",
        )
        router.back()
      }
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as Error).message)
    } finally {
      setConfirming(false)
    }
  }

  async function handleScan() {
    if (!scanValue.trim()) {
      Alert.alert('QR Code manquant', 'Entrez le code QR de votre partenaire.')
      return
    }

    // Validate QR code against exchange
    const { data, error } = await supabase
      .from('exchanges')
      .select('*')
      .eq('qr_code', scanValue.trim())
      .single()

    if (error || !data) {
      Alert.alert('Code invalide', 'Ce code QR ne correspond à aucun échange actif.')
      return
    }

    const ex = data as Exchange
    if (ex.qr_expires_at && new Date(ex.qr_expires_at) < new Date()) {
      Alert.alert('Code expiré', 'Ce code QR a expiré. Demandez un nouveau code.')
      return
    }

    setExchange(ex)
    setMode('show')
    Alert.alert('Code validé !', "Confirmez maintenant l'échange.")
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Préparation de l'échange…</Text>
      </View>
    )
  }

  if (!exchange) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Échange introuvable</Text>
      </View>
    )
  }

  const isExpired = exchange.qr_expires_at && new Date(exchange.qr_expires_at) < new Date()
  const myConfirmed = profile ? exchange.confirmed_by.includes(profile.id) : false
  const confirmCount = exchange.confirmed_by.length
  const totalParticipants = exchange.participants.length

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'show' && styles.modeBtnActive]}
            onPress={() => setMode('show')}
          >
            <Text style={[styles.modeBtnText, mode === 'show' && styles.modeBtnTextActive]}>
              📲 Mon QR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'scan' && styles.modeBtnActive]}
            onPress={() => setMode('scan')}
          >
            <Text style={[styles.modeBtnText, mode === 'scan' && styles.modeBtnTextActive]}>
              📷 Scanner
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'show' ? (
          <>
            <Text style={styles.sectionTitle}>Votre code QR d'échange</Text>

            {/* QR code visual */}
            <View style={styles.qrContainer}>
              {isExpired ? (
                <View style={styles.qrExpired}>
                  <Text style={{ fontSize: 40 }}>⏰</Text>
                  <Text style={styles.expiredText}>Code expiré</Text>
                </View>
              ) : (
                <>
                  {/* In production: <QRCode value={exchange.qr_code} size={200} /> */}
                  <View style={styles.qrPlaceholder}>
                    <Text style={styles.qrIcon}>⬛⬜⬛{'\n'}⬜⬛⬜{'\n'}⬛⬜⬛</Text>
                    <Text style={styles.qrCodeText}>{exchange.qr_code.substring(0, 8).toUpperCase()}</Text>
                  </View>
                  {exchange.qr_expires_at && (
                    <Text style={styles.expiresText}>
                      Expire le {new Date(exchange.qr_expires_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Récap des objets */}
            <View style={styles.recap}>
              <Text style={styles.recapTitle}>Récapitulatif de l'échange</Text>
              <View style={styles.recapRow}>
                <View style={[styles.recapItem, styles.recapItemLeft]}>
                  <Text style={styles.recapLabel}>Je donne</Text>
                  <Text style={styles.recapValue} numberOfLines={2}>
                    {(exchange.match as { listing_a?: { propose_title: string }; listing_b?: { propose_title: string } } | undefined)?.listing_a?.propose_title ?? '—'}
                  </Text>
                </View>
                <Text style={styles.recapArrow}>⇄</Text>
                <View style={[styles.recapItem, styles.recapItemRight]}>
                  <Text style={styles.recapLabel}>Je reçois</Text>
                  <Text style={styles.recapValue} numberOfLines={2}>
                    {(exchange.match as { listing_a?: { propose_title: string }; listing_b?: { propose_title: string } } | undefined)?.listing_b?.propose_title ?? '—'}
                  </Text>
                </View>
              </View>
              {exchange.compensation_amount > 0 && (
                <View style={styles.compensationBanner}>
                  <Text style={styles.compensationText}>
                    💶 Soulte : {(exchange.compensation_amount / 100).toFixed(2)} €
                  </Text>
                </View>
              )}
            </View>

            {/* Confirmation progress */}
            <View style={styles.progress}>
              <Text style={styles.progressText}>
                {confirmCount} / {totalParticipants} participant{totalParticipants > 1 ? 's' : ''} ont confirmé
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(confirmCount / totalParticipants) * 100}%` }]} />
              </View>
            </View>

            {myConfirmed ? (
              <View style={styles.confirmedBanner}>
                <Text style={styles.confirmedText}>✅ Vous avez confirmé · En attente de l'autre partie</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.confirmBtn, isExpired && styles.confirmBtnDisabled]}
                onPress={confirmExchange}
                disabled={!!isExpired || confirming}
                activeOpacity={0.85}
              >
                {confirming
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.confirmBtnText}>✅ Confirmer l'échange</Text>
                }
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Scanner le code de votre partenaire</Text>
            <Text style={styles.scanHint}>
              Demandez à votre partenaire d'afficher son code QR, puis saisissez-le ci-dessous (en attendant la caméra).
            </Text>

            {/* Manual code input as fallback */}
            <View style={styles.manualInput}>
              <Text style={styles.manualLabel}>Code de l'échange</Text>
              <View style={styles.manualRow}>
                <TouchableOpacity
                  style={styles.manualBtn}
                  onPress={handleScan}
                >
                  <Text style={styles.manualBtnText}>Valider</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.manualHint}>
                Le code est affiché sous le QR de votre partenaire (ex: A1B2C3D4)
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 18, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: COLORS.textSecondary, fontSize: 14 },
  errorText: { color: COLORS.error, fontSize: 16 },
  modeToggle: {
    flexDirection: 'row', backgroundColor: COLORS.border,
    borderRadius: 14, padding: 4,
  },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: COLORS.surface },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modeBtnTextActive: { color: COLORS.primary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  qrContainer: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  qrPlaceholder: { alignItems: 'center', gap: 12 },
  qrIcon: { fontSize: 24, lineHeight: 32, textAlign: 'center', letterSpacing: 2 },
  qrCodeText: {
    fontFamily: 'monospace', fontSize: 20, fontWeight: '700',
    color: COLORS.text, letterSpacing: 4,
    backgroundColor: COLORS.surfaceElevated, padding: 10, borderRadius: 8,
  },
  qrExpired: { alignItems: 'center', gap: 8 },
  expiredText: { fontSize: 16, fontWeight: '700', color: COLORS.error },
  expiresText: { fontSize: 12, color: COLORS.textSecondary },
  recap: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 12,
  },
  recapTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recapItem: { flex: 1, borderRadius: 12, padding: 12 },
  recapItemLeft: { backgroundColor: '#F0EEFF' },
  recapItemRight: { backgroundColor: '#FFF0F3' },
  recapLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 4 },
  recapValue: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  recapArrow: { fontSize: 18, color: COLORS.textTertiary },
  compensationBanner: {
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 10, alignItems: 'center',
  },
  compensationText: { fontSize: 14, fontWeight: '700', color: '#F57F17' },
  progress: { gap: 8 },
  progressText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  progressTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: COLORS.success, borderRadius: 4 },
  confirmedBanner: {
    backgroundColor: COLORS.success + '20', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  confirmedText: { fontSize: 13, fontWeight: '600', color: COLORS.success },
  confirmBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  confirmBtnDisabled: { backgroundColor: COLORS.textTertiary },
  confirmBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  scanHint: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  manualInput: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 12,
  },
  manualLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  manualBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  manualHint: { fontSize: 12, color: COLORS.textTertiary },
})
