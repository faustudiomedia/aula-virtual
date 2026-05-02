'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = (courseId: string) => [
  { label: 'Materiales',  href: `/dashboard/student/courses/${courseId}`,                 exact: true },
  { label: 'Anuncios',    href: `/dashboard/student/courses/${courseId}/announcements`,    exact: false },
  { label: 'Tareas',      href: `/dashboard/student/courses/${courseId}/assignments`,      exact: false },
  { label: 'Foro',        href: `/dashboard/student/courses/${courseId}/forum`,            exact: false },
  { label: 'Asistencia',  href: `/dashboard/student/courses/${courseId}/attendance`,       exact: false },
]

export function StudentCourseNavTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname()

  return (
    <div className="flex border-b border-[var(--ag-border-light)] mb-6 overflow-x-auto gap-0">
      {TABS(courseId).map(({ label, href, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              active
                ? 'text-[var(--ag-navy)] border-[var(--ag-navy)]'
                : 'text-[var(--ag-text-muted)] border-transparent hover:text-[var(--ag-text)] hover:border-[var(--ag-border)]'
            }`}
          >
            {label}
          </Link>
        )
