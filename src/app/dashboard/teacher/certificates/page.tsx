import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CertificatesTable from "./CertificatesTable";

export default async function TeacherCertificatesPage() {
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

  if (profile?.role !== "profesor") redirect("/dashboard");

  // Fetch certificate requests for courses taught by this teacher
  const { data: requests } = await supabase
    .from("certificate_requests")
    .select(`
      id,
      status,
      created_at,
      profiles ( full_name, email ),
      courses!inner ( id, title, teacher_id )
    `)
    .eq("courses.teacher_id", user.id)
    .order("created_at", { ascending: false });

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
        <h1 className="text-2xl font-bold text-[var(--ag-text)] mb-2">Solicitudes de Certificados</h1>
        <p className="text-[var(--ag-text-muted)] text-sm">
          Aprobá o rechazá los certificados solicitados por los alumnos que finalizaron tus cursos al 100%.
        </p>
      </div>

      <div className="bg-[var(--ag-surface)] border border-[var(--ag-border-light)] rounded-2xl shadow-sm overflow-hidden">
        <CertificatesTable requests={mappedRequests} />
      </div>
    </div>
  );
}
