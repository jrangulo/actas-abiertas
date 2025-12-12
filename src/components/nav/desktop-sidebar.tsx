'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileCheck,
  Trophy,
  User,
  LogOut,
  HelpCircle,
  BarChart3,
  AlertTriangle,
  Newspaper,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NavBlogIndicator } from './nav-blog-indicator'
import { NewFeatureIndicator } from './new-feature-indicator'
import { useFeatureSeen } from '@/hooks/use-feature-seen'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  hasBlogIndicator?: boolean
  featureId?: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/verificar', label: 'Verificar Actas', icon: FileCheck },
  { href: '/dashboard/discrepancias', label: 'Discrepancias', icon: AlertTriangle },
  { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/buscar-acta', label: 'Buscar Acta', icon: Search, featureId: 'buscar-acta' },
  { href: '/dashboard/blog', label: 'Blog', icon: Newspaper, hasBlogIndicator: true },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: User },
  { href: '/dashboard/faq', label: 'Preguntas Frecuentes', icon: HelpCircle },
]

interface DesktopSidebarProps {
  user?: {
    email?: string
    name?: string
    avatarUrl?: string
  }
  onSignOut?: () => void
  latestPostDate?: string | null
}

function NavItemLink({ item, isActive }: Readonly<{ item: NavItem; isActive: boolean }>) {
  const { markFeatureAsSeen } = useFeatureSeen(item.featureId || '')
  const Icon = item.icon

  const handleClick = () => {
    if (item.featureId) {
      markFeatureAsSeen()
    }
  }

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative',
        isActive
          ? 'bg-[#0069b4] text-white'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {item.featureId && <NewFeatureIndicator featureId={item.featureId} />}
      </span>
      {item.label}
    </Link>
  )
}

export function DesktopSidebar({ user, onSignOut, latestPostDate }: Readonly<DesktopSidebarProps>) {
  const pathname = usePathname()

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    user?.email?.substring(0, 2).toUpperCase() ||
    '??'

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0069b4] flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg">Actas Abiertas</span>
            <p className="text-xs text-muted-foreground">Verificación ciudadana</p>
          </div>
        </Link>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

          // Items with featureId use the NavItemLink component to handle marking as seen
          if (item.featureId) {
            return <NavItemLink key={item.href} item={item} isActive={isActive} />
          }

          // Regular items without featureId
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-[#0069b4] text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {item.hasBlogIndicator && (
                  <NavBlogIndicator latestPostDate={latestPostDate ?? null} />
                )}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        {user && (
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-[#0069b4] text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.name || 'Usuario'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>

        {/* Legal links */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-x-2 flex items-center gap-2">
          <Link href="/privacidad" className="hover:text-foreground transition-colors">
            Privacidad
          </Link>
          <span>·</span>
          <Link href="/terminos" className="hover:text-foreground transition-colors">
            Términos
          </Link>
          <span>·</span>
          <a
            href="https://github.com/jrangulo/actas-abiertas"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            GitHub
          </a>
        </div>
      </div>
    </aside>
  )
}
