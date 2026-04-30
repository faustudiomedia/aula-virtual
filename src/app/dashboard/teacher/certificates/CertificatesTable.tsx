"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveCertificate, rejectCertificate } from "@/app/actions/courses";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Request {
  id: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface Props {
  requests: Request[];
}

export default function CertificatesTable({ requests }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleAction(id: string, action: "approve" | "reject") {
    startTransition(async () => {
      const result = action === "approve" 
         ? await approveCertificate(id) 
         : await rejectCertificate(id);
         
      if (!result.success) {
        toast.error(`Error: ${result.error}`);
      } else {
        toast.success(action === "approve" ? "Certificado aprobado y emitido" : "Solicitud rechazada");
        router.refresh();
      }
    });
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-[#050F1F]/40 text-sm">
        No hay solicitudes de certificados por el momento.
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-[#F9FAFB] border-b border-black/5">
          <th className="px-6 py-4 text-xs font-bold text-[#050F1F]/50 uppercase">Alumno</th>
          <th className="px-6 py-4 text-xs font-bold text-[#050F1F]/50 uppercase">Curso</th>
          <th className="px-6 py-4 text-xs font-bold text-[#050F1F]/50 uppercase">Fecha</th>
          <th className="px-6 py-4 text-xs font-bold text-[#050F1F]/50 uppercase">Estado</th>
          <th className="px-6 py-4 text-xs font-bold text-[#050F1F]/50 uppercase text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((req) => (
          <tr key={req.id} className="border-b border-black/5 last:border-0 hover:bg-black/5 transition-colors">
            <td className="px-6 py-4">
              <p className="font-semibold text-sm text-[#050F1F]">{req.studentName}</p>
              <p className="text-xs text-[#050F1F]/50">{req.studentEmail}</p>
            </td>
            <td className="px-6 py-4">
              <span className="text-sm text-[#050F1F] font-medium">{req.courseTitle}</span>
            </td>
            <td className="px-6 py-4">
              <span className="text-xs text-[#050F1F]/60">
                {new Date(req.createdAt).toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </td>
            <td className="px-6 py-4">
              {req.status === "pending" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                  <Clock size={14} /> Pendiente
                </span>
              )}
              {req.status === "approved" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                  <CheckCircle2 size={14} /> Emitido
                </span>
              )}
              {req.status === "rejected" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                  <XCircle size={14} /> Rechazado
                </span>
              )}
            </td>
            <td className="px-6 py-4 text-right">
              {req.status === "pending" && (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg border border-black/10 text-xs font-bold text-[#050F1F]/60 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "approve")}
                    disabled={isPending}
                    className="px-3 py-1.5 rounded-lg bg-[#1A56DB] text-white text-xs font-bold hover:bg-[#1A56DB]/90 shadow-sm transition-colors disabled:opacity-50"
                  >
                    Aprobar y Emitir
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
