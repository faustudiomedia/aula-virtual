import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentCourseDetailView from "./StudentCourseDetailView";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function StudentCourseDetailPage({ params }: Props) {
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "alumno" && profile?.role !== "super_admin")
    redirect("/dashboard");

  const isSuperAdmin = profile?.role === "super_admin";

  // super_admin can preview any course (published or not)
  let courseQuery = supabase.from("courses").select("*").eq("id", courseId);
  if (!isSuperAdmin) courseQuery = courseQuery.eq("published", true);
  const { data: course } = await courseQuery.single();

  if (!course) notFound();

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, progress, completed")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (!enrollment && !isSuperAdmin) redirect("/dashboa
