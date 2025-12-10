'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MobileNav, BottomNav, DesktopSidebar } from '@/components/nav'
import { WelcomeModal } from '@/components/onboarding/welcome-modal'

interface DashboardShellProps {
  children: React.ReactNode
  user?: {
    email?: string
    name?: string
    avatarUrl?: string
  }
  showOnboarding?: boolean
}

export function DashboardShell({ children, user, showOnboarding = false }: DashboardShellProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modal de bienvenida para nuevos usuarios */}
      {showOnboarding && <WelcomeModal userName={user?.name} isOpen={true} />}

      {/* Desktop: Sidebar + Content */}
      <div className="flex">
        <DesktopSidebar user={user} onSignOut={handleSignOut} />

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Mobile header (hidden on desktop) */}
          <div className="lg:hidden">
            <MobileNav user={user} onSignOut={handleSignOut} />
          </div>

          {/* Desktop header */}
          <header className="hidden lg:block border-b bg-card/50 backdrop-blur sticky top-0 z-10">
            <div className="px-8 py-4">
              <h1 className="text-lg font-semibold">Panel de Control</h1>
            </div>
          </header>

          {/* Page content */}
          <main className="pt-14 pb-20 px-4 lg:pt-0 lg:pb-8 lg:px-8">
            <div className="max-w-4xl mx-auto lg:max-w-none">{children}</div>
          </main>

          {/* Mobile bottom nav (hidden on desktop) */}
          <div className="lg:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
