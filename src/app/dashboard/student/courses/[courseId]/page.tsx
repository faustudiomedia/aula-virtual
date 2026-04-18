import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentCourseDetailView from "./StudentCourseDetailView";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function StudentCourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "alumno" && profile?.role !== "super_admin")
    redirect("/dashboard");

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .eq("published", true)
    .single();

  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, progress, completed")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment) redirect("/dashboard/student/courses");

  return (
    <StudentCourseDetailView
      course={course}
      enrollment={enrollment}
      userId={user.id}
    />
  );
}
