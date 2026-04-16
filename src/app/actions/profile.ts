"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./courses";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const fullName = (formData.get("full_name") as string)?.trim();
    if (!fullName) return { success: false, error: "El nombre es requerido" };

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        avatar_url: (formData.get("avatar_url") as string)?.trim() || null,
      })
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al actualizar el perfil" };
  }
}
