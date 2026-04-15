import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import SuperAdminCoursesView from "./SuperAdminCoursesView";

export default async function SuperAdminCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/dashboard");

  return (
    <Suspense
      fallback={
        <div className="p-8 max-w-6xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="h-64 bg-white rounded-2xl border border-black/5" />
        </div>
      }
    >
      <SuperAdminCoursesView />
    </Suspense>
  );
}
