import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { listing_id } = await req.json()
    if (!listing_id) throw new Error('listing_id required')

    const [bilateral, chains] = await Promise.all([
      findBilateralMatches(supabase, listing_id),
      findChainMatches(supabase, listing_id),
    ])

    return new Response(JSON.stringify({ bilateral, chains }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// ─── Bilateral matching ───────────────────────────────────────────────────────
// A matches B when:
//  - B's propose category == A's search category (or either is null)
//  - B's propose value is within A's search value range
//  - B's search category == A's propose category (or either is null)
//  - B's propose condition meets A's minimum required condition
//  - Both are within each other's max_distance_km

async function findBilateralMatches(supabase: ReturnType<typeof createClient>, listingId: string) {
  const { data: source, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('status', 'active')
    .single()

  if (error || !source) return []

  // Build a scored match query via RPC (falls back to JS scoring)
  const { data: candidates } = await supabase
    .from('listings')
    .select(`
      *,
      profile:profiles(id, username, display_name, avatar_url, reputation_score, exchange_count),
      propose_category:categories!listings_propose_category_id_fkey(id, name, slug, icon),
      search_category:categories!listings_search_category_id_fkey(id, name, slug, icon)
    `)
    .eq('status', 'active')
    .neq('user_id', source.user_id)
    .neq('id', listingId)

  if (!candidates) return []

  const scored = candidates
    .map((c) => ({ listing: c, score: scoreBilateral(source, c) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)

  // Upsert matches
  if (scored.length > 0) {
    const rows = scored.map(({ listing, score }) => ({
      listing_a_id: listingId < listing.id ? listingId : listing.id,
      listing_b_id: listingId < listing.id ? listing.id : listingId,
      user_a_id: listingId < listing.id ? source.user_id : listing.user_id,
      user_b_id: listingId < listing.id ? listing.user_id : source.user_id,
      match_score: Math.round(score),
      match_type: 'bilateral',
      status: 'pending',
    }))

    await supabase.from('matches').upsert(rows, {
      onConflict: 'listing_a_id,listing_b_id',
      ignoreDuplicates: false,
    })
  }

  return scored.map(({ listing, score }) => ({ listing, score }))
}

function scoreBilateral(source: Record<string, unknown>, candidate: Record<string, unknown>): number {
  let score = 0

  // Category match: their propose vs my search
  if (
    source.search_category_id &&
    candidate.propose_category_id === source.search_category_id
  ) score += 40
  else if (!source.search_category_id || !candidate.propose_category_id) score += 15

  // Category match: their search vs my propose
  if (
    candidate.search_category_id &&
    candidate.search_category_id === source.propose_category_id
  ) score += 40
  else if (!candidate.search_category_id || !source.propose_category_id) score += 15

  // Value range compatibility: their propose value fits my search range
  const theirValue = (candidate.propose_estimated_value as number) ?? 0
  const myMin = (source.search_value_min as number) ?? 0
  const myMax = (source.search_value_max as number) ?? Infinity
  if (theirValue >= myMin && theirValue <= myMax) score += 15

  // Condition compatibility
  const conditionOrder = ['new', 'like_new', 'good', 'fair', 'poor']
  const theirConditionIdx = conditionOrder.indexOf(candidate.propose_condition as string)
  const myMinConditionIdx = conditionOrder.indexOf(source.search_condition_min as string)
  if (myMinConditionIdx === -1 || theirConditionIdx <= myMinConditionIdx) score += 5

  // Distance check
  if (source.location_lat && source.location_lng && candidate.location_lat && candidate.location_lng) {
    const dist = haversineKm(
      source.location_lat as number,
      source.location_lng as number,
      candidate.location_lat as number,
      candidate.location_lng as number,
    )
    const maxDist = Math.min(
      (source.max_distance_km as number) ?? 50,
      (candidate.max_distance_km as number) ?? 50,
    )
    if (dist > maxDist) return 0 // hard filter
    score += Math.round((1 - dist / maxDist) * 10)
  }

  return score
}

// ─── Chain matching (BFS depth ≤ 5) ──────────────────────────────────────────
// Find rings: A→B→C→A such that:
//   A.propose_category == B.search_category
//   B.propose_category == C.search_category
//   C.propose_category == A.search_category

async function findChainMatches(supabase: ReturnType<typeof createClient>, listingId: string) {
  const { data: allListings } = await supabase
    .from('listings')
    .select('id, user_id, propose_category_id, search_category_id, propose_estimated_value, search_value_min, search_value_max')
    .eq('status', 'active')

  if (!allListings || allListings.length === 0) return []

  // Build adjacency: listing A -> listings that need what A proposes
  type Node = typeof allListings[0]
  const byId = new Map<string, Node>(allListings.map((l) => [l.id, l]))
  const source = byId.get(listingId)
  if (!source) return []

  // BFS for cycles of length 3–5 starting from source
  const chains: string[][] = []

  function dfs(path: string[], visited: Set<string>) {
    if (path.length > 5) return
    const current = byId.get(path[path.length - 1])!

    for (const next of allListings) {
      if (visited.has(next.id)) {
        // Check if we can close the cycle back to source
        if (
          next.id === listingId &&
          path.length >= 3 &&
          categoriesMatch(current, next)
        ) {
          chains.push([...path])
        }
        continue
      }
      if (next.user_id === current.user_id) continue
      if (!categoriesMatch(current, next)) continue

      visited.add(next.id)
      path.push(next.id)
      dfs(path, visited)
      path.pop()
      visited.delete(next.id)
    }
  }

  dfs([listingId], new Set([listingId]))

  // Deduplicate (canonical rotation) and limit
  const seen = new Set<string>()
  const unique: string[][] = []
  for (const chain of chains) {
    const key = [...chain].sort().join(',')
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(chain)
    }
  }

  const top = unique.slice(0, 20)

  // Upsert chain_matches
  if (top.length > 0) {
    const rows = top.map((chain) => ({
      listing_ids: chain,
      user_ids: chain.map((id) => byId.get(id)!.user_id),
      chain_length: chain.length,
      status: 'pending',
    }))
    await supabase.from('chain_matches').upsert(rows, { ignoreDuplicates: true })
  }

  return top.map((chain) => ({
    listing_ids: chain,
    user_ids: chain.map((id) => byId.get(id)!.user_id),
    chain_length: chain.length,
  }))
}

function categoriesMatch(from: Record<string, unknown>, to: Record<string, unknown>): boolean {
  if (!from.propose_category_id || !to.search_category_id) return true
  return from.propose_category_id === to.search_category_id
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}
