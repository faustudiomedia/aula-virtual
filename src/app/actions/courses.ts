"use server";

import { createClient } from "@/lib/supabase/server";

// ─── Result types for server actions ───────────────────────────
export type ActionResult =
  | { success: true }
  | { success: false; error: string };

// Compatible with React's useActionState
export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// ─── COURSES ────────────────────────────────────────────────────

export async function createCourse(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("institute_id, role")
      .eq("id", user.id)
      .single();
    if (profileError || !profile)
      return { success: false, error: "Perfil no encontrado" };

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { success: false, error: "El título es requerido" };

    // super_admin can provide explicit institute_id and teacher_id
    const isSuperAdmin = profile.role === "super_admin";
    const instituteId = isSuperAdmin
      ? (formData.get("institute_id") as string) || null
      : profile.institute_id;
    // Super admin: use provided teacher_id, or fallback to self (so they can create courses as a teacher)
    const teacherId = isSuperAdmin
      ? (formData.get("teacher_id") as string) || user.id
      : user.id;

    const { error } = await supabase.from("courses").insert({
      title,
      description: (formData.get("description") as string)?.trim() || null,
      teacher_id: teacherId,
      institute_id: instituteId,
      published: formData.get("published") === "on",
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al crear el curso" };
  }
}

export async function updateCourse(
  courseId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { success: false, error: "El título es requerido" };

    const { error } = await supabase
      .from("courses")
      .update({
        title,
        description: (formData.get("description") as string)?.trim() || null,
        published: formData.get("published") === "on",
      })
      .eq("id", courseId)
      .eq("teacher_id", user.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al actualizar el curso" };
  }
}

export async function deleteCourse(courseId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId)
      .eq("teacher_id", user.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al eliminar el curso" };
  }
}

// ─── MATERIALS ──────────────────────────────────────────────────

export async function addMaterial(
  courseId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { success: false, error: "El título es requerido" };

    // Verify user is the course teacher
    const { data: course } = await supabase
      .from("courses").select("teacher_id").eq("id", courseId).single();
    if (!course || course.teacher_id !== user.id)
      return { success: false, error: "Sin permisos para agregar materiales" };

    const { error } = await supabase.from("materials").insert({
      course_id: courseId,
      title,
      description: (formData.get("description") as string)?.trim() || null,
      file_url: (formData.get("file_url") as string)?.trim() || null,
      file_type: (formData.get("file_type") as string) || null,
      order_index: Number(formData.get("order_index") ?? 0),
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al agregar el material" };
  }
}

export async function updateMaterial(
  materialId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { success: false, error: "El título es requerido" };

    // Verify ownership: material → course → teacher
    const { data: material } = await supabase
      .from("materials").select("course_id").eq("id", materialId).single();
    if (!material) return { success: false, error: "Material no encontrado" };
    const { data: course } = await supabase
      .from("courses").select("teacher_id").eq("id", material.course_id).single();
    if (!course || course.teacher_id !== user.id)
      return { success: false, error: "Sin permisos para editar este material" };

    const { error } = await supabase
      .from("materials")
      .update({
        title,
        description: (formData.get("description") as string)?.trim() || null,
        file_url: (formData.get("file_url") as string)?.trim() || null,
        file_type: (formData.get("file_type") as string) || null,
        order_index: Number(formData.get("order_index") ?? 0),
      })
      .eq("id", materialId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return {
      success: false,
      error: "Error inesperado al actualizar el material",
    };
  }
}

export async function deleteMaterial(
  materialId: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    // Verify ownership through course
    const { data: material } = await supabase
      .from("materials").select("course_id").eq("id", materialId).single();
    if (!material) return { success: false, error: "Material no encontrado" };
    const { data: course } = await supabase
      .from("courses").select("teacher_id").eq("id", material.course_id).single();
    if (!course || course.teacher_id !== user.id)
      return { success: false, error: "Sin permisos para eliminar este material" };

    const { error } = await supabase
      .from("materials")
      .delete()
      .eq("id", materialId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return {
      success: false,
      error: "Error inesperado al eliminar el material",
    };
  }
}

// ─── ENROLLMENTS ────────────────────────────────────────────────

export async function enrollInCourse(courseId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const { error } = await supabase.from("enrollments").insert({
      student_id: user.id,
      course_id: courseId,
      progress: 0,
      completed: false,
    });
    if (error) {
      if (error.code === "23505")
        return { success: false, error: "Ya estás inscripto en este curso" };
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al inscribirse" };
  }
}

export async function unenrollFromCourse(
  courseId: string,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("student_id", user.id)
      .eq("course_id", courseId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al desinscribirse" };
  }
}

export async function updateMaterialProgress(
  enrollmentId: string,
  materialsSeen: number,
  totalMaterials: number,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const progress =
      totalMaterials > 0
        ? Math.round((materialsSeen / totalMaterials) * 100)
        : 0;
    const completed = progress >= 100;

    const { error } = await supabase
      .from("enrollments")
      .update({ progress, completed })
      .eq("id", enrollmentId)
      .eq("student_id", user.id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return {
      success: false,
      error: "Error inesperado al actualizar el progreso",
    };
  }
}

// ─── MATERIAL COMPLETIONS ───────────────────────────────────────

export async function toggleMaterialCompletion(
  materialId: string,
  courseId: string,
): Promise<ActionResult & { nowCompleted: boolean }> {
  const fallback = { success: false as const, error: "", nowCompleted: false };
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return { ...fallback, error: "No autenticado" };

    // Check if already completed
    const { data: existing } = await supabase
      .from("material_completions")
      .select("student_id")
      .eq("student_id", user.id)
      .eq("material_id", materialId)
      .maybeSingle();

    let nowCompleted: boolean;

    if (existing) {
      const { error } = await supabase
        .from("material_completions")
        .delete()
        .eq("student_id", user.id)
        .eq("material_id", materialId);
      if (error) return { ...fallback, error: error.message };
      nowCompleted = false;
    } else {
      const { error } = await supabase
        .from("material_completions")
        .insert({ student_id: user.id, material_id: materialId });
      if (error) return { ...fallback, error: error.message };
      nowCompleted = true;
    }

    // Recalculate and persist enrollment progress
    const { data: totalData } = await supabase
      .from("materials")
      .select("id")
      .eq("course_id", courseId);

    const { data: doneData } = await supabase
      .from("material_completions")
      .select("material_id")
      .eq("student_id", user.id)
      .in(
        "material_id",
        (totalData ?? []).map((m: { id: string }) => m.id),
      );

    const total = totalData?.length ?? 0;
    const done = doneData?.length ?? 0;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    await supabase
      .from("enrollments")
      .update({ progress, completed: progress >= 100 })
      .eq("student_id", user.id)
      .eq("course_id", courseId);

    return { success: true, nowCompleted };
  } catch (_e) {
    return { ...fallback, error: "Error inesperado" };
  }
}

// ─── INSTITUTES ─────────────────────────────────────────────────

export async function createInstitute(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)
      ?.toLowerCase()
      .replace(/\s+/g, "-")
      .trim();
    if (!name) return { success: false, error: "El nombre es requerido" };
    if (!slug) return { success: false, error: "El slug es requerido" };

    const { error } = await supabase.from("institutes").insert({
      name,
      slug,
      domain: (formData.get("domain") as string)?.trim() || null,
      primary_color: (formData.get("primary_color") as string) || "#1A56DB",
      secondary_color: (formData.get("secondary_color") as string) || "#38BDF8",
      active: true,
    });
    if (error) {
      if (error.code === "23505")
        return {
          success: false,
          error: "Ya existe un instituto con ese slug o dominio",
        };
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al crear el instituto" };
  }
}
