import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/stores/auth'
import { useMatchesStore } from '@/stores/matches'
import { useListingsStore } from '@/stores/listings'
import { MatchCard } from '@/components/MatchCard'
import { COLORS } from '@/lib/constants'
import type { Match, ChainMatch } from '@/types'

export default function HomeScreen() {
  const router = useRouter()
  const { profile, user } = useAuthStore()
  const { matches, chainMatches, loading, loadMatches, triggerMatching } = useMatchesStore()
  const { myListings, loadMyListings } = useListingsStore()
  const [refreshing, setRefreshing] = useState(false)

  const activeListings = myListings.filter((l) => l.status === 'active')
  const pendingMatches = matches.filter((m) => m.status === 'pending')
  const pendingChains = chainMatches.filter((c) => c.status === 'pending')

  const load = useCallback(async () => {
    if (!profile?.id) return
    await Promise.all([loadMatches(profile.id), loadMyListings(profile.id)])
  }, [profile?.id])

  useEffect(() => { load() }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    if (profile?.id) await triggerMatching(profile.id)
    await load()
    setRefreshing(false)
  }, [profile?.id, load])

  const renderMatch = ({ item }: { item: Match }) => (
    <MatchCard
      match={item}
      currentUserId={profile?.id ?? ''}
      onPress={() => router.push(`/match/${item.id}`)}
    />
  )

  const renderChain = ({ item }: { item: ChainMatch }) => (
    <TouchableOpacity
      style={styles.chainCard}
      onPress={() => router.push(`/match/chain-${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.chainBadge}>
        <Text style={styles.chainBadgeText}>🔄 Échange en chaîne</Text>
      </View>
      <Text style={styles.chainTitle}>{item.chain_length} participants</Text>
      <Text style={styles.chainSub}>
        Tous les membres doivent accepter pour valider l'échange
      </Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Bonjour{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''} 👋
            </Text>
            <Text style={styles.subGreeting}>Trouvez votre prochain échange</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/notifications')}
          >
            <Text style={{ fontSize: 22 }}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Stats bar */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeListings.length}</Text>
            <Text style={styles.statLabel}>Annonces actives</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>{pendingMatches.length}</Text>
            <Text style={styles.statLabel}>Matchs bilatéraux</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingChains.length}</Text>
            <Text style={styles.statLabel}>Échanges chaîne</Text>
          </View>
        </View>

        {/* Propose / Cherche CTA */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes annonces</Text>
          <TouchableOpacity onPress={() => router.push('/listing/create')}>
            <Text style={styles.seeAll}>+ Nouvelle</Text>
          </TouchableOpacity>
        </View>

        {activeListings.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyListingsCta}
            onPress={() => router.push('/listing/create')}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyCtaEmoji}>✨</Text>
            <Text style={styles.emptyCtaTitle}>Créez votre première annonce</Text>
            <Text style={styles.emptyCtaSub}>
              Déclarez ce que vous proposez et ce que vous cherchez — le moteur de matching fait le reste.
            </Text>
            <View style={styles.emptyCtaBtn}>
              <Text style={styles.emptyCtaBtnText}>Commencer l'échange</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.listingsScroll}>
            {activeListings.map((listing) => (
              <TouchableOpacity
                key={listing.id}
                style={styles.miniListingCard}
                onPress={() => router.push(`/listing/${listing.id}`)}
                activeOpacity={0.85}
              >
                <View style={styles.miniListingTop}>
                  <View style={styles.miniPropose}>
                    <Text style={styles.miniLabel}>Je propose</Text>
                    <Text style={styles.miniTitle} numberOfLines={2}>{listing.propose_title}</Text>
                  </View>
                  <Text style={styles.miniArrow}>⇄</Text>
                  <View style={styles.miniSearch}>
                    <Text style={styles.miniLabelSearch}>Je cherche</Text>
                    <Text style={styles.miniTitle} numberOfLines={2}>{listing.search_title}</Text>
                  </View>
                </View>
                {listing.location_city && (
                  <Text style={styles.miniCity}>📍 {listing.location_city}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Bilateral matches */}
        {(pendingMatches.length > 0 || loading) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Matchs bilatéraux</Text>
              <Text style={styles.matchCount}>{pendingMatches.length}</Text>
            </View>
            {loading && pendingMatches.length === 0 ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : (
              <FlatList
                data={pendingMatches.slice(0, 10)}
                keyExtractor={(m) => m.id}
                renderItem={renderMatch}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
            )}
          </>
        )}

        {/* Chain matches */}
        {pendingChains.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 8 }]}>
              <Text style={styles.sectionTitle}>🔄 Échanges en chaîne</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NOUVEAU</Text>
              </View>
            </View>
            <Text style={styles.chainExplainer}>
              Notre algorithme a trouvé des boucles d'échange à {pendingChains[0]?.chain_length ?? 3} participants où chacun donne et reçoit.
            </Text>
            <FlatList
              data={pendingChains.slice(0, 5)}
              keyExtractor={(c) => c.id}
              renderItem={renderChain}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          </>
        )}

        {!loading && pendingMatches.length === 0 && pendingChains.length === 0 && activeListings.length > 0 && (
          <View style={styles.noMatchesCta}>
            <Text style={styles.noMatchesEmoji}>🎯</Text>
            <Text style={styles.noMatchesTitle}>Aucun match pour l'instant</Text>
            <Text style={styles.noMatchesSub}>
              Tirez vers le bas pour relancer le moteur de matching, ou ajoutez plus d'annonces.
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/listing/create')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  subGreeting: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  notifBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statCardMiddle: { backgroundColor: COLORS.primary },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  matchCount: {
    backgroundColor: COLORS.primary, color: '#FFF', fontSize: 12, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden',
  },
  newBadge: { backgroundColor: COLORS.secondary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  listingsScroll: { marginBottom: 20 },
  miniListingCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 14,
    marginRight: 12, width: 260,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  miniListingTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniPropose: { flex: 1 },
  miniSearch: { flex: 1 },
  miniLabel: { fontSize: 10, fontWeight: '700', color: COLORS.primary, marginBottom: 3 },
  miniLabelSearch: { fontSize: 10, fontWeight: '700', color: COLORS.secondary, marginBottom: 3 },
  miniTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  miniArrow: { fontSize: 18, color: COLORS.textTertiary },
  miniCity: { fontSize: 11, color: COLORS.textTertiary, marginTop: 8 },
  emptyListingsCta: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 10, marginBottom: 20,
    borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed',
  },
  emptyCtaEmoji: { fontSize: 40 },
  emptyCtaTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptyCtaSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyCtaBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  emptyCtaBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  chainCard: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.secondary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  chainBadge: {
    alignSelf: 'flex-start', backgroundColor: '#FFE8EC', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  chainBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.secondary },
  chainTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  chainSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  chainExplainer: {
    fontSize: 13, color: COLORS.textSecondary, marginBottom: 12,
    backgroundColor: '#F0EEFF', borderRadius: 10, padding: 12, lineHeight: 20,
  },
  noMatchesCta: { alignItems: 'center', padding: 32, gap: 8 },
  noMatchesEmoji: { fontSize: 48 },
  noMatchesTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  noMatchesSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', bottom: 88, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#FFF', fontSize: 28, fontWeight: '300', lineHeight: 32 },
})
