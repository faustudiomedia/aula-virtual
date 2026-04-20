import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherCoursesView from "./TeacherCoursesView";
import type { AcademicPeriod } from "@/lib/types";

export default async function TeacherCoursesPage() {
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

  if (profile?.role !== "profesor" && profile?.role !== "super_admin")
    redirect("/dashboard");

  const { data: periods } = await supabase
    .from("academic_periods")
    .select("*")
    .eq("institute_id", profile?.institute_id)
    .order("start_date", { ascending: false });

  return <TeacherCoursesView teacherId={user.id} periods={(periods ?? []) as AcademicPeriod[]} />;
}
