import React from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native'
import { COLORS, getCategoryById, STATUS_COLORS, STATUS_LABELS, CONDITION_COLORS } from '@/lib/constants'
import { CONDITION_LABELS } from '@troc/types'
import type { Listing } from '@troc/types'
import { Badge } from './Badge'

interface ListingCardProps {
  listing: Listing
  matchScore?: number
  onPress?: () => void
  style?: ViewStyle
  compact?: boolean
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  matchScore,
  onPress,
  style,
  compact = false,
}) => {
  const proposeCat = listing.propose_category ?? getCategoryById(listing.propose_category_id ?? '')
  const searchCat = listing.search_category ?? getCategoryById(listing.search_category_id ?? '')

  const mainImage = listing.propose_images?.[0]
  const conditionLabel = listing.propose_condition
    ? CONDITION_LABELS[listing.propose_condition]
    : null
  const conditionColor = listing.propose_condition
    ? CONDITION_COLORS[listing.propose_condition]
    : COLORS.textTertiary

  const statusColor = STATUS_COLORS[listing.status] ?? COLORS.textTertiary
  const statusLabel = STATUS_LABELS[listing.status] ?? listing.status

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Image + Status */}
      <View style={styles.imageSection}>
        {mainImage ? (
          <Image source={{ uri: mainImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>
              {proposeCat?.icon ?? '📦'}
            </Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        {matchScore !== undefined && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{Math.round(matchScore * 100)}%</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        {/* Je propose */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Je propose</Text>
            {conditionLabel ? (
              <Badge
                label={conditionLabel}
                color={conditionColor}
                size="sm"
              />
            ) : null}
          </View>
          <Text style={styles.proposeTitle} numberOfLines={2}>
            {listing.propose_title}
          </Text>
          <View style={styles.meta}>
            {proposeCat ? (
              <Text style={styles.metaText}>{proposeCat.icon} {proposeCat.name}</Text>
            ) : null}
            {listing.propose_estimated_value ? (
              <Text style={styles.valueText}>
                ~{Math.round(listing.propose_estimated_value / 100)} €
              </Text>
            ) : null}
          </View>
        </View>

        {!compact && (
          <>
            <View style={styles.divider} />

            {/* Je cherche */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Je cherche</Text>
              <Text style={styles.searchTitle} numberOfLines={1}>
                {listing.search_title}
              </Text>
              <View style={styles.meta}>
                {searchCat ? (
                  <Text style={styles.metaText}>{searchCat.icon} {searchCat.name}</Text>
                ) : null}
                {listing.search_value_min || listing.search_value_max ? (
                  <Text style={styles.metaText}>
                    {listing.search_value_min
                      ? `${Math.round(listing.search_value_min / 100)} €`
                      : '0 €'}
                    {' – '}
                    {listing.search_value_max
                      ? `${Math.round(listing.search_value_max / 100)} €`
                      : '∞'}
                  </Text>
                ) : null}
              </View>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Badge label={statusLabel} color={statusColor} size="sm" />
          {listing.location_city ? (
            <Text style={styles.city}>📍 {listing.location_city}</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageSection: {
    position: 'relative',
    height: 140,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.surfaceElevated,
  },
  imagePlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
  },
  statusDot: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  content: {
    padding: 14,
    gap: 8,
  },
  contentCompact: {
    padding: 10,
    gap: 4,
  },
  section: {
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  proposeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 20,
  },
  searchTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  valueText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  city: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
})
