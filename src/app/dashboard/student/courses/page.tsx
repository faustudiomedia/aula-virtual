import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StudentCoursesCatalogView from "./StudentCoursesCatalogView";

export default async function StudentCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, institute_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "alumno" && profile?.role !== "super_admin") redirect("/dashboard");

  // super_admin has no institute_id — the catalog will show empty (no institute selected)
  const instituteId = profile?.institute_id ?? null;

  return (
    <StudentCoursesCatalogView
      instituteId={instituteId}
      userId={user.id}
    />
  );
}
