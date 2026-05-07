export const CATEGORIES = [
  { id: '1', name: 'High-Tech', icon: '💻', slug: 'tech' },
  { id: '2', name: 'Jeux vidéo', icon: '🎮', slug: 'gaming' },
  { id: '3', name: 'Mobilier', icon: '🪑', slug: 'furniture' },
  { id: '4', name: 'Mode', icon: '👗', slug: 'fashion' },
  { id: '5', name: 'Sport', icon: '⚽', slug: 'sports' },
  { id: '6', name: 'Livres', icon: '📚', slug: 'books' },
  { id: '7', name: 'Musique', icon: '🎸', slug: 'music' },
  { id: '8', name: 'Jardin', icon: '🌿', slug: 'garden' },
  { id: '9', name: 'Art', icon: '🎨', slug: 'art' },
  { id: '10', name: 'Véhicules', icon: '🚗', slug: 'vehicles' },
  { id: '11', name: 'Autre', icon: '📦', slug: 'other' },
]

export const CONDITION_LABELS: Record<string, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'État correct',
  poor: 'À rénover',
}

export const CONDITION_OPTIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Active',
  matched: 'Matchée',
  completed: 'Terminée',
  archived: 'Archivée',
  removed: 'Supprimée',
}
