import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/Sidebar";
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

  const headersList = await headers();
  const instituteName = headersList.get("x-institute-name") ?? "MAVIC";
  const primaryColor = headersList.get("x-institute-primary") ?? "#1A56DB";
  const logoUrl = headersList.get("x-institute-logo") ?? null;

  return (
    <div className="flex min-h-screen bg-[#F0F9FF]">
      <Sidebar
        role={profile.role as UserRole}
        instituteName={instituteName}
        userName={profile.full_name || user.email || "Usuario"}
        primaryColor={primaryColor}
        logoUrl={logoUrl}
        avatarUrl={profile.avatar_url ?? null}
      />
      <main className="flex-1 overflow-auto">{children}</main>
      <MeetingNotifier />
    </div>
  );
}
