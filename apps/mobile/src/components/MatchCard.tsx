import React from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { COLORS } from '@/lib/constants'
import type { Match, ChainMatch } from '@troc/types'
import { Badge } from './Badge'

interface MatchCardProps {
  match?: Match
  chainMatch?: ChainMatch
  currentUserId: string
  onPress?: () => void
  style?: ViewStyle
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  chainMatch,
  currentUserId,
  onPress,
  style,
}) => {
  if (chainMatch) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.chainHeader}>
          <Text style={styles.chainIcon}>🔄</Text>
          <View style={styles.chainInfo}>
            <Text style={styles.chainTitle}>Échange en chaîne</Text>
            <Text style={styles.chainSubtitle}>
              {chainMatch.chain_length} participants · {chainMatch.listings?.length ?? chainMatch.listing_ids.length} annonces
            </Text>
          </View>
          <Badge
            label={`+${chainMatch.chain_length}`}
            color={COLORS.secondary}
            size="sm"
          />
        </View>

        {chainMatch.listings && chainMatch.listings.length > 0 && (
          <View style={styles.chainListings}>
            {chainMatch.listings.slice(0, 3).map((listing, index) => (
              <View key={listing.id} style={styles.chainListingItem}>
                {index > 0 && <Text style={styles.chainArrow}>→</Text>}
                {listing.propose_images?.[0] ? (
                  <Image
                    source={{ uri: listing.propose_images[0] }}
                    style={styles.chainImage}
                  />
                ) : (
                  <View style={styles.chainImagePlaceholder}>
                    <Text style={{ fontSize: 18 }}>📦</Text>
                  </View>
                )}
              </View>
            ))}
            {chainMatch.listing_ids.length > 3 && (
              <View style={styles.chainMore}>
                <Text style={styles.chainMoreText}>+{chainMatch.listing_ids.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Badge label="Échange en chaîne" color={COLORS.secondary} size="sm" />
          <Text style={styles.statusText}>
            {chainMatch.accepted_by?.length ?? 0}/{chainMatch.chain_length} acceptés
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (!match) return null

  const isUserA = match.user_a_id === currentUserId
  const myListing = isUserA ? match.listing_a : match.listing_b
  const theirListing = isUserA ? match.listing_b : match.listing_a
  const theirProfile = isUserA ? match.user_b : match.user_a

  const scorePercent = Math.round((match.match_score ?? 0) * 100)
  const scoreColor =
    scorePercent >= 80
      ? COLORS.success
      : scorePercent >= 60
      ? COLORS.warning
      : COLORS.textSecondary

  const statusMap: Record<string, string> = {
    pending: 'En attente',
    accepted: 'Accepté',
    rejected: 'Refusé',
    completed: 'Complété',
    expired: 'Expiré',
  }

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.matchRow}>
        {/* My listing */}
        <View style={styles.listingBlock}>
          {myListing?.propose_images?.[0] ? (
            <Image
              source={{ uri: myListing.propose_images[0] }}
              style={styles.listingImage}
            />
          ) : (
            <View style={styles.listingImagePlaceholder}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
          )}
          <Text style={styles.listingTitle} numberOfLines={2}>
            {myListing?.propose_title ?? '—'}
          </Text>
          <Text style={styles.listingOwner}>Moi</Text>
        </View>

        {/* Center: score + arrows */}
        <View style={styles.center}>
          <View style={[styles.scoreBubble, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>{scorePercent}%</Text>
          </View>
          <Text style={styles.arrows}>⇄</Text>
        </View>

        {/* Their listing */}
        <View style={styles.listingBlock}>
          {theirListing?.propose_images?.[0] ? (
            <Image
              source={{ uri: theirListing.propose_images[0] }}
              style={styles.listingImage}
            />
          ) : (
            <View style={styles.listingImagePlaceholder}>
              <Text style={{ fontSize: 24 }}>📦</Text>
            </View>
          )}
          <Text style={styles.listingTitle} numberOfLines={2}>
            {theirListing?.propose_title ?? '—'}
          </Text>
          <Text style={styles.listingOwner}>
            {theirProfile?.display_name ?? theirProfile?.username ?? '—'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Badge
          label={statusMap[match.status] ?? match.status}
          color={
            match.status === 'accepted'
              ? COLORS.success
              : match.status === 'pending'
              ? COLORS.primary
              : match.status === 'rejected'
              ? COLORS.error
              : COLORS.textTertiary
          }
          size="sm"
        />
        {theirProfile?.city ? (
          <Text style={styles.city}>📍 {theirProfile.city}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listingBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  listingImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceElevated,
  },
  listingImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  listingOwner: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  center: {
    alignItems: 'center',
    gap: 4,
  },
  scoreBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  arrows: {
    fontSize: 18,
    color: COLORS.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  city: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  // Chain styles
  chainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chainIcon: {
    fontSize: 28,
  },
  chainInfo: {
    flex: 1,
    gap: 2,
  },
  chainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  chainSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chainListings: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chainListingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chainArrow: {
    fontSize: 16,
    color: COLORS.textTertiary,
  },
  chainImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
  },
  chainImagePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainMore: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
})
