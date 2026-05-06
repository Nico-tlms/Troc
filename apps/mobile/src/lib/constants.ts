export const COLORS = {
  primary: '#6C63FF',
  primaryLight: '#8B84FF',
  primaryDark: '#4D45CC',
  secondary: '#FF6584',
  secondaryLight: '#FF8EA3',
  secondaryDark: '#CC4466',
  background: '#F8F8FF',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F0FF',
  text: '#1A1A2E',
  textSecondary: '#6B6B8A',
  textTertiary: '#9999B3',
  border: '#E0E0F0',
  borderLight: '#F0F0FF',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  // Condition colors
  conditionNew: '#4CAF50',
  conditionLikeNew: '#8BC34A',
  conditionGood: '#FF9800',
  conditionFair: '#FF5722',
  conditionPoor: '#9E9E9E',
} as const

export interface CategoryDef {
  id: string
  name: string
  icon: string
  slug: string
}

export const CATEGORIES: CategoryDef[] = [
  { id: '1', name: 'Technologie', icon: '💻', slug: 'tech' },
  { id: '2', name: 'Gaming', icon: '🎮', slug: 'gaming' },
  { id: '3', name: 'Mobilier', icon: '🪑', slug: 'furniture' },
  { id: '4', name: 'Mode', icon: '👗', slug: 'fashion' },
  { id: '5', name: 'Sport', icon: '⚽', slug: 'sports' },
  { id: '6', name: 'Livres', icon: '📚', slug: 'books' },
  { id: '7', name: 'Musique', icon: '🎸', slug: 'music' },
  { id: '8', name: 'Jardin', icon: '🌿', slug: 'garden' },
  { id: '9', name: 'Art', icon: '🎨', slug: 'art' },
  { id: '10', name: 'Véhicules', icon: '🚗', slug: 'vehicles' },
  { id: '11', name: 'Électroménager', icon: '🏠', slug: 'appliances' },
  { id: '12', name: 'Jouets', icon: '🧸', slug: 'toys' },
  { id: '13', name: 'Bijoux', icon: '💍', slug: 'jewelry' },
  { id: '14', name: 'Bricolage', icon: '🔧', slug: 'diy' },
  { id: '15', name: 'Autre', icon: '📦', slug: 'other' },
]

export const getCategoryById = (id: string): CategoryDef | undefined => {
  return CATEGORIES.find((c) => c.id === id)
}

export const getCategoryBySlug = (slug: string): CategoryDef | undefined => {
  return CATEGORIES.find((c) => c.slug === slug)
}

export const CONDITION_COLORS: Record<string, string> = {
  new: COLORS.conditionNew,
  like_new: COLORS.conditionLikeNew,
  good: COLORS.conditionGood,
  fair: COLORS.conditionFair,
  poor: COLORS.conditionPoor,
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Active',
  matched: 'Matchée',
  completed: 'Terminée',
  archived: 'Archivée',
  removed: 'Supprimée',
}

export const STATUS_COLORS: Record<string, string> = {
  draft: COLORS.textTertiary,
  active: COLORS.success,
  matched: COLORS.primary,
  completed: COLORS.info,
  archived: COLORS.textSecondary,
  removed: COLORS.error,
}

export const MATCH_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  rejected: 'Refusé',
  completed: 'Complété',
  expired: 'Expiré',
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  new_match: '🎯',
  new_chain_match: '🔄',
  message: '💬',
  exchange_request: '🤝',
  exchange_confirmed: '✅',
  exchange_completed: '🎉',
  review_received: '⭐',
  report_resolved: '🛡️',
}

export const MAX_LISTING_IMAGES = 5
export const DEFAULT_MAX_DISTANCE_KM = 50
