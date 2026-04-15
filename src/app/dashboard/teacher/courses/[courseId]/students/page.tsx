import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CourseStudentsView from "./CourseStudentsView";

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

  return <CourseStudentsView courseId={courseId} />;
}
