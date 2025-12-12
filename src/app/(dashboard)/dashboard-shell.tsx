'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MobileNav, BottomNav, DesktopSidebar } from '@/components/nav'
import { WelcomeModal } from '@/components/onboarding/welcome-modal'
import { Toaster } from '@/components/ui/sonner'

interface DashboardShellProps {
  children: React.ReactNode
  user?: {
    email?: string
    name?: string
    avatarUrl?: string
  }
  showOnboarding?: boolean
  latestPostDate?: string | null
}

export function DashboardShell({
  children,
  user,
  showOnboarding = false,
  latestPostDate,
}: DashboardShellProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      {/* Modal de bienvenida para nuevos usuarios */}
      {showOnboarding && <WelcomeModal userName={user?.name} isOpen={true} />}

      {/* Desktop: Sidebar + Content */}
      <div className="flex">
        <DesktopSidebar user={user} onSignOut={handleSignOut} latestPostDate={latestPostDate} />

        {/* Main content area */}
        <div className="flex-1 min-w-0">
          {/* Mobile header (hidden on desktop) */}
          <div className="lg:hidden">
            <MobileNav user={user} onSignOut={handleSignOut} latestPostDate={latestPostDate} />
          </div>

          {/* Page content */}
          <main className="pt-14 pb-20 px-4 lg:pt-6 lg:pb-8 lg:px-8">
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
