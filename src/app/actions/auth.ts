"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Debe tener al menos 6 caracteres"),
});

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
} | null;

export async function login(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (email) {
    const attempt = loginAttempts.get(email);
    const now = Date.now();
    if (attempt) {
      if (now > attempt.resetAt) {
        loginAttempts.delete(email);
      } else if (attempt.count >= MAX_ATTEMPTS) {
        return { error: "Demasiados intentos. Inténtalo de nuevo más tarde." };
      }
    }
  }

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      error: "Por favor, corrige los errores del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const attempt = loginAttempts.get(parsed.data.email) || {
      count: 0,
      resetAt: Date.now() + LOCKOUT_MS,
    };
    attempt.count += 1;
    loginAttempts.set(parsed.data.email, attempt);
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Credenciales inválidas"
          : error.message,
    };
  }

  loginAttempts.delete(parsed.data.email);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Error inesperado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "alumno";

  if (role === "super_admin") redirect("/dashboard/super-admin");
  if (role === "admin") redirect("/dashboard/admin");
  if (role === "profesor") redirect("/dashboard/teacher");
  redirect("/dashboard/student");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "El correo es requerido" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  if (password !== confirm) return { error: "Las contraseñas no coinciden" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/login?message=Contraseña actualizada. Podés iniciar sesión.");
}

export async function registerStudent(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;
  const instituteId = (formData.get("institute_id") as string)?.trim();

  if (!fullName) return { error: "El nombre es requerido" };
  if (!email) return { error: "El correo es requerido" };
  if (!password || password.length < 6)
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  if (password !== confirm) return { error: "Las contraseñas no coinciden" };
  if (!instituteId) return { error: "Seleccioná un instituto" };

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createAdminClient();

  const { data, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "alumno", institute_id: instituteId },
  });
  if (createError) {
    if (createError.message.includes("already registered"))
      return { error: "Ya existe una cuenta con ese correo" };
    return { error: createError.message };
  }

  // Ensure institute_id is set (in case trigger didn't pick it up)
  if (data.user) {
    await adminClient
      .from("profiles")
      .update({ institute_id: instituteId })
      .eq("id", data.user.id);
  }

  redirect("/login?message=Cuenta creada. Ya podés iniciar sesión.");
}
