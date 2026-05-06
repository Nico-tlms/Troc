import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/auth'
import { Avatar } from '@/components/Avatar'
import { StarRating } from '@/components/StarRating'
import { Badge } from '@/components/Badge'
import { COLORS } from '@/lib/constants'

export default function ProfileScreen() {
  const { profile, signOut, updateProfile, loading } = useAuthStore()
  const [editModal, setEditModal] = useState(false)
  const [form, setForm] = useState({
    display_name: profile?.display_name ?? '',
    city: profile?.city ?? '',
    bio: profile?.bio ?? '',
  })

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ])
  }

  const handleSave = async () => {
    try {
      await updateProfile(form)
      setEditModal(false)
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil.')
    }
  }

  if (!profile) return null

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar uri={profile.avatar_url} name={profile.display_name ?? profile.username} size={80} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{profile.display_name ?? profile.username}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            {profile.city && <Text style={styles.city}>📍 {profile.city}</Text>}
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditModal(true)}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile.exchange_count}</Text>
            <Text style={styles.statLbl}>Échanges</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxCenter]}>
            <StarRating rating={profile.reputation_score} size={18} />
            <Text style={styles.statLbl}>{profile.reputation_score.toFixed(1)} / 5</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>0</Text>
            <Text style={styles.statLbl}>Annonces actives</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesRow}>
            {profile.phone_verified && (
              <Badge label="📱 Téléphone vérifié" color={COLORS.success} />
            )}
            {profile.id_verified && (
              <Badge label="🪪 Identité vérifiée" color={COLORS.primary} />
            )}
            {profile.exchange_count >= 10 && (
              <Badge label="🏆 Top échangeur" color={COLORS.warning} />
            )}
            {!profile.phone_verified && !profile.id_verified && (
              <Text style={styles.noBadges}>Aucun badge pour l'instant. Vérifiez votre profil !</Text>
            )}
          </View>
        </View>

        {/* Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>À propos</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        {/* Verification CTA */}
        {!profile.phone_verified && (
          <TouchableOpacity style={styles.verifCta} activeOpacity={0.85}>
            <Text style={styles.verifCtaIcon}>📱</Text>
            <View style={styles.verifCtaContent}>
              <Text style={styles.verifCtaTitle}>Vérifiez votre numéro</Text>
              <Text style={styles.verifCtaSub}>Gagnez la confiance des autres utilisateurs</Text>
            </View>
            <Text style={styles.verifCtaArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutBtnText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Troc v0.1.0 — MVP</Text>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="formSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.modalSave}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {[
              { label: 'Nom affiché', key: 'display_name' as const, placeholder: 'Votre prénom / nom' },
              { label: 'Ville', key: 'city' as const, placeholder: 'Ex : Paris' },
            ].map(({ label, key, placeholder }) => (
              <View key={key} style={styles.formField}>
                <Text style={styles.formLabel}>{label}</Text>
                <TextInput
                  style={styles.formInput}
                  value={form[key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            ))}

            <View style={styles.formField}>
              <Text style={styles.formLabel}>Bio</Text>
              <TextInput
                style={[styles.formInput, styles.formInputMulti]}
                value={form.bio}
                onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))}
                placeholder="Parlez un peu de vous…"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  headerInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  username: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  city: { fontSize: 13, color: COLORS.textTertiary, marginTop: 4 },
  editBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 20 },
  statsRow: {
    flexDirection: 'row', gap: 10,
  },
  statBox: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 14, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statBoxCenter: { borderWidth: 1.5, borderColor: COLORS.primary },
  statVal: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLbl: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
  section: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noBadges: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },
  bio: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  verifCta: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F0EEFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  verifCtaIcon: { fontSize: 28 },
  verifCtaContent: { flex: 1 },
  verifCtaTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  verifCtaSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  verifCtaArrow: { fontSize: 20, color: COLORS.primary, fontWeight: '300' },
  logoutBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.error + '44',
    backgroundColor: COLORS.error + '0D',
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.error },
  version: { fontSize: 12, color: COLORS.textTertiary, textAlign: 'center' },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  modalCancel: { fontSize: 15, color: COLORS.textSecondary },
  modalSave: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  modalContent: { padding: 20, gap: 16 },
  formField: { gap: 6 },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  formInput: {
    backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.text,
  },
  formInputMulti: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
})
