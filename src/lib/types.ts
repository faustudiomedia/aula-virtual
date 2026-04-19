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
  schedule: string | null
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

export interface InstituteTheme {
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string | null
}

// ── Notifications ────────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  link_url: string | null
  created_at: string
}

// ── Messages (Mensajería) ────────────────────────────────────────
export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject: string
  body: string
  is_read: boolean
  created_at: string
  // Joined fields
  sender?: Pick<Profile, 'full_name' | 'email' | 'role' | 'avatar_url'>
  recipient?: Pick<Profile, 'full_name' | 'email' | 'role' | 'avatar_url'>
}

// ── Quizzes ──────────────────────────────────────────────────────
export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct: number        // index of the correct option (0-based)
}

export interface Quiz {
  id: string
  course_id: string
  title: string
  content: QuizQuestion[]
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  student_id: string
  answers: number[]      // selected option index per question
  score: number          // 0-100
  completed_at: string
}

// ── Announcements (Anuncios del Profesor) ────────────────────────
export interface Announcement {
  id: string
  course_id: string
  author_id: string
  title: string
  body: string
  pinned: boolean
  created_at: string
  author?: Pick<Profile, 'full_name' | 'email' | 'avatar_url'>
}

// ── Discussion Forum ─────────────────────────────────────────────
export interface DiscussionThread {
  id: string
  course_id: string
  author_id: string
  title: string
  body: string
  is_pinned: boolean
  created_at: string
  author?: Pick<Profile, 'full_name' | 'email' | 'role' | 'avatar_url'>
  reply_count?: number
}

export interface DiscussionReply {
  id: string
  thread_id: string
  author_id: string
  body: string
  created_at: string
  author?: Pick<Profile, 'full_name' | 'email' | 'role' | 'avatar_url'>
}

// ── Events (Calendario) ──────────────────────────────────────────
export type EventType = 'clase' | 'examen' | 'entrega' | 'otro'

export interface CalendarEvent {
  id: string
  course_id: string
  author_id: string
  title: string
  description: string | null
  event_type: EventType
  start_at: string
  end_at: string | null
  created_at: string
  courses?: Pick<Course, 'title'>
}

// ── Assignments (Trabajos Prácticos) ─────────────────────────────
export interface Assignment {
  id: string
  course_id: string
  author_id: string
  title: string
  description: string | null
  due_date: string | null
  max_score: number
  created_at: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string | null
  comment: string | null
  score: number | null
  feedback: string | null
  submitted_at: string
  graded_at: string | null
  student?: Pick<Profile, 'full_name' | 'email'>
}

// ── Audit Log ────────────────────────────────────────────────────
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'
export type AuditEntityType = 'course' | 'institute' | 'user' | 'material' | 'quiz' | 'message' | 'announcement' | 'thread' | 'event' | 'assignment'

export interface AuditLog {
  id: string
  user_id: string | null
  entity_type: AuditEntityType
  entity_id: string | null
  action: AuditAction
  detailed_changes: Record<string, unknown> | null
  created_at: string
  profiles?: Pick<Profile, 'full_name' | 'email'>
}
