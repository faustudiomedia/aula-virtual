import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherCoursesView from "./TeacherCoursesView";

export default async function TeacherCoursesPage() {
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

  if (profile?.role !== "profesor" && profile?.role !== "super_admin")
    redirect("/dashboard");

  return <TeacherCoursesView teacherId={user.id} />;
}
