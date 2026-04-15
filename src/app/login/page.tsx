import { LoginForm } from "./LoginForm";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const errorMsg = params.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050F1F] px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#1A56DB] opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#38BDF8] opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] mb-4 shadow-lg shadow-[#1A56DB]/30">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            MAVIC
          </h1>
          <p className="text-[#BAE6FD] mt-1 text-sm">Plataforma Educativa</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">
            Iniciar sesión
          </h2>
          <p className="text-[#BAE6FD] text-sm mb-6">
            Ingresá con tu cuenta institucional
          </p>

          <LoginForm initialError={errorMsg} />

          {/* Role indicator */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-center text-white/40 mb-3">
              Roles disponibles
            </p>
            <div className="flex gap-2 justify-center">
              {[
                { label: "Alumno", color: "#38BDF8" },
                { label: "Profesor", color: "#1A56DB" },
                { label: "Admin", color: "#050F1F" },
              ].map((r) => (
                <span
                  key={r.label}
                  className="px-3 py-1 rounded-full text-xs font-medium border border-white/10 text-[#BAE6FD]"
                >
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} MAVIC · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}
