import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useListingsStore } from '@/stores/listings'
import { useAuthStore } from '@/stores/auth'
import { COLORS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import type { Listing } from '@troc/types'

const STATUS_FILTERS = ['Tout', 'active', 'draft', 'matched', 'completed', 'archived'] as const

export default function ListingsScreen() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const { myListings, loading, loadMyListings, deleteListing, updateListing } = useListingsStore()
  const [filter, setFilter] = useState<string>('Tout')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (profile?.id) loadMyListings(profile.id)
  }, [profile?.id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    if (profile?.id) await loadMyListings(profile.id)
    setRefreshing(false)
  }, [profile?.id])

  const filtered = filter === 'Tout' ? myListings : myListings.filter((l) => l.status === filter)

  const handleArchive = (item: Listing) => {
    Alert.alert('Archiver', `Archiver "${item.propose_title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver',
        onPress: async () => {
          await updateListing(item.id, { status: 'archived' })
        },
      },
    ])
  }

  const handleDelete = (item: Listing) => {
    Alert.alert('Supprimer', `Supprimer définitivement "${item.propose_title}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await deleteListing(item.id)
        },
      },
    ])
  }

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/listing/${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
            {STATUS_LABELS[item.status]}
          </Text>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </Text>
      </View>

      <View style={styles.exchangeRow}>
        <View style={styles.side}>
          <Text style={styles.sideLabel}>🟦 Je propose</Text>
          <Text style={styles.sideTitle} numberOfLines={2}>{item.propose_title}</Text>
          {item.propose_estimated_value != null && (
            <Text style={styles.sideValue}>
              ~{(item.propose_estimated_value / 100).toFixed(0)} €
            </Text>
          )}
        </View>
        <Text style={styles.arrow}>⇄</Text>
        <View style={styles.side}>
          <Text style={styles.sideLabelSearch}>🟥 Je cherche</Text>
          <Text style={styles.sideTitle} numberOfLines={2}>{item.search_title}</Text>
          {(item.search_value_min != null || item.search_value_max != null) && (
            <Text style={styles.sideValue}>
              {item.search_value_min ? `${(item.search_value_min / 100).toFixed(0)} €` : '0 €'}
              {' — '}
              {item.search_value_max ? `${(item.search_value_max / 100).toFixed(0)} €` : '∞'}
            </Text>
          )}
        </View>
      </View>

      {item.location_city && (
        <Text style={styles.city}>📍 {item.location_city}</Text>
      )}

      <View style={styles.actions}>
        {item.status === 'active' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleArchive(item)}>
            <Text style={styles.actionBtnText}>Archiver</Text>
          </TouchableOpacity>
        )}
        {item.status === 'archived' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => updateListing(item.id, { status: 'active' })}
          >
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Réactiver</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={() => handleDelete(item)}>
          <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mes annonces</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/listing/create')}>
          <Text style={styles.addBtnText}>+ Nouvelle</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={STATUS_FILTERS as unknown as string[]}
        keyExtractor={(s) => s}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item: s }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === s && styles.filterChipActive]}
            onPress={() => setFilter(s)}
          >
            <Text style={[styles.filterChipText, filter === s && styles.filterChipTextActive]}>
              {s === 'Tout' ? 'Tout' : STATUS_LABELS[s] ?? s}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading && myListings.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>Aucune annonce</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/listing/create')}>
                <Text style={styles.emptyBtnText}>Créer une annonce</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  filterList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: '#FFF' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  cardDate: { fontSize: 12, color: COLORS.textTertiary },
  exchangeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  side: { flex: 1 },
  sideLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  sideLabelSearch: { fontSize: 11, fontWeight: '700', color: COLORS.secondary, marginBottom: 4 },
  sideTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 20 },
  sideValue: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  arrow: { fontSize: 18, color: COLORS.textTertiary, marginTop: 16 },
  city: { fontSize: 12, color: COLORS.textTertiary, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  actionBtn: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: COLORS.border,
  },
  actionBtnPrimary: { borderColor: COLORS.primary },
  actionBtnDanger: { borderColor: COLORS.error + '44' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#FFF', fontWeight: '700' },
})
