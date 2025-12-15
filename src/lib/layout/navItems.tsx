import {
  LayoutDashboard,
  FileCheck,
  Trophy,
  User,
  HelpCircle,
  BarChart3,
  AlertTriangle,
  Newspaper,
  Search,
  Database,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  hasBlogIndicator?: boolean
  featureId?: string
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/verificar', label: 'Verificar Actas', icon: FileCheck },
  { href: '/dashboard/discrepancias', label: 'Discrepancias', icon: AlertTriangle },
  {
    href: '/dashboard/estadisticas',
    label: 'Estadísticas',
    icon: BarChart3,
    featureId: 'estadisticas-departamento',
  },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/buscar-acta', label: 'Buscar Acta', icon: Search, featureId: 'buscar-acta' },
  {
    href: '/dashboard/explorar',
    label: 'Explorar Actas',
    icon: Database,
    featureId: 'explorar-actas',
  },
  { href: '/dashboard/blog', label: 'Blog', icon: Newspaper, hasBlogIndicator: true },
  { href: '/dashboard/perfil', label: 'Mi Perfil', icon: User },
  { href: '/dashboard/faq', label: 'Preguntas Frecuentes', icon: HelpCircle },
]
