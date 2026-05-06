import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/auth'
import { COLORS } from '@/lib/constants'

export default function RegisterScreen() {
  const router = useRouter()
  const { signUp, loading } = useAuthStore()

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    displayName: '',
    city: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<typeof form> & { confirmPassword?: string }>({})

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!form.email.trim()) newErrors.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Email invalide'
    if (!form.password) newErrors.password = 'Mot de passe requis'
    else if (form.password.length < 8) newErrors.password = 'Minimum 8 caractères'
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    if (!form.username.trim()) newErrors.username = 'Nom d\'utilisateur requis'
    else if (form.username.length < 3) newErrors.username = 'Minimum 3 caractères'
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username))
      newErrors.username = 'Lettres, chiffres et _ uniquement'
    if (!form.displayName.trim()) newErrors.displayName = 'Nom d\'affichage requis'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validate()) return
    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim().toLowerCase(),
        displayName: form.displayName.trim(),
        city: form.city.trim() || undefined,
      })
      router.replace('/(tabs)')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      Alert.alert('Inscription échouée', message)
    }
  }

  const fields: Array<{
    key: keyof typeof form
    label: string
    placeholder: string
    secure?: boolean
    keyboard?: 'default' | 'email-address'
    autoCapitalize?: 'none' | 'words'
  }> = [
    { key: 'email', label: 'Email', placeholder: 'votre@email.com', keyboard: 'email-address', autoCapitalize: 'none' },
    { key: 'username', label: "Nom d'utilisateur", placeholder: 'monpseudo', autoCapitalize: 'none' },
    { key: 'displayName', label: "Nom d'affichage", placeholder: 'Marie Dupont', autoCapitalize: 'words' },
    { key: 'city', label: 'Ville (optionnel)', placeholder: 'Paris', autoCapitalize: 'words' },
  ]

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🔄</Text>
            <Text style={styles.appName}>Troc</Text>
            <Text style={styles.tagline}>Créez votre compte gratuitement</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Inscription</Text>

            {fields.map(({ key, label, placeholder, keyboard, autoCapitalize }) => (
              <View key={key} style={styles.field}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={[styles.input, errors[key] ? styles.inputError : null]}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.textTertiary}
                  value={form[key]}
                  onChangeText={(v) => update(key, v)}
                  keyboardType={keyboard ?? 'default'}
                  autoCapitalize={autoCapitalize ?? 'none'}
                  autoCorrect={false}
                />
                {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
              </View>
            ))}

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    errors.password ? styles.inputError : null,
                  ]}
                  placeholder="Minimum 8 caractères"
                  placeholderTextColor={COLORS.textTertiary}
                  value={form.password}
                  onChangeText={(v) => update('password', v)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((p) => !p)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Confirm password */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Confirmer le mot de passe</Text>
              <TextInput
                style={[
                  styles.input,
                  errors.confirmPassword ? styles.inputError : null,
                ]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textTertiary}
                value={form.confirmPassword}
                onChangeText={(v) => update('confirmPassword', v)}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Déjà un compte ? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
})
