"use client";

import { useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { approveCertificate, rejectCertificate } from "@/app/actions/courses";
import { CertificatePreviewModal } from "@/components/ui/CertificatePreviewModal";

interface Props {
  teacherId: string;
  role: string;
}

type Status = "all" | "pending" | "approved" | "rejected";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pendiente",  cls: "bg-amber-100/60 text-amber-700 border-amber-300/50" },
  approved: { label: "Aprobado",   cls: "bg-green-100/60 text-green-700 border-green-300/50" },
  rejected: { label: "Rechazado",  cls: "bg-red-50   text-red-700   border-red-300/50"   },
};

type CertReq = {
  id: string;
  status: string;
  certificate_code: string | null;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  courses: {
    title: string;
    teacher: { signature_url: string | null } | null;
    institute: {
      name: string; logo_url: string | null;
      director_name: string | null; director_signature_url: string | null;
    } | null;
  } | null;
};

export default function CertificatesView({ teacherId, role }: Props) {
  const [activeStatus, setActiveStatus] = useState<Status>("pending");
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [previewReq, setPreviewReq] = useState<CertReq | null>(null);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["certificate_requests", teacherId, role],
    queryFn: async () => {
      const supabase = createClient();
      const { data: courses } = await supabase
        .from("courses").select("id").eq("teacher_id", teacherId);
      const courseIds = (courses ?? []).map((c: { id: string }) => c.id);
      if (!courseIds.length) return [];

      const { data, error } = await supabase
        .from("certificate_requests")
        .select(`
          id, status, certificate_code, created_at, approved_at,
          profiles!student_id ( full_name, email ),
          courses!course_id (
            title,
            teacher:profiles!teacher_id ( signature_url ),
            institute:institutes ( name, logo_url, director_name, director_signature_url )
          )
        `)
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as CertReq[];
    },
  });

  function handleApprove(id: string) {
    setActionId(id);
    startTransition(async () => {
      await approveCertificate(id);
      queryClient.invalidateQueries({ queryKey: ["certificate_requests"] });
      setActionId(null);
    });
  }

  function handleReject(id: string) {
    if (!confirm("¿Rechazar esta solicitud?")) return;
    setActionId(id);
    startTransition(async () => {
      await rejectCertificate(id);
      queryClient.invalidateQueries({ queryKey: ["certificate_requests"] });
      setActionId(null);
    });
  }

  const filtered = activeStatus === "all"
    ? requests
    : requests.filter(r => r.status === activeStatus);

  const pending  = requests.filter(r => r.status === "pending").length;
  const approved = requests.filter(r => r.status === "approved").length;

  const TABS: { key: Status; label: string; count?: number }[] = [
    { key: "pending",  label: "Pendientes", count: pending },
    { key: "approved", label: "Aprobados",  count: approved },
    { key: "rejected", label: "Rechazados" },
    { key: "all",      label: "Todos" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {previewReq && (
        <CertificatePreviewModal
          studentName={previewReq.profiles?.full_name ?? "—"}
          courseTitle={previewReq.courses?.title ?? "—"}
          instituteName={previewReq.courses?.institute?.name ?? "Instituto"}
          logoUrl={previewReq.courses?.institute?.logo_url}
          directorName={previewReq.courses?.institute?.director_name}
          directorSignatureUrl={previewReq.courses?.institute?.director_signature_url}
          teacherSignatureUrl={previewReq.courses?.teacher?.signature_url}
          code={previewReq.certificate_code}
          onClose={() => setPreviewReq(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--ag-text)]">Certificados</h1>
        <p className="text-[var(--ag-text-muted)] mt-1">
          Gestioná las solicitudes de certificado de tus alumnos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Pendientes", value: pending,          color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
          { label: "Aprobados",  value: approved,         color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
          { label: "Total",      value: requests.length,  color: "var(--ag-navy)", bg: "#EFF6FF", border: "#BFDBFE" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 border" style={{ background: s.bg, borderColor: s.border }}>
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm font-medium mt-1" style={{ color: s.color + "99" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 mb-6 p-1 bg-black/[0.03] rounded-xl flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveStatus(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeStatus === t.key
                ? "bg-[var(--ag-surface)] text-[var(--ag-text)] shadow-sm"
                : "text-[var(--ag-text-muted)] hover:text-[var(--ag-text)]"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                t.key === "pending" ? "bg-amber-500 text-white" : "bg-[var(--ag-navy)] text-white"
              }`}>
                {t.count > 9 ? "9+" : t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--ag-surface)] rounded-xl border border-[var(--ag-border-light)] p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--ag-border-light)] p-10 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-[var(--ag-text-muted)] text-sm">
            {activeStatus === "pending"
              ? "No hay solicitudes pendientes."
              : "No hay solicitudes en esta categoría."}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--ag-surface)] rounded-2xl border border-[var(--ag-border-light)] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--ag-surface)] border-b border-[var(--ag-border-light)]">
              <tr>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Alumno</th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Curso</th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Estado</th>
                <th className="text-left px-5 py-3 text-[var(--ag-text-muted)] font-medium">Fecha</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ag-border-light)]">
              {filtered.map(req => {
                const st = STATUS_LABEL[req.status] ?? STATUS_LABEL.pending;
                const isActing = isPending && actionId === req.id;
                return (
                  <tr key={req.id} className="hover:bg-[var(--ag-surface)]/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[var(--ag-text)]">{req.profiles?.full_name ?? "—"}</p>
                      <p className="text-xs text-[var(--ag-text-muted)]">{req.profiles?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--ag-text)]/70 text-xs">
                      {req.courses?.title ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--ag-text-muted)]">
                      {new Date(req.created_at).toLocaleDateString("es-AR", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setPreviewReq(req)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgba(30,58,95,0.06)] text-[var(--ag-navy)] border border-[var(--ag-border-light)] hover:bg-[var(--ag-border-light)]/40 transition-all"
                        >
                          Vista previa
                        </button>
                        {req.status === "approved" && req.certificate_code && (
                          <a
                            href={`/certificates/${req.certificate_code}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100/60 text-green-700 border border-green-300/50 hover:bg-green-200/60 transition-all"
                          >
                            Ver →
                          </a>
                        )}
                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={isActing}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100/60 text-green-700 border border-green-300/50 hover:bg-green-200/60 transition-all disabled:opacity-50"
                            >
                              {isActing ? "..." : "Aprobar"}
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={isActing}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100/60 text-red-600 border border-red-300/50 hover:bg-red-200/60 transition-all disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
