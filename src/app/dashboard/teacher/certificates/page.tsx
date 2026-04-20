import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CertificatesView from "./CertificatesView";

export default async function TeacherCertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "profesor" && profile?.role !== "super_admin")
    redirect("/dashboard");

  return <CertificatesView teacherId={user.id} role={profile.role} />;
}
