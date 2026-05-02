import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CourseStudentsView from "./CourseStudentsView";
import { CourseNavTabs } from "@/components/ui/CourseNavTabs";
import Link from "next/link";

interface Props {
  params: Promise<{ courseId: string }>;
}

export default async function CourseStudentsPage({ params }: Props) {
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

  if (profile?.role !== "profesor" && profile?.role !== "super_admin") redirect("/dashboard");

  const { data: course } = await supabase
    .from("courses").select("title").eq("id", courseId).single();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-2">
        <Link href="/dashboard/teacher" className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors">
          ← Mis cursos
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-6">{course?.title ?? "Curso"}</h1>
      <CourseNavTabs courseId={courseId} />
      <CourseStudentsView courseId={courseId} /
