import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EditUserForm from "./EditUserForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: Props) {
  const { id: userId } = await params;
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

  // Load target user profile
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("*, institutes(name)")
    .eq("id", userId)
    .single();

  if (!targetProfile) redirect("/dashboard/super-admin/users");

  // Load institutes for dropdown
  const { data: institutes } = await supabase
    .from("institutes")
    .select("id, name")
    .eq("active", true)
    .order("name");
  const instituteList = institutes ?? [];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/super-admin/users"
          className="text-[#050F1F]/40 hover:text-[#050F1F] transition-colors text-sm"
        >
          ← Usuarios
        </Link>
        <span className="text-[#050F1F]/20">/</span>
        <span className="text-sm text-[#050F1F]/60 truncate">
          {targetProfile.full_name || targetProfile.email}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#050F1F]">Editar usuario</h1>
        <p className="text-[#050F1F]/50 mt-1">{targetProfile.email}</p>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
        <EditUserForm profile={targetProfile} institutes={instituteList} />
      </div>
    </div>
  );
}
