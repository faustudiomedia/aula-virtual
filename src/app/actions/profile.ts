"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./courses";

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const fullName = (formData.get("full_name") as string)?.trim();
    if (!fullName) return { success: false, error: "El nombre es requerido" };

    let avatarUrl: string | null | undefined = undefined

    const avatarFile = formData.get("avatar") as File | null
    if (avatarFile && avatarFile.size > 0) {
      const ext = avatarFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${user.id}.${ext}`
      const bytes = await avatarFile.arrayBuffer()

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, bytes, { contentType: avatarFile.type, upsert: true })

      if (uploadError) return { success: false, error: "Error al subir la imagen: " + uploadError.message }

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
      avatarUrl = publicUrl
    }

    const update: Record<string, unknown> = { full_name: fullName }
    if (avatarUrl !== undefined) update.avatar_url = avatarUrl

    const { error } = await supabase.from("profiles").update(update).eq("id", user.id)
    if (error) return { success: false, error: error.message }

    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al actualizar el perfil" };
  }
}
