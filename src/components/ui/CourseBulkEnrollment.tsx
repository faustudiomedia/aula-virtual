"use client";

import { useState, useRef, useTransition } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { bulkEnrollStudents } from "@/app/actions/courses";

export interface BulkStudentRow {
  email: string;
  full_name: string;
  dni: string;
}

interface ExportRow {
  "Nombre Completo": string;
  Email: string;
  Legajo: string;
  Progreso: string;
  Estado: string;
  "Fecha Inscripción": string;
}

interface Props {
  courseId: string;
  courseTitle: string;
  currentEnrollments: Array<{
    progress: number;
    completed: boolean;
    enrolled_at: string;
    profiles: { full_name: string; email: string; legajo?: string | null } | null;
  }>;
}

export function CourseBulkEnrollment({ courseId, courseTitle, currentEnrollments }: Props) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [previewData, setPreviewData] = useState<BulkStudentRow[]>([]);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  function handleExport() {
    const dataToExport: ExportRow[] = currentEnrollments.map((e) => ({
      "Nombre Completo": e.profiles?.full_name || "Sin nombre",
      Email: e.profiles?.email || "",
      Legajo: e.profiles?.legajo || "",
      Progreso: `${e.progress}%`,
      Estado: e.completed ? "Completado" : "En curso",
      "Fecha Inscripción": new Date(e.enrolled_at).toLocaleDateString("es-AR"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alumnos");
    
    // Autofit columns approx
    const wscols = [
      { wch: 30 },
      { wch: 35 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 20 },
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, `Alumnos - ${courseTitle}.xlsx`);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorDetails(null);
    setResultMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        // Normalize data
        const parsed: BulkStudentRow[] = [];
        let errors = 0;

        json.forEach((row, i) => {
          // Aceptar variantes de columnas
          const email = (row["Email"] || row["email"] || row["Correo"] || "")?.toString().trim();
          const name = (row["Nombre Completo"] || row["Nombre"] || row["full_name"] || row["nombre"] || "")?.toString().trim();
          const dni = (row["DNI"] || row["dni"] || row["Legajo"] || row["legajo"] || row["Documento"] || "")?.toString().trim();

          if (email && name && dni) {
            parsed.push({ email, full_name: name, dni });
          } else {
             // Ignorar filas totalmente vacías
             if (email || name || dni) errors++;
          }
        });

        if (parsed.length === 0) {
          setErrorDetails("El archivo no tiene el formato correcto o está vacío. Asegurate de incluir las columnas: 'Nombre Completo', 'Email' y 'DNI'.");
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        if (errors > 0) {
           setErrorDetails(`Precaución: Se ignoraron ${errors} fila(s) porque les faltaba el Email, Nombre o DNI.`);
        }

        setPreviewData(parsed);
        setShowModal(true);
      } catch (err) {
        setErrorDetails("Error leyendo el archivo. Verificá que sea un archivo Excel válido.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleConfirmImport() {
    setErrorDetails(null);
    setResultMsg(null);

    startTransition(async () => {
      const result = await bulkEnrollStudents(courseId, previewData);
      if (result.success) {
        setResultMsg({ success: true, text: result.message || "Importación exitosa." });
        setTimeout(() => {
          setShowModal(false);
          setPreviewData([]);
        }, 3000);
      } else {
        setErrorDetails(result.error || "Ocurrió un error en el servidor.");
      }
    });
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-[var(--ag-navy)] text-[var(--ag-navy)] rounded-xl text-sm font-semibold hover:bg-[rgba(30,58,95,0.08)] transition-colors"
        >
          <Upload size={16} />
          Importar Excel
        </button>
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-black/10 text-[var(--ag-text)]/70 rounded-xl text-sm font-semibold hover:bg-black/5 transition-colors"
        >
          <Download size={16} />
          Exportar Lista
        </button>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
      </div>

      {/* Modal Confirmación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ag-text)]/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => {
                if (!isPending) setShowModal(false);
              }}
              className="absolute top-4 right-4 p-2 text-black/40 hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-[var(--ag-text)] mb-1">Confirmar Importación</h2>
            <p className="text-sm text-[var(--ag-text-muted)] mb-4">
              Se detectaron <strong>{previewData.length}</strong> alumnos válidos en el archivo.
            </p>

            {errorDetails && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-3 text-amber-800 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <p>{errorDetails}</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto mb-6 bg-[rgba(30,58,95,0.06)]/50 border border-black/5 rounded-xl p-3">
              <ul className="text-sm divide-y divide-black/5">
                {previewData.slice(0, 50).map((u, i) => (
                  <li key={i} className="py-2 flex justify-between gap-4">
                    <span className="font-medium truncate">{u.full_name}</span>
                    <span className="text-[var(--ag-text-muted)] truncate text-xs mt-0.5">{u.email}</span>
                  </li>
                ))}
                {previewData.length > 50 && (
                  <li className="py-2 text-center text-[var(--ag-text-muted)] text-xs italic">
                    ... y {previewData.length - 50} más.
                  </li>
                )}
              </ul>
            </div>

            {resultMsg && (
              <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${resultMsg.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {resultMsg.text}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--ag-text-muted)] border border-black/10 hover:bg-black/5 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isPending || !!resultMsg?.success}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[var(--ag-navy)] hover:bg-[var(--ag-navy)]/90 disabled:opacity-50 transition-colors shadow-lg "
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                {isPending ? "Procesando..." : "Importar e Inscribir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
