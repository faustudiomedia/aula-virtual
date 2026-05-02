import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";

interface Props {
  searchParams: Promise<{ token_hash?: string; type?: string; error?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token_hash, type, error } = await searchParams;

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error)}`);
  }

  if (token_hash && type === "recovery") {
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: "recovery",
    });
    if (verifyError) {
      redirect("/forgot-password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--ag-text)] px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[var(--ag-navy)] opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[var(--ag-navy)] opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--ag-navy)] mb-4 shadow-lg ">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Agorify</h1>
          <p className="text-white/80 mt-1 text-sm">Plataforma Educativa</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">Nueva contraseña</h2>
          <p className="text-white/80 text-sm mb-6">Elegí una contraseña segura para tu cuenta.</p>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
