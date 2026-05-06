'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  ArrowLeftRight,
  Flag,
  BarChart3,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/users', label: 'Utilisateurs', icon: Users },
  { href: '/listings', label: 'Annonces', icon: ShoppingBag },
  { href: '/exchanges', label: 'Échanges', icon: ArrowLeftRight },
  { href: '/reports', label: 'Signalements', icon: Flag },
  { href: '/stats', label: 'Statistiques', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <span className="text-white text-base font-bold">T</span>
        </div>
        <div>
          <span className="text-white font-semibold text-lg leading-none">Troc</span>
          <p className="text-gray-400 text-xs mt-0.5">Administration</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="sidebar-link sidebar-link-inactive w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={18} strokeWidth={2} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
