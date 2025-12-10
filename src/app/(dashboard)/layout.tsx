import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from './dashboard-shell'
import { getPrivacySettings } from '@/lib/users/actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Obtener configuración de privacidad/onboarding
  const privacySettings = await getPrivacySettings(user.id)

  return (
    <DashboardShell
      user={{
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatarUrl: user.user_metadata?.avatar_url,
      }}
      showOnboarding={!privacySettings.onboardingCompletado}
    >
      {children}
    </DashboardShell>
  )
}
