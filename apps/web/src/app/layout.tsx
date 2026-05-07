import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Troc — Marketplace de troc',
  description: 'Échangez ce que vous avez contre ce que vous cherchez',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen mx-auto max-w-[480px] bg-gray-50 shadow-xl md:my-4 md:rounded-3xl md:overflow-hidden md:min-h-[calc(100vh-2rem)]">
          {children}
        </div>
      </body>
    </html>
  )
}
