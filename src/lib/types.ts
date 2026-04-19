export type UserRole = "alumno" | "profesor" | "admin" | "super_admin";

export interface Institute {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
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
