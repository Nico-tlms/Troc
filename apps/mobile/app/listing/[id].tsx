import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { COLORS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import { Avatar } from '@/components/Avatar'
import { StarRating } from '@/components/StarRating'
import { Badge } from '@/components/Badge'
import { CONDITION_LABELS } from '@/types'
import type { Listing } from '@/types'

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuthStore()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    loadListing()
    incrementView()
  }, [id])

  async function loadListing() {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profile:profiles(*),
        propose_category:categories!listings_propose_category_id_fkey(id, name, slug, icon),
        search_category:categories!listings_search_category_id_fkey(id, name, slug, icon)
      `)
      .eq('id', id)
      .single()

    if (!error) setListing(data as Listing)
    setLoading(false)
  }

  async function incrementView() {
    await supabase.rpc('increment_listing_view', { listing_id: id })
  }

  async function proposeExchange() {
    if (!profile || !listing) return
    if (profile.id === listing.user_id) {
      Alert.alert('Erreur', "Vous ne pouvez pas échanger avec vous-même.")
      return
    }

    setProposing(true)
    try {
      // Create a conversation between the two users
      const { data: conv, error: convErr } = await supabase
        .from('conversations')
        .insert({ participant_ids: [profile.id, listing.user_id] })
        .select()
        .single()

      if (convErr) throw convErr

      // Send an initial system message
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id: profile.id,
        type: 'exchange_proposal',
        content: `💡 Proposition d'échange : "${profile.display_name ?? profile.username}" s'intéresse à "${listing.propose_title}"`,
      })

      router.push(`/chat/${conv.id}`)
    } catch (e: unknown) {
      Alert.alert('Erreur', (e as Error).message)
    } finally {
      setProposing(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Annonce introuvable</Text>
      </View>
    )
  }

  const isOwner = profile?.id === listing.user_id
  const images = listing.propose_images ?? []

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Images */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <>
              <Image source={{ uri: images[imageIndex] }} style={styles.mainImage} resizeMode="cover" />
              {images.length > 1 && (
                <ScrollView horizontal style={styles.thumbnailRow} showsHorizontalScrollIndicator={false}>
                  {images.map((img, i) => (
                    <TouchableOpacity key={i} onPress={() => setImageIndex(i)}>
                      <Image
                        source={{ uri: img }}
                        style={[styles.thumbnail, i === imageIndex && styles.thumbnailActive]}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          ) : (
            <View style={styles.noImage}>
              <Text style={{ fontSize: 48 }}>📦</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {/* Status */}
          <View style={styles.statusRow}>
            <Badge
              label={STATUS_LABELS[listing.status] ?? listing.status}
              color={STATUS_COLORS[listing.status] ?? COLORS.textSecondary}
            />
            {listing.view_count > 0 && (
              <Text style={styles.views}>👁 {listing.view_count} vue{listing.view_count > 1 ? 's' : ''}</Text>
            )}
          </View>

          {/* Propose side */}
          <View style={[styles.sideCard, styles.proposeCard]}>
            <Text style={styles.sideLabel}>🟦 Je propose</Text>
            <Text style={styles.sideTitle}>{listing.propose_title}</Text>
            {listing.propose_description && (
              <Text style={styles.sideDesc}>{listing.propose_description}</Text>
            )}
            <View style={styles.metaRow}>
              {listing.propose_category && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    {(listing.propose_category as { icon?: string }).icon} {(listing.propose_category as { name: string }).name}
                  </Text>
                </View>
              )}
              {listing.propose_condition && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    {CONDITION_LABELS[listing.propose_condition]}
                  </Text>
                </View>
              )}
              {listing.propose_estimated_value && (
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipText}>
                    ~{(listing.propose_estimated_value / 100).toFixed(0)} €
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Search side */}
          <View style={[styles.sideCard, styles.searchCard]}>
            <Text style={styles.sideLabelSearch}>🟥 Je recherche</Text>
            <Text style={styles.sideTitle}>{listing.search_title}</Text>
            {listing.search_description && (
              <Text style={styles.sideDesc}>{listing.search_description}</Text>
            )}
            <View style={styles.metaRow}>
              {listing.search_category && (
                <View style={styles.metaChipSearch}>
                  <Text style={styles.metaChipText}>
                    {(listing.search_category as { icon?: string }).icon} {(listing.search_category as { name: string }).name}
                  </Text>
                </View>
              )}
              {listing.search_value_min != null && listing.search_value_max != null && (
                <View style={styles.metaChipSearch}>
                  <Text style={styles.metaChipText}>
                    {(listing.search_value_min / 100).toFixed(0)}–{(listing.search_value_max / 100).toFixed(0)} €
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Location */}
          {listing.location_city && (
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>📍 {listing.location_city}</Text>
              <Text style={styles.locationSub}>· Échange jusqu'à {listing.max_distance_km} km</Text>
            </View>
          )}

          {/* Owner profile */}
          {listing.profile && (
            <View style={styles.ownerCard}>
              <Avatar
                uri={(listing.profile as { avatar_url?: string }).avatar_url ?? null}
                name={(listing.profile as { display_name?: string; username: string }).display_name ?? (listing.profile as { username: string }).username}
                size={48}
              />
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>
                  {(listing.profile as { display_name?: string; username: string }).display_name ?? (listing.profile as { username: string }).username}
                </Text>
                <View style={styles.ownerMeta}>
                  <StarRating value={(listing.profile as { reputation_score: number }).reputation_score} readonly size={14} />
                  <Text style={styles.ownerExchanges}>
                    · {(listing.profile as { exchange_count: number }).exchange_count} échange{(listing.profile as { exchange_count: number }).exchange_count !== 1 ? 's' : ''}
                  </Text>
                </View>
                {(listing.profile as { phone_verified: boolean }).phone_verified && (
                  <Badge label="✓ Vérifié" color={COLORS.success} size="sm" />
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      {!isOwner && listing.status === 'active' && (
        <View style={styles.ctaBar}>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={proposeExchange}
            disabled={proposing}
            activeOpacity={0.85}
          >
            {proposing
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.ctaBtnText}>🤝 Proposer un échange</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {isOwner && (
        <View style={styles.ctaBar}>
          <TouchableOpacity
            style={[styles.ctaBtn, styles.ctaBtnSecondary]}
            onPress={() => router.push(`/listing/create?edit=${id}`)}
            activeOpacity={0.85}
          >
            <Text style={[styles.ctaBtnText, { color: COLORS.primary }]}>✏️ Modifier mon annonce</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.error, fontSize: 16 },
  imageContainer: { backgroundColor: COLORS.surface },
  mainImage: { width: '100%', height: 280 },
  noImage: { height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.borderLight },
  thumbnailRow: { paddingHorizontal: 12, paddingVertical: 8 },
  thumbnail: {
    width: 56, height: 56, borderRadius: 8, marginRight: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbnailActive: { borderColor: COLORS.primary },
  body: { padding: 16, gap: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  views: { fontSize: 13, color: COLORS.textSecondary },
  sideCard: {
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  proposeCard: { backgroundColor: '#F0EEFF', borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  searchCard: { backgroundColor: '#FFF0F3', borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  sideLabel: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  sideLabelSearch: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, marginBottom: 6 },
  sideTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  sideDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 10 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { backgroundColor: COLORS.primary + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  metaChipSearch: { backgroundColor: COLORS.secondary + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  metaChipText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  locationSub: { fontSize: 13, color: COLORS.textSecondary },
  ownerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  ownerInfo: { flex: 1, gap: 4 },
  ownerName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  ownerMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ownerExchanges: { fontSize: 12, color: COLORS.textSecondary },
  ctaBar: {
    padding: 16, paddingBottom: 24,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  ctaBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  ctaBtnSecondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.primary,
  },
  ctaBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
})
