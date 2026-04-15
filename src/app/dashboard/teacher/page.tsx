import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherDashboardView from "./TeacherDashboardView";

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

  // Role enforcement is handled by the middleware (proxy.ts).
  // Redirecting here to /dashboard would cause a loop because /dashboard
  // has no page.tsx — the middleware is responsible for keeping users on
  // their correct route.
  return (
    <TeacherDashboardView teacherId={user.id} teacherName={profile?.full_name ?? user.email ?? ""} />
  );
}
