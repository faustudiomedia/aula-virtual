'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = (courseId: string) => [
  { label: 'Materiales', href: `/dashboard/student/courses/${courseId}`,              exact: true },
  { label: 'Anuncios',   href: `/dashboard/student/courses/${courseId}/announcements`, exact: false },
  { label: 'Tareas',     href: `/dashboard/student/courses/${courseId}/assignments`,   exact: false },
  { label: 'Foro',       href: `/dashboard/student/courses/${courseId}/forum`,         exact: false },
]

export function StudentCourseNavTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname()

  return (
    <div className="flex border-b border-black/5 mb-6 overflow-x-auto gap-0">
      {TABS(courseId).map(({ label, href, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active
                ? 'text-[#1A56DB] border-[#1A56DB]'
                : 'text-[#050F1F]/50 border-transparent hover:text-[#050F1F] hover:border-black/10'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
