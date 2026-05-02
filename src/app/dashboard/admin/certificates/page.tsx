import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminCertificatesView from "./AdminCertificatesView";

export default async function AdminCertificatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, institute_id").eq("id", user.id).single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin")
    redirect("/dashboard");

  return (
    <AdminCertificatesView
      adminId={user.id}
      role={profile.role}
      instituteId={profile.institute_id ?? null}
    />
  );
}
