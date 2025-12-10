'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileCheck, Trophy, User, Menu, X, LogOut, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/verificar', label: 'Verificar Actas', icon: FileCheck },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: User },
  { href: '/dashboard/faq', label: 'Preguntas Frecuentes', icon: HelpCircle },
]

interface MobileNavProps {
  user?: {
    email?: string
    name?: string
  }
  onSignOut?: () => void
}

export function MobileNav({ user, onSignOut }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
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
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                    isActive
                      ? 'bg-[#0069b4] text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
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
