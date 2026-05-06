import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE_NAME = 'admin_session'

export function checkAuth(): void {
  const cookieStore = cookies()
  const session = cookieStore.get(COOKIE_NAME)
  const adminSecret = process.env.ADMIN_SECRET

  if (!adminSecret) {
    throw new Error('Missing env variable: ADMIN_SECRET')
  }

  if (!session || session.value !== adminSecret) {
    redirect('/login')
  }
}

export function setAuthCookie(password: string): boolean {
  const adminSecret = process.env.ADMIN_SECRET
  return password === adminSecret
}

export { COOKIE_NAME }
