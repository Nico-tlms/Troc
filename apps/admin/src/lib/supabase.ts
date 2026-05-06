import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env variable: SUPABASE_URL')
}
if (!supabaseServiceRoleKey) {
  throw new Error('Missing env variable: SUPABASE_SERVICE_ROLE_KEY')
}

// Server-side only client using service role key — bypasses RLS
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
