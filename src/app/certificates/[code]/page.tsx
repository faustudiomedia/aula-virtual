import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "./PrintButton";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certificate_requests")
    .select(`
      id, certificate_code, approved_at, status,
      student:profiles!student_id ( full_name ),
      course:courses!course_id (
        title,
        teacher:profiles!teacher_id ( full_name, signature_url ),
        institute:institutes ( name, logo_url, director_name, director_signature_url )
      )
    `)
    .eq("certificate_code", code)
    .eq("status", "approved")
    .single();

  if (!cert) notFound();

  type CertData = typeof cert & {
    student: { full_name: string } | null;
    course: {
      title: string;
      teacher: { full_name: string; signature_url: string | null } | null;
      institute: {
        name: string; logo_url: string | null;
        director_name: string | null; director_signature_url: string | null;
      } | null;
    } | null;
  };

  const c = cert as CertData;
  const studentName = c.student?.full_name ?? "—";
  const courseTitle = c.course?.title ?? "—";
  const instituteName = c.course?.institute?.name ?? "Instituto";
  const logoUrl = c.course?.institute?.logo_url ?? null;
  const directorName = c.course?.institute?.director_name ?? null;
  const directorSignatureUrl = c.course?.institute?.director_signature_url ?? null;
  const teacherName = c.course?.teacher?.full_name ?? null;
  const teacherSignatureUrl = c.course?.teacher?.signature_url ?? null;
  const approvedAt = c.approved_at
    ? new Date(c.approved_at).toLocaleDateString("es-AR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EFF6FF] via-white to-[#F0FDF4] flex items-center justify-center p-6 print:p-0 print:bg-white">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl print:shadow-none print:rounded-none overflow-hidden border border-black/5"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-[#1A56DB] via-[#38BDF8] to-[#059669]" />

        <div className="px-12 py-14 print:px-10 print:py-10">
          {/* Institute header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={instituteName} className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] flex items-center justify-center text-white font-bold text-2xl">
                  {instituteName.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-[#050F1F] text-lg leading-none">{instituteName}</p>
                <p className="text-xs text-[#050F1F]/40 mt-1 tracking-widest uppercase">Plataforma Educativa</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#050F1F]/30 uppercase tracking-widest">Código</p>
              <p className="text-sm font-mono font-bold text-[#1A56DB] mt-0.5">{code}</p>
            </div>
          </div>

          {/* Certificate title */}
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.25em] text-[#1A56DB] font-semibold mb-3">
              Certificado de Finalización
            </p>
            <p className="text-[#050F1F]/40 text-sm">Este certificado acredita que</p>

            <h1 className="text-4xl font-bold text-[#050F1F] mt-4 mb-4 leading-tight">
              {studentName}
            </h1>

            <p className="text-[#050F1F]/50 text-sm">ha completado satisfactoriamente el curso</p>

            <h2 className="text-2xl font-bold text-[#1A56DB] mt-3 mb-2">
              {courseTitle}
            </h2>

            <p className="text-sm text-[#050F1F]/40">
              emitido el <span className="font-semibold text-[#050F1F]/60">{approvedAt}</span>
            </p>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#1A56DB]/20" />
            <div className="w-2 h-2 rounded-full bg-[#1A56DB]/30" />
            <div className="w-3 h-3 rounded-full bg-[#1A56DB]/50" />
            <div className="w-2 h-2 rounded-full bg-[#1A56DB]/30" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#1A56DB]/20" />
          </div>

          {/* Signatures row */}
          <div className="flex items-end justify-between mt-8 gap-4">
            {/* Director signature */}
            <div className="text-center">
              {directorSignatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={directorSignatureUrl}
                  alt="Firma director/a"
                  className="h-14 max-w-[160px] object-contain mx-auto mb-1 mix-blend-multiply"
                />
              ) : (
                <div className="w-40 h-10 mb-1" />
              )}
              <div className="w-40 border-b border-[#050F1F]/20 mb-1.5" />
              <p className="text-xs text-[#050F1F]/50">{directorName ?? "Director/a"}</p>
              <p className="text-[10px] text-[#050F1F]/30 uppercase tracking-widest mt-0.5">
                {instituteName}
              </p>
            </div>

            {/* Verification seal */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-16 h-16 rounded-full border-2 border-[#1A56DB]/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border border-[#1A56DB]/20 flex items-center justify-center">
                  <span className="text-lg">🎓</span>
                </div>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-[#050F1F]/30 text-center">
                Verificado
              </p>
            </div>

            {/* Teacher signature */}
            {teacherName && (
              <div className="text-center">
                {teacherSignatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={teacherSignatureUrl}
                    alt="Firma docente"
                    className="h-14 max-w-[160px] object-contain mx-auto mb-1 mix-blend-multiply"
                  />
                ) : (
                  <div className="w-40 h-10 mb-1" />
                )}
                <div className="w-40 border-b border-[#050F1F]/20 mb-1.5" />
                <p className="text-xs text-[#050F1F]/50">{teacherName}</p>
                <p className="text-[10px] text-[#050F1F]/30 uppercase tracking-widest mt-0.5">
                  Docente
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-12 py-4 bg-[#F8FAFC] border-t border-black/5 flex items-center justify-between print:hidden">
          <p className="text-[10px] text-[#050F1F]/30">
            Verificá la autenticidad en <span className="font-mono">/certificates/{code}</span>
          </p>
          <PrintButton />
        </div>
      </div>
    </div>
  );
}
