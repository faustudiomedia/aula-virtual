export type UserRole = 'alumno' | 'profesor' | 'admin'

export interface Institute {
  id: string
  name: string
  slug: string
  domain: string | null
  primary_color: string
  secondary_color: string
  logo_url: string | null
  active: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  institute_id: string
  avatar_url: string | null
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  institute_id: string
  teacher_id: string
  cover_url: string | null
  published: boolean
  created_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  progress: number       // 0-100
  completed: boolean
  enrolled_at: string
  courses?: Course
}

export interface Material {
  id: string
  course_id: string
  title: string
  description: string | null
  file_url: string | null
  file_type: string | null
  order_index: number
  created_at: string
}

export interface EnrollmentCode {
  id: string
  course_id: string
  code: string
  max_uses: number | null
  uses: number
  expires_at: string | null
  created_at: string
}

export interface InstituteTheme {
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
}
