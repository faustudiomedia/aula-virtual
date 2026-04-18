import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function updateInstitute(instituteId: string, formData: FormData) {
  "use server";
  const supabase = await createClient();

  await supabase
    .from("institutes")
    .update({
      name: formData.get("name") as string,
      domain: (formData.get("domain") as string) || null,
      primary_color: formData.get("primary_color") as string,
      secondary_color: formData.get("secondary_color") as string,
      active: formData.get("active") === "on",
    })
    .eq("id", instituteId);

  redirect("/dashboard/admin");
}

interface Props {
  params: Promise<{ instituteId: string }>;
}

export default async function InstituteDetailPage({ params }: Props) {
  const { instituteId } = await params;
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
  if (profile?.role !== "admin" && profile?.role !== "super_admin") redirect("/dashboard/admin");

  const { data: institute } = await supabase
    .from("institutes")
    .select("*")
    .eq("id", instituteId)
    .single();

  if (!institute) notFound();

  // Stats
  const { data: members } = await supabase
    .from("profiles")
    .select("role")
    .eq("institute_id", instituteId);

  const students = (members ?? []).filter(
    (m: { role: string }) => m.role === "alumno",
  ).length;
  const teachers = (members ?? []).filter(
    (m: { role: string }) => m.role === "profesor",
  ).length;

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, published")
    .eq("institute_id", instituteId);

  const courseList = courses ?? [];
  const boundUpdate = updateInstitute.bind(null, instituteId);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <a
        href="/dashboard/admin"
        className="text-[#1A56DB] hover:underline text-sm"
      >
        ← Institutos
      </a>
      <h1 className="text-2xl font-bold text-[#050F1F] mt-3 mb-1">
        Editar instituto
      </h1>
      <p className="text-[#050F1F]/50 mb-6">
        Actualizá los datos y el branding del instituto.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Alumnos",
            value: students,
            bg: "#EFF6FF",
            color: "#1A56DB",
          },
          {
            label: "Profesores",
            value: teachers,
            bg: "#F5F3FF",
            color: "#7C3AED",
          },
          {
            label: "Cursos",
            value: courseList.length,
            bg: "#FFFBEB",
            color: "#D97706",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 border border-black/5"
            style={{ background: s.bg }}
          >
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs text-[#050F1F]/50 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 mb-6">
        <form action={boundUpdate} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
                Nombre *
              </label>
              <input
                name="name"
                required
                defaultValue={institute.name}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
                Slug
              </label>
              <input
                value={institute.slug}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm bg-black/5 text-[#050F1F]/50 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
              Dominio personalizado
            </label>
            <input
              name="domain"
              defaultValue={institute.domain ?? ""}
              placeholder="Ej: miinstituto.edu.ar"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
                Color primario
              </label>
              <input
                type="color"
                name="primary_color"
                defaultValue={institute.primary_color}
                className="w-full h-10 rounded-xl border border-black/10 cursor-pointer p-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#050F1F] mb-1.5">
                Color secundario
              </label>
              <input
                type="color"
                name="secondary_color"
                defaultValue={institute.secondary_color}
                className="w-full h-10 rounded-xl border border-black/10 cursor-pointer p-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              name="active"
              defaultChecked={institute.active}
              className="w-4 h-4 rounded accent-[#1A56DB]"
            />
            <label
              htmlFor="active"
              className="text-sm font-medium text-[#050F1F]"
            >
              Instituto activo
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-[#1A56DB]/20"
          >
            Guardar cambios
          </button>
        </form>
      </div>

      {/* Courses list */}
      <h2 className="text-base font-semibold text-[#050F1F] mb-3">
        Cursos del instituto
      </h2>
      {courseList.length === 0 ? (
        <p className="text-sm text-[#050F1F]/40">Sin cursos.</p>
      ) : (
        <div className="space-y-2">
          {courseList.map((c: { id: string; title: string; published: boolean }) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-black/5 px-4 py-3 flex items-center justify-between text-sm"
            >
              <span className="font-medium text-[#050F1F]">{c.title}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.published
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {c.published ? "Publicado" : "Borrador"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
