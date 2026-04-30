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

    const moduleNum = formData.get("module_number");
    const { error } = await supabase.from("materials").insert({
      course_id: courseId,
      title,
      description: (formData.get("description") as string)?.trim() || null,
      file_url: (formData.get("file_url") as string)?.trim() || null,
      file_type: (formData.get("file_type") as string) || null,
      order_index: Number(formData.get("order_index") ?? 0),
      module_number: moduleNum ? Number(moduleNum) : null,
      module_title: (formData.get("module_title") as string)?.trim() || null,
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

// ─── BULK ENROLLMENTS ───────────────────────────────────────────

export async function bulkEnrollStudents(
  courseId: string,
  students: { email: string; full_name: string; dni: string }[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    // Verify user is teacher or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (!profile || (profile.role !== "profesor" && profile.role !== "admin" && profile.role !== "super_admin")) {
      return { success: false, error: "No tenés permiso para inscribir alumnos masivamente." };
    }

    const { data: course } = await supabase
      .from("courses")
      .select("institute_id")
      .eq("id", courseId)
      .single();
      
    if (!course) return { success: false, error: "Curso no encontrado." };

    const { createAdminClient } = await import("@/lib/supabase/admin");
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch {
      return { success: false, error: "Error de configuración del servidor (SUPABASE_SERVICE_ROLE_KEY)." };
    }

    let newUsers = 0;
    let enrolledUsers = 0;

    for (const student of students) {
      const email = student.email.toLowerCase().trim();
      if (!email) continue;
      
      let { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
        
      let studentId = existingProfile?.id;

      if (!studentId) {
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: email,
          password: student.dni, // Use DNI as password for imported students
          email_confirm: true,
          user_metadata: { full_name: student.full_name, role: "alumno", institute_id: course.institute_id },
        });

        if (authError) {
          console.error("Error creating user", email, authError);
          continue; // Skip silently if fails (eg. email taken but missing from profiles?)
        }

        studentId = authData.user?.id;
        if (!studentId) continue;
        
        await adminClient.from("profiles").upsert({
          id: studentId,
          email: email,
          full_name: student.full_name,
          legajo: student.dni,
          role: "alumno",
          institute_id: course.institute_id
        });

        newUsers++;
      } else {
        // Update DNI/Legajo if they don't have one and were provided one
        await adminClient.from("profiles").update({ legajo: student.dni }).eq("id", studentId).is("legajo", null);
      }

      const { error: enrollError } = await adminClient.from("enrollments").insert({
        student_id: studentId,
        course_id: courseId,
        progress: 0,
        completed: false,
      });

      if (!enrollError) {
        enrolledUsers++;
      }
    }

    const { revalidatePath } = await import("next/cache");
    revalidatePath(`/dashboard/teacher/courses/${courseId}/students`);
    revalidatePath(`/dashboard/admin/courses/${courseId}/students`);

    return { 
      success: true, 
      message: `Proceso completado. ${enrolledUsers} inscripciones exitosas (${newUsers} cuentas nuevas creadas).` 
    };

  } catch (error: any) {
    console.error("bulkEnrollStudents error:", error);
    return { success: false, error: "Error inesperado procesando el Excel." };
  }
}

// ─── CERTIFICATES ───────────────────────────────────────────────

export async function requestCertificate(courseId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    // Validar que realmente completó el curso al 100%
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("completed")
      .eq("course_id", courseId)
      .eq("student_id", user.id)
      .single();

    if (!enrollment || !enrollment.completed) {
      return { success: false, error: "Debes completar el 100% del curso primero." };
    }

    // Insertar request (si ya existe, ignorará por Unique pero lanzará error)
    const { error } = await supabase
      .from("certificate_requests")
      .insert({
        student_id: user.id,
        course_id: courseId,
        status: 'pending'
      });
    
    if (error) {
       // Code 23505 is unique violation in Postgres
       if (error.code === '23505') {
          return { success: true }; // Ya estaba solicitado
       }
       return { success: false, error: error.message };
    }

    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado al solicitar certificado" };
  }
}


export async function approveCertificate(requestId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();

    // Load request to check permissions
    const { data: req } = await supabase
      .from("certificate_requests")
      .select("id, course_id, status")
      .eq("id", requestId)
      .single();
    if (!req) return { success: false, error: "Solicitud no encontrada" };

    // Verify teacher owns the course or admin/super_admin
    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      const { data: course } = await supabase
        .from("courses").select("teacher_id").eq("id", req.course_id).single();
      if (course?.teacher_id !== user.id)
        return { success: false, error: "Sin permisos" };
    }

    // Generate a unique readable code: AGFY-XXXXXX
    const code = "AGFY-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
      .from("certificate_requests")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        certificate_code: code,
      })
      .eq("id", requestId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado" };
  }
}

export async function rejectCertificate(requestId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { success: false, error: "No autenticado" };

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();

    const { data: req } = await supabase
      .from("certificate_requests")
      .select("id, course_id")
      .eq("id", requestId)
      .single();
    if (!req) return { success: false, error: "Solicitud no encontrada" };

    if (profile?.role !== "admin" && profile?.role !== "super_admin") {
      const { data: course } = await supabase
        .from("courses").select("teacher_id").eq("id", req.course_id).single();
      if (course?.teacher_id !== user.id)
        return { success: false, error: "Sin permisos" };
    }

    const { error } = await supabase
      .from("certificate_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (_e) {
    return { success: false, error: "Error inesperado" };
  }
}
