'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Course,
  Enrollment,
  EnrollmentCode,
  Institute,
  Material,
  Profile,
  UserRole,
} from '@/lib/types'

// ─── Query key factory ───────────────────────────────────────────────────────

export const queryKeys = {
  courses: ['courses'] as const,
  teacherCourses: (teacherId: string) => ['courses', 'teacher', teacherId] as const,
  course: (id: string) => ['courses', id] as const,
  coursesForInstitute: (instituteId: string) => ['courses', 'institute', instituteId] as const,
  enrollments: (studentId: string) => ['enrollments', studentId] as const,
  courseEnrollments: (courseId: string) => ['enrollments', 'course', courseId] as const,
  courseMaterials: (courseId: string) => ['materials', courseId] as const,
  profiles: ['profiles'] as const,
  profilesForInstitute: (instituteId: string) => ['profiles', 'institute', instituteId] as const,
  userRoles: ['user-roles'] as const,
  enrollmentCodes: (courseId: string) => ['enrollment-codes', courseId] as const,
  institutes: ['institutes'] as const,
}

// ─── Courses ─────────────────────────────────────────────────────────────────

/** All courses (admin/global view) */
export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Course[]
    },
  })
}

/** Courses owned by a specific teacher */
export function useTeacherCourses(teacherId: string) {
  return useQuery({
    queryKey: queryKeys.teacherCourses(teacherId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Course[]
    },
    enabled: Boolean(teacherId),
  })
}

/** Single course by ID */
export function useCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.course(id),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Course
    },
    enabled: Boolean(id),
  })
}

/** Published courses belonging to an institute */
export function useCoursesForInstitute(instituteId: string) {
  return useQuery({
    queryKey: queryKeys.coursesForInstitute(instituteId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('institute_id', instituteId)
        .eq('published', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Course[]
    },
    enabled: Boolean(instituteId),
  })
}

// ─── Enrollments ─────────────────────────────────────────────────────────────

/** All enrollments for a student (with course details) */
export function useEnrollments(studentId: string) {
  return useQuery({
    queryKey: queryKeys.enrollments(studentId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false })
      if (error) throw error
      return data as (Enrollment & { courses: Course })[]
    },
    enabled: Boolean(studentId),
  })
}

/** All students enrolled in a specific course */
export function useCourseEnrollments(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseEnrollments(courseId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('enrollments')
        .select('*, profiles(*)')
        .eq('course_id', courseId)
        .order('enrolled_at', { ascending: false })
      if (error) throw error
      return data as (Enrollment & { profiles: Profile })[]
    },
    enabled: Boolean(courseId),
  })
}

// ─── Materials ───────────────────────────────────────────────────────────────

/** Course materials ordered by index */
export function useCourseMaterials(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseMaterials(courseId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
      if (error) throw error
      return data as Material[]
    },
    enabled: Boolean(courseId),
  })
}

// ─── Profiles ────────────────────────────────────────────────────────────────

/** All user profiles */
export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true })
      if (error) throw error
      return data as Profile[]
    },
  })
}

/** Profiles belonging to a specific institute */
export function useProfilesForInstitute(instituteId: string) {
  return useQuery({
    queryKey: queryKeys.profilesForInstitute(instituteId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('institute_id', instituteId)
        .order('full_name', { ascending: true })
      if (error) throw error
      return data as Profile[]
    },
    enabled: Boolean(instituteId),
  })
}

// ─── User roles ──────────────────────────────────────────────────────────────

/** All user roles (id, role) */
export function useUserRoles() {
  return useQuery({
    queryKey: queryKeys.userRoles,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role')
      if (error) throw error
      return data as { id: string; role: UserRole }[]
    },
  })
}

// ─── Enrollment codes ────────────────────────────────────────────────────────

/** Enrollment codes for a course */
export function useEnrollmentCodes(courseId: string) {
  return useQuery({
    queryKey: queryKeys.enrollmentCodes(courseId),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('enrollment_codes')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as EnrollmentCode[]
    },
    enabled: Boolean(courseId),
  })
}

// ─── Institutes ──────────────────────────────────────────────────────────────

/** All institutes */
export function useInstitutes() {
  return useQuery({
    queryKey: queryKeys.institutes,
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('institutes')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data as Institute[]
    },
  })
}
