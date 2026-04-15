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

  if (profile?.role !== "alumno") redirect("/dashboard");

  return (
    <StudentCoursesCatalogView
      instituteId={profile.institute_id}
      userId={user.id}
    />
  );
}
