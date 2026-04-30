import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CertificatesTable from "../../teacher/certificates/CertificatesTable";

export default async function AdminCertificatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, institute_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  // Fetch certificate requests. If admin, only for their institute.
  let query = supabase
    .from("certificate_requests")
    .select(`
      id,
      status,
      created_at,
      profiles!student_id ( full_name, email ),
      courses!inner ( id, title, institute_id )
    `)
    .order("created_at", { ascending: false });

  if (profile.role === "admin" && profile.institute_id) {
    query = query.eq("courses.institute_id", profile.institute_id);
  }

  const { data: requests } = await query;

  // Map the response so it's easier to use in the client component
  const mappedRequests = (requests || []).map((req: any) => ({
    id: req.id,
    studentName: req.profiles?.full_name || "Sin nombre",
    studentEmail: req.profiles?.email || "",
    courseTitle: req.courses?.title || "Curso desconocido",
    status: req.status,
    createdAt: req.created_at,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#050F1F] mb-2">Administración de Certificados</h1>
        <p className="text-[#050F1F]/50 text-sm">
          Aprobá o rechazá los certificados solicitados por los alumnos en la institución.
        </p>
      </div>

      <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
        <CertificatesTable requests={mappedRequests} />
      </div>
    </div>
  );
}
