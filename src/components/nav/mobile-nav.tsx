'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileCheck,
  Trophy,
  User,
  Menu,
  X,
  LogOut,
  HelpCircle,
  BarChart3,
  AlertTriangle,
  Newspaper,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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

interface MobileNavProps {
  user?: {
    email?: string
    name?: string
  }
  onSignOut?: () => void
  latestPostDate?: string | null
}

function MobileNavItemLink({
  item,
  isActive,
  onClose,
}: Readonly<{ item: NavItem; isActive: boolean; onClose: () => void }>) {
  const { markFeatureAsSeen } = useFeatureSeen(item.featureId || '')
  const Icon = item.icon

  const handleClick = () => {
    if (item.featureId) {
      markFeatureAsSeen()
    }
    onClose()
  }

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors relative',
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

export function MobileNav({ user, onSignOut, latestPostDate }: Readonly<MobileNavProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0069b4] flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">Actas Abiertas</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <span className="relative">
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              {/* Indicador de nuevos posts visible incluso sin abrir el menú */}
              <NavBlogIndicator latestPostDate={latestPostDate ?? null} />
            </span>
          </Button>
        </div>
      </header>

      {/* Menú desplegable móvil */}
      {isOpen && (
        <div className="fixed inset-0 z-40 pt-14 bg-background">
          <nav className="flex flex-col p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              if (item.featureId) {
                return (
                  <MobileNavItemLink
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    onClose={() => setIsOpen(false)}
                  />
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors relative',
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

            <Separator className="my-4" />

            {user && <div className="px-4 py-2 text-sm text-muted-foreground">{user.email}</div>}

            <button
              onClick={() => {
                setIsOpen(false)
                onSignOut?.()
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
