import { LoginForm } from "./LoginForm";
import { createClient } from "@/lib/supabase/server";
import { AgorifyLogo } from "@/components/ui/AgorifyLogo";

interface Props {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMsg = params.error;
  const successMsg = params.message;

  const supabase = await createClient();
  const { data: institutes } = await supabase
    .from("institutes")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--ag-bg)" }}>

      {/* ── Card contenedor ── */}
      <div className="w-full max-w-[900px] flex rounded-2xl overflow-hidden shadow-xl"
        style={{ border: "1px solid var(--ag-border-light)" }}>

        {/* ── Panel izquierdo (Navy) ── */}
        <div className="hidden md:flex flex-col justify-between w-80 flex-shrink-0 p-10"
          style={{ background: "var(--ag-navy)" }}>

          {/* Brand */}
          <div className="flex items-center gap-3">
            <AgorifyLogo size={40} variant="full" theme="light" showSub={true} />
          </div>

          {/* Quote */}
          <div>
            <p className="text-sm leading-relaxed italic" style={{ color: "var(--ag-sidebar-muted)" }}>
              &ldquo;El conocimiento es el único bien que crece cuando se comparte.&rdquo;
            </p>
            <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>
              Plataforma educativa institucional
            </p>
          </div>
        </div>

        {/* ── Panel derecho (Formulario) ── */}
        <div className="flex-1 bg-white p-10 flex flex-col justify-center">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <AgorifyLogo size={32} variant="full" theme="dark" />
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--ag-text)" }}>
            Iniciar sesión
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--ag-text-muted)" }}>
            Ingresá con tu cuenta institucional
          </p>

          {successMsg && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm"
              style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" }}>
              {successMsg}
            </div>
          )}

          <LoginForm initialError={errorMsg} institutes={institutes ?? []} />

          <p className="text-xs text-center mt-8" style={{ color: "var(--ag-text-light)" }}>
            © {new Date().getFullYear()} Agorify · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
