'use server'

import { revalidatePath } from 'next/cache'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { COOKIE_NAME } from '@/lib/auth'
import { redirect } from 'next/navigation'

function requireAuth() {
  const cookieStore = cookies()
  const session = cookieStore.get(COOKIE_NAME)
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret || !session || session.value !== adminSecret) {
    redirect('/login')
  }
}

export async function suspendUser(id: string): Promise<{ error?: string }> {
  requireAuth()
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: true })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${id}`)
  return {}
}

export async function unsuspendUser(id: string): Promise<{ error?: string }> {
  requireAuth()
  const { error } = await supabase
    .from('profiles')
    .update({ is_suspended: false })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/users')
  revalidatePath(`/users/${id}`)
  return {}
}

export async function deleteUser(id: string): Promise<{ error?: string }> {
  requireAuth()

  // Remove listings first (soft delete via status)
  await supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('user_id', id)

  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return { error: error.message }

  revalidatePath('/users')
  return {}
}

export async function removeListing(id: string): Promise<{ error?: string }> {
  requireAuth()
  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/listings')
  return {}
}

export async function restoreListing(id: string): Promise<{ error?: string }> {
  requireAuth()
  const { error } = await supabase
    .from('listings')
    .update({ status: 'active' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/listings')
  return {}
}

export async function resolveReport(
  id: string,
  action: 'resolved' | 'dismissed' | 'reviewing'
): Promise<{ error?: string }> {
  requireAuth()
  const { error } = await supabase
    .from('reports')
    .update({
      status: action,
      resolved_by: 'admin',
      resolved_at: action !== 'reviewing' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/reports')
  return {}
}
