export type UserRole = "alumno" | "profesor" | "admin" | "super_admin";

export interface Institute {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  director_name?: string | null;
  director_signature_url?: string | null;
  active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  institute_id: string | null;
  avatar_url: string | null;
  signature_url?: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  institute_id: string | null;
  teacher_id: string;
  cover_url: string | null;
  published: boolean;
  created_at: string;
  period_id: string | null;
}

export interface AcademicPeriod {
  id: string;
  institute_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  progress: number; // 0-100
  completed: boolean;
  enrolled_at: string;
  courses?: Course;
}

export interface Material {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  file_type: string | null;
  order_index: number;
  module_number: number | null;
  module_title: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  course_id: string;
  author_id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string | null;
  max_score: number;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  file_url: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  content: QuizQuestion[];
  is_published: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: number[];
  score: number;
  completed_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  detailed_changes: Record<string, unknown> | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  
