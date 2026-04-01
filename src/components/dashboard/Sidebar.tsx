'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import type { UserRole } from '@/lib/types'

interface NavItem {
  href: string
  label: string
  icon: string
}

const NAV: Record<UserRole, NavItem[]> = {
  alumno: [
    { href: '/dashboard/student', label: 'Mis cursos', icon: '📚' },
    { href: '/dashboard/student/progress', label: 'Mi progreso', icon: '📊' },
  ],
  profesor: [
    { href: '/dashboard/teacher', label: 'Mis cursos', icon: '🎓' },
    { href: '/dashboard/teacher/students', label: 'Alumnos', icon: '👥' },
    { href: '/dashboard/teacher/materials', label: 'Materiales', icon: '📁' },
  ],
  admin: [
    { href: '/dashboard/admin', label: 'Institutos', icon: '🏛️' },
    { href: '/dashboard/admin/users', label: 'Usuarios', icon: '👤' },
    { href: '/dashboard/admin/courses', label: 'Cursos', icon: '📚' },
    { href: '/dashboard/admin/stats', label: 'Estadísticas', icon: '📈' },
  ],
}

const ROLE_LABELS: Record<UserRole, string> = {
  alumno: 'Alumno',
  profesor: 'Profesor',
  admin: 'Administrador',
}

interface Props {
  role: UserRole
  instituteName: string
  userName: string
  primaryColor: string
}

export default function Sidebar({ role, instituteName, userName, primaryColor }: Props) {
  const pathname = usePathname()
  const items = NAV[role]

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-[#050F1F] border-r border-white/5 shadow-xl">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, #38BDF8)` }}
          >
            {instituteName.charAt(0)}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{instituteName}</p>
            <p className="text-white/40 text-xs">{ROLE_LABELS[role]}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${active
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white text-xs font-bold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userName}</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 text-sm transition-all"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
