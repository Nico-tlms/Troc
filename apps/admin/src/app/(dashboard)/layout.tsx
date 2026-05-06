import { checkAuth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  checkAuth()

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-60 overflow-y-auto">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
