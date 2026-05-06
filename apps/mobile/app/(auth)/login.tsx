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

export default function LoginScreen() {
  const router = useRouter()
  const { signIn, loading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email invalide'
    if (!password) newErrors.password = 'Mot de passe requis'
    else if (password.length < 6) newErrors.password = 'Minimum 6 caractères'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    try {
      await signIn(email.trim(), password)
      router.replace('/(tabs)')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue'
      Alert.alert('Connexion échouée', message)
    }
  }

  const handleGoogleSSO = () => {
    Alert.alert(
      'Bientôt disponible',
      'La connexion Google sera disponible dans une prochaine version.'
    )
  }

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
            <Text style={styles.tagline}>Échangez ce que vous n'utilisez plus</Text>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.title}>Connexion</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="votre@email.com"
                placeholderTextColor={COLORS.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Mot de passe</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    errors.password ? styles.inputError : null,
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSSO}
              activeOpacity={0.85}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continuer avec Google</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Pas encore de compte ? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Créer un compte</Text>
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
    justifyContent: 'center',
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 32,
  },
  logo: {
    fontSize: 56,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
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
    marginTop: 2,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: 'serif',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  registerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
})
