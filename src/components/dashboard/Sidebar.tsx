'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}

const adminNav: NavItem[] = [
  { label: 'Panel', href: '/dashboard/admin', icon: '🏠' },
  { label: 'Cursos', href: '/dashboard/admin/courses', icon: '📚' },
  { label: 'Usuarios', href: '/dashboard/admin/users', icon: '👥' },
  { label: 'Invitaciones', href: '/dashboard/admin/invitations', icon: '✉️' },
  { label: 'Mensajes', href: '/dashboard/messages', icon: '📨' },
  { label: 'Calendario', href: '/dashboard/calendar', icon: '📅' },
  { label: 'Estadísticas', href: '/dashboard/admin/stats', icon: '📊' },
  { label: 'Auditoría', href: '/dashboard/admin/audit', icon: '🔍' },
  { label: 'Notificaciones', href: '/dashboard/notifications', icon: '🔔' },
]

const teacherNav: NavItem[] = [
  { label: 'Panel', href: '/dashboard/teacher', icon: '🏠' },
  { label: 'Materiales', href: '/dashboard/teacher/materials', icon: '📁' },
  { label: 'Alumnos', href: '/dashboard/teacher/students', icon: '👨‍🎓' },
  { label: 'Mensajes', href: '/dashboard/messages', icon: '📨' },
  { label: 'Calendario', href: '/dashboard/calendar', icon: '📅' },
  { label: 'Notificaciones', href: '/dashboard/notifications', icon: '🔔' },
]

const studentNav: NavItem[] = [
  { label: 'Inicio', href: '/dashboard/student', icon: '🏠' },
  { label: 'Catálogo', href: '/dashboard/student/courses', icon: '🔍' },
  { label: 'Mi progreso', href: '/dashboard/student/progress', icon: '📈' },
  { label: 'Mensajes', href: '/dashboard/messages', icon: '📨' },
  { label: 'Calendario', href: '/dashboard/calendar', icon: '📅' },
  { label: 'Notificaciones', href: '/dashboard/notifications', icon: '🔔' },
]

interface SidebarProps {
  role: 'admin' | 'profesor' | 'alumno'
  instituteName?: string
  logoUrl?: string | null
  primaryColor?: string
  userName?: string
  unreadNotifications?: number
}

export default function Sidebar({
  role,
  instituteName,
  logoUrl,
  primaryColor,
  userName,
  unreadNotifications = 0,
}: SidebarProps) {
  const pathname = usePathname()
  const color = primaryColor ?? '#1A56DB'

  const baseNav = role === 'admin' ? adminNav : role === 'profesor' ? teacherNav : studentNav

  // Inyectar badge de notificaciones
  const nav: NavItem[] = baseNav.map((item) =>
    item.href === '/dashboard/notifications' && unreadNotifications > 0
      ? { ...item, badge: unreadNotifications }
      : item
  )

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/dashboard/admin' && href !== '/dashboard/teacher' && href !== '/dashboard/student' && pathname.startsWith(href))

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-black/5 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-black/5">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={instituteName} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: color }}
            >
              {instituteName?.charAt(0) ?? 'M'}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-[#050F1F] leading-none">{instituteName ?? 'MAVIC'}</p>
            <p className="text-xs text-[#050F1F]/40 mt-0.5">Plataforma Educativa</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {userName && (
        <div className="px-5 py-3 border-b border-black/5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: color }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs font-medium text-[#050F1F]/70 truncate">{userName}</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {nav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'text-white shadow-sm'
                  : 'text-[#050F1F]/60 hover:bg-black/5 hover:text-[#050F1F]'
              }`}
              style={active ? { background: color } : undefined}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  active ? 'bg-white/30 text-white' : 'bg-[#1A56DB] text-white'
                }`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-black/5">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-[#050F1F]/60 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}