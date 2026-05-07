'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/stores/auth'

const TABS = [
  { href: '/home', label: 'Accueil', icon: '🏠' },
  { href: '/listings', label: 'Annonces', icon: '📋' },
  { href: '/messages', label: 'Messages', icon: '💬' },
  { href: '/profile', label: 'Profil', icon: '👤' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, initialized, init } = useAuth()

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (initialized && !user) router.replace('/login')
  }, [user, initialized, router])

  if (!initialized || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Chargement…
      </div>
    )
  }

  const showTabs = TABS.some((t) => pathname?.startsWith(t.href))

  return (
    <div className="min-h-screen pb-20">
      {children}

      {showTabs && (
        <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-[480px] bg-white border-t border-gray-100 flex justify-around py-2 px-2">
          {TABS.map((tab) => {
            const active = pathname?.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl ${active ? 'text-primary-500' : 'text-gray-400'}`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-[11px] font-semibold mt-0.5">{tab.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
