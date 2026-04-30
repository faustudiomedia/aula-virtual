import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { MeetingNotifier } from "@/components/ui/MeetingNotifier";
import type { UserRole } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, institute_id, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const cookieStore = await cookies();
  const activeInstituteId =
    cookieStore.get("active_institute_id")?.value ?? profile.institute_id ?? null;

  let instituteName = "Agorify";
  let primaryColor = "#1A56DB";
  let logoUrl: string | null = null;

  if (activeInstituteId) {
    const { data: institute } = await supabase
      .from("institutes")
      .select("name, primary_color, logo_url")
      .eq("id", activeInstituteId)
      .single();

    if (institute) {
      instituteName = institute.name;
      primaryColor = institute.primary_color ?? "#1A56DB";
      logoUrl = institute.logo_url ?? null;
    }
  }

  return (
    <>
      <DashboardShell
        role={profile.role as UserRole}
        instituteName={instituteName}
        userName={profile.full_name || user.email || "Usuario"}
        primaryColor={primaryColor}
        logoUrl={logoUrl}
        avatarUrl={profile.avatar_url ?? null}
        userId={user.id}
      >
        {children}
      </DashboardShell>
      <MeetingNotifier />
    </>
  );
}
