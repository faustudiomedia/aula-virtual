"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCalendarEvent(_prev: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles").select("role, institute_id").eq("id", user.id).single();

  if (!profile || !["profesor", "admin", "super_admin"].includes(profile.role))
    return { error: "Sin permisos" };

  const title      = formData.get("title") as string;
  const event_date = formData.get("event_date") as string;
  const event_time = (formData.get("event_time") as string) || null;
  const description = (formData.get("description") as string) || null;
  const color      = (formData.get("color") as string) || "#1A56DB";

  if (!title || !event_date) return { error: "Título y fecha son obligatorios" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("calendar_events").insert({
    title, event_date, event_time, description, color,
    institute_id: profile.institute_id,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/teacher/calendar");
  revalidatePath("/dashboard/student/calendar");
  return { success: true };
}

export async function deleteCalendarEvent(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("calendar_events").delete().eq("id", id);

  revalidatePath("/dashboard/teacher/calendar");
  revalidatePath("/dashboard/student/calendar");
}
