import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/dashboard/Sidebar";
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
    .select("full_name, role, institute_id")
    .eq("id", user.id)
    .single();

  // If the profile read failed (e.g. RLS not yet configured in Supabase) but
  // the user IS authenticated, do NOT redirect to /login.  Doing so would
  // send the user through the proxy which redirects them back here, creating
  // an infinite loop.  Show a recoverable error state instead.
  if (!profile) {
    return (
      <div className="flex min-h-screen bg-[#F0F9FF]">
        <main className="flex-1 overflow-auto flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-lg font-semibold text-[#050F1F]">
              No se pudo cargar tu perfil
            </p>
            <p className="text-sm text-[#050F1F]/50 mt-2">
              Por favor recargá la página o volvé a iniciar sesión.
            </p>
          </div>
        </main>
      </div>
    );
  }

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
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
