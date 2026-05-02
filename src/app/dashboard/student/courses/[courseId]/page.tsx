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

  if (!enrollment && !isSuperAdmin) redirect("/dashboard/student/courses");

  const effectiveEnrollment = enrollment ?? { id: "preview", progress: 0, completed: false };

  // certificate_requests not in generated types yet — use any cast
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: certificateReq } = await (supabase as any)
    .from("certificate_requests")
    .select("status, certificate_code")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  return (
    <StudentCourseDetailView
      course={course}
      enrollment={effectiveEnrollment}
      userId={user.id}
      initialCertificateRequest={certificateReq ?? null}
    />
  );
}
