import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPath } from "@/lib/auth/getDashboardPath";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url, institute_id, legajo, signature_url")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const dashboardPath = getDashboardPath(profile.role);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={dashboardPath}
          className="text-sm text-[var(--ag-text-muted)] hover:text-[var(--ag-text)] transition-colors"
        >
          ← Panel
        </Link>
        <span className="text-[var(--ag-text)]/20">/</span>
        <span className="text-sm font-medium text-[var(--ag-text)]">Mi perfil</span>
      </div>

      <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-1">Mi perfil</h1>
      <p className="text-[var(--ag-text-muted)] mb-8">Actualizá tu información personal.</p>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-black/5">
          <div className="w-16 h-16 rounded-2xl bg-[var(--ag-navy)] flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (profile.full_name || user.email || "U").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-[var(--ag-text)]">{profile.full_name || "Sin nombre"}</p>
            <p className="text-sm text-[var(--ag-text-muted)]">{user.email}</p>
            {profile.legajo && (
              <p className="text-xs text-[var(--ag-text-muted)] mt-0.5">Legajo: <span className="font-medium text-[var(--ag-text-muted)]">{profile.legajo}</span></p>
            )}
          </div>
        </div>

        <ProfileForm
          fullName={profile.full_name}
          email={user.email ?? ""}
          avatarUrl={profile.avatar_url}
          signatureUrl={profile.signature_url}
          role={profile.role}
        />
      </div>

      {/* Password change */}
      <div className="mt-4 bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-[var(--ag-text)] mb-1">Contraseña</h2>
        <p className="text-sm text-[var(--ag-text-muted)] mb-3">
          Para cambiar tu contraseña, solicitá un enlace de restablecimiento.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block px-4 py-2 rounded-xl border border-black/10 text-sm text-[var(--ag-text)]/70 hover:bg-black/5 transition font-medium"
        >
          Cambiar contraseña →
        </Link>
      </div>
    </div>
  );
}
