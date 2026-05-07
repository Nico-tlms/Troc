// ─── Enums ────────────────────────────────────────────────────────────────────

export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor'
export type ListingStatus = 'draft' | 'active' | 'matched' | 'completed' | 'archived' | 'removed'
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired'
export type MatchType = 'bilateral' | 'chain'
export type ExchangeStatus =
  | 'pending_scan'
  | 'scanning'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'disputed'
export type MessageType = 'text' | 'image' | 'system' | 'exchange_proposal'
export type ReportTargetType = 'listing' | 'profile' | 'message' | 'exchange'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
export type NotificationType =
  | 'new_match'
  | 'new_chain_match'
  | 'message'
  | 'exchange_request'
  | 'exchange_confirmed'
  | 'exchange_completed'
  | 'review_received'
  | 'report_resolved'

// ─── Domain models ─────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  bio: string | null
  phone: string | null
  phone_verified: boolean
  id_verified: boolean
  reputation_score: number
  exchange_count: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  parent_id: string | null
  children?: Category[]
}

export interface Listing {
  id: string
  user_id: string
  // What I offer
  propose_title: string
  propose_description: string | null
  propose_category_id: string | null
  propose_condition: ItemCondition | null
  propose_estimated_value: number | null // cents
  propose_images: string[]
  // What I want
  search_title: string
  search_description: string | null
  search_category_id: string | null
  search_condition_min: ItemCondition | null
  search_value_min: number | null // cents
  search_value_max: number | null // cents
  search_keywords: string[]
  // Logistics
  location_lat: number | null
  location_lng: number | null
  location_city: string | null
  max_distance_km: number
  // Status
  status: ListingStatus
  view_count: number
  created_at: string
  updated_at: string
  // Joins
  profile?: Profile
  propose_category?: Category
  search_category?: Category
}

export interface Match {
  id: string
  listing_a_id: string
  listing_b_id: string
  user_a_id: string
  user_b_id: string
  match_score: number
  match_type: MatchType
  status: MatchStatus
  created_at: string
  updated_at: string
  // Joins
  listing_a?: Listing
  listing_b?: Listing
  user_a?: Profile
  user_b?: Profile
}

export interface ChainMatch {
  id: string
  listing_ids: string[]
  user_ids: string[]
  chain_length: number
  status: MatchStatus
  accepted_by: string[]
  created_at: string
  updated_at: string
  // Joins
  listings?: Listing[]
  users?: Profile[]
}

export interface Conversation {
  id: string
  match_id: string | null
  chain_match_id: string | null
  participant_ids: string[]
  last_message_at: string | null
  created_at: string
  // Joins
  match?: Match
  last_message?: Message
  other_participant?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  image_url: string | null
  type: MessageType
  created_at: string
  sender?: Profile
}

export interface Exchange {
  id: string
  match_id: string | null
  chain_match_id: string | null
  initiator_id: string
  participants: string[]
  qr_code: string
  qr_expires_at: string | null
  compensation_amount: number
  compensation_payer_id: string | null
  status: ExchangeStatus
  confirmed_by: string[]
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joins
  match?: Match
  initiator?: Profile
}

export interface Review {
  id: string
  exchange_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer?: Profile
  reviewee?: Profile
}

export interface Report {
  id: string
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: string
  description: string | null
  status: ReportStatus
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  reporter?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

// ─── API payloads ──────────────────────────────────────────────────────────────

export interface CreateListingPayload {
  propose_title: string
  propose_description?: string
  propose_category_id?: string
  propose_condition?: ItemCondition
  propose_estimated_value?: number
  propose_images?: string[]
  search_title: string
  search_description?: string
  search_category_id?: string
  search_condition_min?: ItemCondition
  search_value_min?: number
  search_value_max?: number
  search_keywords?: string[]
  location_city?: string
  location_lat?: number
  location_lng?: number
  max_distance_km?: number
}

export interface MatchingResult {
  bilateral: Match[]
  chains: ChainMatch[]
}

// ─── Admin stats ───────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number
  active_listings: number
  exchanges_today: number
  pending_reports: number
  top_categories: Array<{ name: string; count: number }>
  match_rate: number
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  new: 'Neuf',
  like_new: 'Comme neuf',
  good: 'Bon état',
  fair: 'État correct',
  poor: 'À rénover',
}

export const CONDITION_ORDER: ItemCondition[] = ['new', 'like_new', 'good', 'fair', 'poor']

export const CATEGORY_ICONS: Record<string, string> = {
  tech: '💻',
  gaming: '🎮',
  furniture: '🪑',
  fashion: '👗',
  sports: '⚽',
  books: '📚',
  music: '🎸',
  garden: '🌿',
  art: '🎨',
  vehicles: '🚗',
  other: '📦',
}
