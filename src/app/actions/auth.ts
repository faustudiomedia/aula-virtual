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

  if (role === "admin") redirect("/dashboard/admin");
  if (role === "profesor") redirect("/dashboard/teacher");
  redirect("/dashboard/student");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
