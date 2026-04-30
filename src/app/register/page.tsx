import { createClient } from "@/lib/supabase/server";
import RegisterForm from "./RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: institutes } = await supabase
    .from("institutes")
    .select("id, name")
    .eq("active", true)
    .order("name");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050F1F] px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#1A56DB] opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#38BDF8] opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] mb-4 shadow-lg shadow-[#1A56DB]/30">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Agorify</h1>
          <p className="text-[#BAE6FD] mt-1 text-sm">Plataforma Educativa</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Crear cuenta</h2>
          <p className="text-[#BAE6FD] text-sm mb-6">
            Registrate como alumno en tu instituto.
          </p>
          <RegisterForm institutes={institutes ?? []} />
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Agorify · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
