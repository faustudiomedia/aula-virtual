import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherDashboardView from "./TeacherDashboardView";
import { getDashboardPath } from "@/lib/auth/getDashboardPath";

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "profesor" && profile.role !== "super_admin"))
    redirect(getDashboardPath(profile?.role ?? "alumno"));

  return (
    <TeacherDashboardView teacherId={user.id} teacherName={profile.full_name} />
  );
}
