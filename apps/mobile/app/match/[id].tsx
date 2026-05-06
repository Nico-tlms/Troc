import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useMatchesStore } from '@/stores/matches'
import { COLORS } from '@/lib/constants'
import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { StarRating } from '@/components/StarRating'
import { CONDITION_LABELS } from '@troc/types'
import type { Match, ChainMatch } from '@troc/types'

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuthStore()
  const { acceptMatch, rejectMatch } = useMatchesStore()

  const isChain = id?.startsWith('chain-')
  const realId = isChain ? id.replace('chain-', '') : id

  const [match, setMatch] = useState<Match | null>(null)
  const [chainMatch, setChainMatch] = useState<ChainMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => { load() }, [realId])

  async function load() {
    setLoading(true)
    if (isChain) {
      const { data } = await supabase
        .from('chain_matches')
        .select('*, listings:listings(*,profile:profiles(*)), users:profiles(*)')
        .eq('id', realId)
        .single()
      setChainMatch(data as ChainMatch)
    } else {
      const { data } = await supabase
        .from('matches')
        .select(`
          *,
          listing_a:listings!listing_a_id(*,
            profile:profiles(*),
            propose_category:categories!listings_propose_category_id_fkey(*),
            search_category:categories!listings_search_category_id_fkey(*)
          ),
          listing_b:listings!listing_b_id(*,
            profile:profiles(*),
            propose_category:categories!listings_propose_category_id_fkey(*),
            search_category:categories!listings_search_category_id_fkey(*)
          ),
          user_a:profiles!user_a_id(*),
          user_b:profiles!user_b_id(*)
        `)
        .eq('id', realId)
        .single()
      setMatch(data as Match)
    }
    setLoading(false)
  }

  async function handleAccept() {
    if (!match) return
    setActing(true)
    try {
      await acceptMatch(match.id)

      // Open or create conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('match_id', match.id)
        .single()

      if (existing) {
        router.replace(`/chat/${existing.id}`)
      } else {
        const { data: conv } = await supabase
          .from('conversations')
          .insert({ match_id: match.id, participant_ids: [match.user_a_id, match.user_b_id] })
          .select()
          .single()
        if (conv) router.replace(`/chat/${conv.id}`)
      }
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as Error).message)
    } finally {
      setActing(false)
    }
  }

  async function handleReject() {
    if (!match) return
    Alert.alert('Refuser ce match ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser', style: 'destructive',
        onPress: async () => {
          setActing(true)
          try {
            await rejectMatch(match.id)
            router.back()
          } finally {
            setActing(false)
          }
        },
      },
    ])
  }

  async function handleChainAccept() {
    if (!chainMatch || !profile) return
    setActing(true)
    try {
      const alreadyAccepted = chainMatch.accepted_by.includes(profile.id)
      if (!alreadyAccepted) {
        await supabase
          .from('chain_matches')
          .update({ accepted_by: [...chainMatch.accepted_by, profile.id] })
          .eq('id', chainMatch.id)
      }
      Alert.alert('Accepté !', "Vous avez accepté cet échange en chaîne. Les autres participants doivent aussi confirmer.")
      router.back()
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as Error).message)
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
  }

  // ─── Chain match view ─────────────────────────────────────────────────────
  if (isChain && chainMatch) {
    const myAccepted = profile ? chainMatch.accepted_by.includes(profile.id) : false
    const listings = (chainMatch as ChainMatch & { listings?: Array<{ id: string; propose_title: string; search_title: string; profile?: { display_name?: string; username: string; avatar_url?: string; reputation_score: number } }> }).listings ?? []

    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.chainHeader}>
            <Text style={styles.chainEmoji}>🔄</Text>
            <Text style={styles.chainTitle}>Échange en chaîne</Text>
            <Text style={styles.chainSub}>{chainMatch.chain_length} participants · chacun donne et reçoit</Text>
          </View>

          <Text style={styles.explainer}>
            Notre algorithme a détecté une boucle d'échange. Chaque flèche indique ce que la personne donne à la suivante.
          </Text>

          {listings.map((listing, i) => (
            <View key={listing.id} style={styles.chainStep}>
              <View style={styles.chainStepLeft}>
                <Avatar
                  uri={listing.profile?.avatar_url ?? null}
                  name={listing.profile?.display_name ?? listing.profile?.username ?? '?'}
                  size={40}
                />
                <View style={styles.chainStepInfo}>
                  <Text style={styles.chainStepUser}>
                    {listing.profile?.display_name ?? listing.profile?.username}
                  </Text>
                  <Text style={styles.chainStepItem} numberOfLines={1}>donne : {listing.propose_title}</Text>
                </View>
              </View>
              {i < listings.length - 1 && (
                <Text style={styles.chainArrow}>↓</Text>
              )}
            </View>
          ))}

          <View style={styles.chainCloseArrow}>
            <Text style={styles.chainArrow}>↑ reçoit en retour</Text>
          </View>

          {myAccepted && (
            <View style={styles.acceptedBanner}>
              <Text style={styles.acceptedText}>✅ Vous avez déjà accepté cet échange</Text>
            </View>
          )}

          <View style={styles.progressBar}>
            <Text style={styles.progressText}>
              {chainMatch.accepted_by.length} / {chainMatch.chain_length} participants ont accepté
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(chainMatch.accepted_by.length / chainMatch.chain_length) * 100}%` },
                ]}
              />
            </View>
          </View>
        </ScrollView>

        {!myAccepted && (
          <View style={styles.ctaBar}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleChainAccept}
              disabled={acting}
              activeOpacity={0.85}
            >
              {acting
                ? <ActivityIndicator color="#FFF" />
                : <Text style={styles.acceptBtnText}>✅ Accepter cet échange en chaîne</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    )
  }

  // ─── Bilateral match view ──────────────────────────────────────────────────
  if (!match) {
    return <View style={styles.center}><Text style={{ color: COLORS.error }}>Match introuvable</Text></View>
  }

  const isUserA = profile?.id === match.user_a_id
  const myListing = isUserA ? match.listing_a : match.listing_b
  const theirListing = isUserA ? match.listing_b : match.listing_a
  const theirProfile = isUserA ? match.user_b : match.user_a

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Score */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>⚡ Score {Math.round(match.match_score)}%</Text>
          </View>
          <Badge label="Bilatéral" color={COLORS.primary} />
        </View>

        {/* Side-by-side listings */}
        <View style={styles.listings}>
          {/* My listing */}
          <View style={[styles.listingCard, styles.myCard]}>
            <Text style={styles.listingLabel}>🟦 Moi</Text>
            <Text style={styles.listingTitle} numberOfLines={2}>{myListing?.propose_title}</Text>
            {myListing?.propose_condition && (
              <Text style={styles.listingMeta}>{CONDITION_LABELS[myListing.propose_condition]}</Text>
            )}
            {myListing?.propose_estimated_value && (
              <Text style={styles.listingValue}>~{(myListing.propose_estimated_value / 100).toFixed(0)} €</Text>
            )}
            <Text style={styles.listingWants}>cherche : {myListing?.search_title}</Text>
          </View>

          <View style={styles.swapIcon}>
            <Text style={{ fontSize: 24 }}>⇄</Text>
          </View>

          {/* Their listing */}
          <View style={[styles.listingCard, styles.theirCard]}>
            <Text style={styles.listingLabel}>🟥 Eux</Text>
            <Text style={styles.listingTitle} numberOfLines={2}>{theirListing?.propose_title}</Text>
            {theirListing?.propose_condition && (
              <Text style={styles.listingMeta}>{CONDITION_LABELS[theirListing.propose_condition]}</Text>
            )}
            {theirListing?.propose_estimated_value && (
              <Text style={styles.listingValue}>~{(theirListing.propose_estimated_value / 100).toFixed(0)} €</Text>
            )}
            <Text style={styles.listingWants}>cherche : {theirListing?.search_title}</Text>
          </View>
        </View>

        {/* Their profile */}
        {theirProfile && (
          <View style={styles.profileCard}>
            <Avatar
              uri={(theirProfile as { avatar_url?: string }).avatar_url ?? null}
              name={(theirProfile as { display_name?: string; username: string }).display_name ?? (theirProfile as { username: string }).username}
              size={52}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {(theirProfile as { display_name?: string; username: string }).display_name ?? (theirProfile as { username: string }).username}
              </Text>
              <StarRating value={(theirProfile as { reputation_score: number }).reputation_score} readonly size={15} />
              <Text style={styles.profileExchanges}>
                {(theirProfile as { exchange_count: number }).exchange_count} échange{(theirProfile as { exchange_count: number }).exchange_count !== 1 ? 's' : ''} réalisé{(theirProfile as { exchange_count: number }).exchange_count !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {match.status === 'pending' && (
        <View style={styles.ctaBar}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={handleReject}
            disabled={acting}
            activeOpacity={0.85}
          >
            <Text style={styles.rejectBtnText}>✕ Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={handleAccept}
            disabled={acting}
            activeOpacity={0.85}
          >
            {acting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.acceptBtnText}>✓ Accepter · Ouvrir le chat</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {match.status === 'accepted' && (
        <View style={styles.ctaBar}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={async () => {
              const { data } = await supabase
                .from('conversations')
                .select('id')
                .eq('match_id', match.id)
                .single()
              if (data) router.push(`/chat/${data.id}`)
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.acceptBtnText}>💬 Ouvrir le chat</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBadge: {
    backgroundColor: COLORS.primary + '20', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  scoreText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  listings: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listingCard: {
    flex: 1, borderRadius: 14, padding: 14, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  myCard: { backgroundColor: '#F0EEFF', borderTopWidth: 3, borderTopColor: COLORS.primary },
  theirCard: { backgroundColor: '#FFF0F3', borderTopWidth: 3, borderTopColor: COLORS.secondary },
  listingLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary },
  listingTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  listingMeta: { fontSize: 11, color: COLORS.textSecondary },
  listingValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  listingWants: { fontSize: 11, color: COLORS.textTertiary, fontStyle: 'italic' },
  swapIcon: { alignSelf: 'center', paddingTop: 24 },
  profileCard: {
    flexDirection: 'row', gap: 14, alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  profileInfo: { gap: 4 },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  profileExchanges: { fontSize: 12, color: COLORS.textSecondary },
  ctaBar: {
    flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 24,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  rejectBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2, borderColor: COLORS.error,
  },
  rejectBtnText: { color: COLORS.error, fontWeight: '700', fontSize: 15 },
  acceptBtn: {
    flex: 2, backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  acceptBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  // Chain styles
  chainHeader: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  chainEmoji: { fontSize: 48 },
  chainTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  chainSub: { fontSize: 14, color: COLORS.textSecondary },
  explainer: {
    backgroundColor: '#F0EEFF', borderRadius: 12, padding: 14,
    fontSize: 13, color: COLORS.textSecondary, lineHeight: 20,
  },
  chainStep: { gap: 8 },
  chainStepLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14 },
  chainStepInfo: { flex: 1 },
  chainStepUser: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  chainStepItem: { fontSize: 13, color: COLORS.textSecondary },
  chainArrow: { textAlign: 'center', fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  chainCloseArrow: { alignItems: 'center', paddingVertical: 4 },
  acceptedBanner: {
    backgroundColor: COLORS.success + '20', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  acceptedText: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  progressBar: { gap: 8 },
  progressText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  progressTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
})
