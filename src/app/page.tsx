import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Force a fresh Supabase read on every request so a stale cached role
// cannot cause infinite redirect loops when the user's role changes.
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "alumno";

  if (role === "super_admin") redirect("/dashboard/super-admin");
  if (role === "admin") redirect("/dashboard/admin");
  if (role === "profesor") redirect("/dashboard/teacher");
  redirect("/dashboard/student");
}
