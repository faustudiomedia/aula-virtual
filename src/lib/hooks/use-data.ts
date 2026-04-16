"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Course, Enrollment, Material } from "@/lib/types";

// ─── Query key factory ────────────────────────────────────────────
export const queryKeys = {
  course: (id: string) => ["courses", id] as const,
  teacherCourses: (teacherId: string) =>
    ["courses", "teacher", teacherId] as const,
  coursesForInstitute: (instituteId: string | null) =>
    ["courses", "institute", instituteId] as const,
  allCourses: (opts?: CoursesOptions) => ["courses", "all", opts] as const,
  enrollments: (studentId: string) =>
    ["enrollments", "student", studentId] as const,
  courseEnrollments: (courseId: string) =>
    ["enrollments", "course", courseId] as const,
  enrollmentCounts: (courseIds: string[]) =>
    ["enrollments", "counts", courseIds] as const,
  courseMaterials: (courseId: string) => ["materials", courseId] as const,
};

// ─── Individual course ────────────────────────────────────────────
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: queryKeys.course(courseId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();
      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });
}

// ─── Teacher courses ──────────────────────────────────────────────
export function useTeacherCourses(teacherId: string) {
  return useQuery({
    queryKey: queryKeys.teacherCourses(teacherId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Course[];
    },
    enabled: !!teacherId,
  });
}

// ─── Published courses for an institute (student catalog) ─────────
export function useCoursesForInstitute(instituteId: string | null) {
  return useQuery({
    queryKey: queryKeys.coursesForInstitute(instituteId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("institute_id", instituteId)
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Course[];
    },
    enabled: !!instituteId,
  });
}

// ─── Student enrollments ──────────────────────────────────────────
export function useEnrollments(studentId: string) {
  return useQuery({
    queryKey: queryKeys.enrollments(studentId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", studentId);
      if (error) throw error;
      return (data ?? []) as Enrollment[];
    },
    enabled: !!studentId,
  });
}

// ─── Completed material IDs for a student in a course ─────────────
export function useMaterialCompletions(courseId: string, studentId: string) {
  return useQuery({
    queryKey: ["material_completions", courseId, studentId] as const,
    queryFn: async () => {
      const supabase = createClient();
      // Get all material IDs for this course
      const { data: materials } = await supabase
        .from("materials")
        .select("id")
        .eq("course_id", courseId);
      const materialIds = (materials ?? []).map((m: { id: string }) => m.id);
      if (!materialIds.length) return new Set<string>();

      const { data, error } = await supabase
        .from("material_completions")
        .select("material_id")
        .eq("student_id", studentId)
        .in("material_id", materialIds);
      if (error) throw error;
      return new Set((data ?? []).map((r: { material_id: string }) => r.material_id));
    },
    enabled: !!courseId && !!studentId,
  });
}

// ─── Enrollments for a course (with student profiles) ────────────
export function useCourseEnrollments(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseEnrollments(courseId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("enrollments")
        .select("*, profiles(full_name, email, avatar_url)")
        .eq("course_id", courseId)
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!courseId,
  });
}

// ─── Enrollment counts for multiple courses ───────────────────────
export function useEnrollmentCounts(courseIds: string[]) {
  return useQuery({
    queryKey: queryKeys.enrollmentCounts(courseIds),
    queryFn: async () => {
      if (!courseIds.length) return {} as Record<string, number>;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("enrollments")
        .select("course_id")
        .in("course_id", courseIds);
      if (error) throw error;
      const countMap: Record<string, number> = {};
      (data ?? []).forEach((e: { course_id: string }) => {
        countMap[e.course_id] = (countMap[e.course_id] ?? 0) + 1;
      });
      return countMap;
    },
    enabled: courseIds.length > 0,
  });
}

// ─── Materials for a course ───────────────────────────────────────
export function useCourseMaterials(courseId: string) {
  return useQuery({
    queryKey: queryKeys.courseMaterials(courseId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");
      if (error) throw error;
      return (data ?? []) as Material[];
    },
    enabled: !!courseId,
  });
}

// ─── All courses (admin, with pagination & search) ────────────────
export interface CoursesOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminCourseRow {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  institutes: { name: string } | null;
}

export function useCourses(options?: CoursesOptions) {
  const pageSize = options?.pageSize ?? 20;
  const page = options?.page ?? 1;
  const offset = (page - 1) * pageSize;

  return useQuery({
    queryKey: queryKeys.allCourses(options),
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("courses")
        .select("*, profiles(full_name, email), institutes(name)", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (options?.search?.trim()) {
        query = query.ilike("title", `%${options.search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { courses: (data ?? []) as AdminCourseRow[], count: count ?? 0 };
    },
  });
}
