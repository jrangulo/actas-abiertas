import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from './dashboard-shell'
import { getPrivacySettings } from '@/lib/users/actions'
import { getLatestPostDate } from '@/lib/blog'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Obtener configuración de privacidad/onboarding y fecha del último post
  const [privacySettings, latestPostDate] = await Promise.all([
    getPrivacySettings(user.id),
    Promise.resolve(getLatestPostDate()),
  ])

  return (
    <DashboardShell
      user={{
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      showOnboarding={!privacySettings.onboardingCompletado}
      latestPostDate={latestPostDate}
    >
      {children}
    </DashboardShell>
  )
}
