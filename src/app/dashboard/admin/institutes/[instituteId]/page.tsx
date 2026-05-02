import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changeUserRoleAction, removeUserFromInstituteAction, deleteInstituteAction } from "@/app/actions/admin";

async function updateInstitute(instituteId: string, formData: FormData) {
  "use server";
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, institute_id")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  if (!isAdmin) redirect("/dashboard");

  if (profile?.role === "admin" && profile?.institute_id !== instituteId)
    redirect("/dashboard/admin");

  const updates: Record<string, unknown> = {
    name:            formData.get("name") as string,
    domain:          (formData.get("domain") as string) || null,
    primary_color:   formData.get("primary_color") as string,
    secondary_color: formData.get("secondary_color") as string,
    active:          formData.get("active") === "on",
    director_name:   (formData.get("director_name") as string) || null,
  };

  // Handle director signature upload
  const sigFile = formData.get("director_signature") as File | null;
  if (sigFile && sigFile.size > 0) {
    const ext = sigFile.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `director_signature_${instituteId}.${ext}`;
    const bytes = await sigFile.arrayBuffer();
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, bytes, { contentType: sigFile.type, upsert: true });
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      updates.director_signature_url = `${publicUrl}?t=${Date.now()}`;
    }
  }

  await supabase.from("institutes").update(updates).eq("id", instituteId);

  redirect(`/dashboard/admin/institutes/${instituteId}`);
}

interface Props {
  params: Promise<{ instituteId: string }>;
}

const ROLE_LABEL: Record<string, string> = {
  alumno:   "Alumno",
  profesor: "Profesor",
  admin:    "Admin",
}
const ROLE_COLOR: Record<string, string> = {
  alumno:   "bg-sky-50 text-sky-700",
  profesor: "bg-violet-50 text-violet-700",
  admin:    "bg-orange-50 text-orange-700",
}

export default async function InstituteDetailPage({ params }: Props) {
  const { instituteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, institute_id")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "super_admin")
    redirect("/dashboard/admin");

  const { data: institute } = await supabase
    .from("institutes").select("*").eq("id", instituteId).single();
  if (!institute) notFound();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url")
    .eq("institute_id", instituteId)
    .order("role")
    .order("full_name");

  const memberList = (members ?? []) as {
    id: string; full_name: string | null; email: string; role: string; avatar_url: string | null
  }[]

  const students  = memberList.filter(m => m.role === "alumno").length;
  const teachers  = memberList.filter(m => m.role === "profesor").length;

  const { data: courses } = await supabase
    .from("courses").select("id, title, published").eq("institute_id", instituteId);
  const courseList = (courses ?? []) as { id: string; title: string; published: boolean }[]

  const boundUpdate = updateInstitute.bind(null, instituteId);
  const isSuperAdmin = profile?.role === "super_admin";

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <a href="/dashboard/admin" className="text-[var(--ag-navy)] hover:underline text-sm">
        ← Institutos
      </a>
      <div className="flex items-start justify-between mt-3 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ag-text)]">{institute.name}</h1>
          <p className="text-[var(--ag-text-muted)] text-sm mt-0.5">/{institute.slug}</p>
        </div>
        {isSuperAdmin && (
          <form action={deleteInstituteAction}>
            <input type="hidden" name="instituteId" value={instituteId} />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-medium hover:bg-red-50 transition-all"
            >
              Eliminar instituto
            </button>
          </form>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Alumnos",   value: students,         bg: "#EFF6FF", color: "var(--ag-navy)" },
          { label: "Profesores", value: teachers,        bg: "#F5F3FF", color: "#7C3AED" },
          { label: "Cursos",    value: courseList.length, bg: "#FFFBEB", color: "#D97706" },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 border border-black/5" style={{ background: s.bg }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[var(--ag-text-muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-[var(--ag-text)] mb-4">Configuración</h2>
        <form action={boundUpdate} className="space-y-4" encType="multipart/form-data">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1.5">Nombre *</label>
              <input name="name" required defaultValue={institute.name}
                className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1.5">Slug</label>
              <input value={institute.slug} disabled
                className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm bg-black/5 text-[var(--ag-text-muted)] font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1.5">Dominio personalizado</label>
            <input name="domain" defaultValue={institute.domain ?? ""}
              placeholder="Ej: miinstituto.edu.ar"
              className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1.5">Color primario</label>
              <input type="color" name="primary_color" defaultValue={institute.primary_color}
                className="w-full h-10 rounded-xl border border-black/10 cursor-pointer p-1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1.5">Color secundario</label>
              <input type="color" name="secondary_color" defaultValue={institute.secondary_color}
                className="w-full h-10 rounded-xl border border-black/10 cursor-pointer p-1" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1.5">Nombre del Director/a</label>
            <input name="director_name" defaultValue={institute.director_name ?? ""}
              placeholder="Ej: Lic. María González"
              className="w-full px-3 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ag-navy)]/30 transition" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ag-text-muted)] mb-1.5">
              Firma del Director/a <span className="text-[var(--ag-text)]/30">(PNG transparente, aparece en diplomas)</span>
            </label>
            <div className="flex items-center gap-4">
              {institute.director_signature_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={institute.director_signature_url}
                  alt="Firma actual"
                  className="h-14 max-w-[160px] object-contain border border-black/10 rounded-xl p-2 bg-white mix-blend-multiply"
                />
              )}
              <input
                type="file"
                name="director_signature"
                accept="image/png"
                className="text-xs text-[var(--ag-text-muted)] file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-black/10 file:text-xs file:font-medium file:bg-white file:text-[var(--ag-text)]/70 hover:file:bg-black/5 transition"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="active" name="active" defaultChecked={institute.active}
              className="w-4 h-4 rounded accent-[var(--ag-navy)]" />
            <label htmlFor="active" className="text-sm font-medium text-[var(--ag-text)]">Instituto activo</label>
          </div>
          <button type="submit"
            className="w-full py-2.5 rounded-xl bg-[var(--ag-navy)] text-white font-semibold text-sm hover:opacity-90 transition shadow-lg ">
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--ag-text)]">Usuarios del instituto</h2>
          <a href={`/dashboard/admin/users/new`}
            className="text-xs px-3 py-1.5 rounded-lg bg-[var(--ag-navy)] text-white font-medium hover:bg-[var(--ag-navy)]/90 transition-all">
            + Agregar usuario
          </a>
        </div>

        {memberList.length === 0 ? (
          <p className="text-sm text-[var(--ag-text-muted)] py-4 text-center">Sin usuarios registrados.</p>
        ) : (
          <div className="space-y-2">
            {memberList.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-black/5 hover:bg-black/[0.01]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--ag-navy)" }}>
                  {(m.full_name || m.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--ag-text)] truncate">{m.full_name || "(sin nombre)"}</p>
                  <p className="text-xs text-[var(--ag-text-muted)] truncate">{m.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLOR[m.role] ?? "bg-black/5 text-[var(--ag-text-muted)]"}`}>
                  {ROLE_LABEL[m.role] ?? m.role}
                </span>
                {m.role !== "admin" && m.role !== "super_admin" && (
                  <div className="flex gap-1 flex-shrink-0">
                    {m.role === "alumno" ? (
                      <form action={changeUserRoleAction}>
                        <input type="hidden" name="userId" value={m.id} />
                        <input type="hidden" name="role" value="profesor" />
                        <button type="submit"
                          className="text-xs px-2.5 py-1 rounded-lg border border-violet-200 text-violet-600 hover:bg-violet-50 transition-all">
                          → Profesor
                        </button>
                      </form>
                    ) : (
                      <form action={changeUserRoleAction}>
                        <input type="hidden" name="userId" value={m.id} />
                        <input type="hidden" name="role" value="alumno" />
                        <button type="submit"
                          className="text-xs px-2.5 py-1 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 transition-all">
                          → Alumno
                        </button>
                      </form>
                    )}
                    <form action={removeUserFromInstituteAction}>
                      <input type="hidden" name="userId" value={m.id} />
                      <button type="submit"
                        className="text-xs px-2 py-1 rounded-lg border border-black/10 text-[var(--ag-text)]/30 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                        ✕
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Courses */}
      {courseList.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[var(--ag-text)] mb-3">Cursos</h2>
          <div className="space-y-2">
            {courseList.map(c => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-black/5 text-sm">
                <span className="font-medium text-[var(--ag-text)] truncate">{c.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {c.published ? "Publicado" : "Borrador"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
