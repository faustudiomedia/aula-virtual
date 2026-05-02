"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCourseMaterials, useMaterialCompletions } from "@/lib/hooks/use-data";
import { toggleMaterialCompletion, requestCertificate } from "@/app/actions/courses";
import ProgressBar from "@/components/ui/ProgressBar";
import { StudentCourseNavTabs } from "@/components/ui/StudentCourseNavTabs";
import type { Course, Material } from "@/lib/types";
import {
  PlayCircle, FileText, Link as LinkIcon, Image as ImageIcon,
  CheckCircle2, ChevronDown, ChevronRight, Menu, Lock, Award, ArrowLeft,
} from "lucide-react";

interface Enrollment { id: string; progress: number; completed: boolean; }
interface Props {
  course: Course;
  enrollment: Enrollment;
  userId: string;
  initialCertificateRequest?: { status: string; certificate_code: string | null } | null;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  video: PlayCircle, pdf: FileText, link: LinkIcon, image: ImageIcon,
};
const FILE_LABELS: Record<string, string> = {
  video: "VIDEO", pdf: "DOC", link: "ENLACE", image: "IMG",
};

function getEmbedUrl(url: string | null) {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
  const v = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
  if (v) return `https://player.vimeo.com/video/${v[3]}`;
  return url;
}

export default function StudentCourseDetailView({ course, enrollment, userId, initialCertificateRequest }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [localProgress, setLocalProgress] = useState(enrollment.progress);
  const [localCompleted, setLocalCompleted] = useState(enrollment.completed);
  const [pendingMaterialId, setPendingMaterialId] = useState<string | null>(null);
  const [certRequest, setCertRequest] = useState(initialCertificateRequest);
  const [certIsPending, setCertIsPending] = useState(false);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0, 1]));
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: materials = [], isLoading: loadingMaterials } = useCourseMaterials(course.id);
  const { data: completed = new Set<string>(), isLoading: loadingCompletions } =
    useMaterialCompletions(course.id, userId);
  const isLoading = loadingMaterials || loadingCompletions;

  const moduleGroups = useMemo(() => {
    const map = new Map<number, { title: string | null; materials: Material[] }>();
    materials.forEach((m: Material) => {
      const key = m.module_number ?? 0;
      if (!map.has(key)) map.set(key, { title: m.module_title ?? null, materials: [] });
      map.get(key)!.materials.push(m);
    });
    return [...map.entries()].sort(([a], [b]) => a === 0 ? 1 : b === 0 ? -1 : a - b);
  }, [materials]);

  useEffect(() => {
    if (!activeMaterialId && materials.length > 0 && !isLoading) {
      const first = materials.find((m: Material) => !completed.has(m.id)) || materials[0];
      setActiveMaterialId(first.id);
      setExpandedModules(prev => new Set([...prev, first.module_number ?? 0]));
    }
  }, [materials, completed, activeMaterialId, isLoading]);

  const activeMaterial = useMemo(() => materials.find((m: Material) => m.id === activeMaterialId), [materials, activeMaterialId]);

  function handleToggle(materialId: string) {
    setPendingMaterialId(materialId);
    startTransition(async () => {
      const result = await toggleMaterialCompletion(materialId, course.id);
      if (result.success) {
        const nextCompleted = new Set(completed);
        result.nowCompleted ? nextCompleted.add(materialId) : nextCompleted.delete(materialId);
        const newProgress = materials.length > 0 ? Math.round((nextCompleted.size / materials.length) * 100) : 0;
        setLocalProgress(newProgress);
        setLocalCompleted(newProgress >= 100);
        queryClient.invalidateQueries({ queryKey: ["material_completions", course.id, userId] });
        queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        router.refresh();
      }
      setPendingMaterialId(null);
    });
  }

  function toggleModule(modNum: number) {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(modNum) ? next.delete(modNum) : next.add(modNum);
      return next;
    });
  }

  const navigateNext = () => {
    if (!activeMaterialId) return;
    const i = materials.findIndex((m: Material) => m.id === activeMaterialId);
    if (i < materials.length - 1) {
      setActiveMaterialId(materials[i + 1].id);
      setExpandedModules(prev => new Set([...prev, materials[i + 1].module_number ?? 0]));
    }
  };

  const navigatePrev = () => {
    if (!activeMaterialId) return;
    const i = materials.findIndex((m: Material) => m.id === activeMaterialId);
    if (i > 0) {
      setActiveMaterialId(materials[i - 1].id);
      setExpandedModules(prev => new Set([...prev, materials[i - 1].module_number ?? 0]));
    }
  };

  const handleRequestCertificate = () => {
    setCertIsPending(true);
    startTransition(async () => {
      const result = await requestCertificate(course.id);
      if (result.success) setCertRequest({ status: "pending", certificate_code: null });
      setCertIsPending(false);
    });
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--ag-bg)" }}>

      {/* ── Course hero ── */}
      <div className="relative h-28 md:h-36 flex items-end overflow-hidden"
        style={{ background: "var(--ag-navy)" }}>
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 px-6 pb-5 w-full">
          <Link href="/dashboard/student/courses"
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
            <ArrowLeft size={12} /> Mis cursos
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
            {course.title}
          </h1>
        </div>
      </div>

      {/* ── Certificate banner ── */}
      {localProgress > 0 && (
        <div className="bg-[var(--ag-surface)] border-b" style={{ borderColor: "var(--ag-border-light)" }}>
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center gap-4">

            {/* Lock / Award icon */}
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: localCompleted || certRequest?.status === "approved"
                  ? "rgba(22,101,52,0.10)" : "rgba(30,58,95,0.08)",
              }}>
              {certRequest?.status === "approved"
                ? <Award size={20} style={{ color: "#166534" }} />
                : <Lock size={18} style={{ color: localCompleted ? "var(--ag-navy)" : "var(--ag-text-muted)" }} />
              }
            </div>

            {/* Text + progress */}
            <div className="flex-1 min-w-0">
              {certRequest?.status === "approved" ? (
                <p className="text-sm font-semibold" style={{ color: "#166534" }}>
                  🎉 ¡Certificado aprobado! Podés verlo y compartirlo.
                </p>
              ) : certRequest?.status === "pending" ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                  <p className="text-sm font-medium" style={{ color: "#92400E" }}>
                    Certificado en revisión — tu solicitud fue enviada al profesor.
                  </p>
                </div>
              ) : certRequest?.status === "rejected" ? (
                <p className="text-sm font-medium" style={{ color: "var(--ag-error)" }}>
                  Solicitud rechazada — contactá a tu profesor para más información.
                </p>
              ) : localCompleted ? (
                <p className="text-sm font-semibold" style={{ color: "var(--ag-navy)" }}>
                  🏆 ¡Curso completado! Podés solicitar tu certificado digital.
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--ag-text-muted)" }}>
                      <Lock size={11} className="inline mr-1 mb-0.5" />
                      Certificado — completá el 100% para desbloquearlo
                    </span>
                    <span className="font-semibold" style={{ color: "var(--ag-navy)" }}>
                      {localProgress}%
                    </span>
                  </div>
                  <div className="w-full max-w-xs h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--ag-border-light)" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${localProgress}%`, background: "var(--ag-navy)" }} />
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--ag-text-light)" }}>
                    Faltan {materials.length - completed.size} tema{materials.length - completed.size !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* CTA button */}
            {certRequest?.status === "approved" && (
              <a href={`/certificates/${certRequest.certificate_code}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: "#166534", color: "white" }}>
                <Award size={15} /> Ver certificado
              </a>
            )}
            {localCompleted && !certRequest && (
              <button onClick={handleRequestCertificate} disabled={certIsPending}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ag-btn-primary disabled:opacity-50">
                {certIsPending ? "Solicitando..." : "Solicitar certificado"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs + progress row ── */}
      <div className="bg-[var(--ag-surface)] border-b" style={{ borderColor: "var(--ag-border-light)" }}>
        <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between gap-4 text-sm">
          <StudentCourseNavTabs courseId={course.id} />
          <div className="flex items-center gap-3 py-3 flex-shrink-0">
            <div className="w-32">
              <ProgressBar value={localProgress} />
            </div>
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--ag-text-muted)" }}>
              <span className="font-bold" style={{ color: "var(--ag-text)" }}>{completed.size}</span>
              /{materials.length} temas
            </span>
          </div>
        </div>
      </div>

      {/* ── Main body: sidebar + viewer ── */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1400px] w-full mx-auto">

        {/* Mobile toggle */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden w-full px-6 py-3 flex items-center gap-2 text-sm font-medium border-b"
          style={{
            background: "var(--ag-surface-alt)",
            color: "var(--ag-navy)",
            borderColor: "var(--ag-border-light)",
          }}>
          <Menu size={16} />
          {sidebarOpen ? "Ocultar temario" : "Mostrar temario"}
        </button>

        {/* ── SIDEBAR (temario) ── */}
        <aside className={`${sidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-72 xl:w-80 flex-shrink-0 border-r overflow-y-auto`}
          style={{
            background: "white",
            borderColor: "var(--ag-border-light)",
            maxHeight: "calc(100vh - 200px)",
          }}>
          {isLoading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg" style={{ background: "var(--ag-border-light)" }} />
              ))}
            </div>
          ) : materials.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--ag-text-muted)" }}>
              Este curso aún no tiene temas.
            </div>
          ) : (
            <div className="py-2">
              {moduleGroups.map(([key, group]) => {
                const isExpanded = expandedModules.has(key);
                const label = key === 0 ? "General" : `Módulo ${key}`;
                const moduleAllDone = group.materials.every(m => completed.has(m.id));

                return (
                  <div key={key} className="mb-0.5">
                    <button onClick={() => toggleModule(key)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors"
                      style={{ borderBottom: "1px solid var(--ag-border-light)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--ag-surface-alt)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                          style={{ color: "var(--ag-navy)" }}>
                          {label}
                        </div>
                        {group.title && (
                          <div className="text-sm font-semibold line-clamp-1" style={{ color: "var(--ag-text)" }}>
                            {group.title}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {moduleAllDone && group.materials.length > 0 && (
                          <CheckCircle2 size={14} style={{ color: "#166534" }} />
                        )}
                        {isExpanded
                          ? <ChevronDown size={16} style={{ color: "var(--ag-text-muted)" }} />
                          : <ChevronRight size={16} style={{ color: "var(--ag-text-muted)" }} />
                        }
                      </div>
                    </button>

                    {isExpanded && (
                      <div>
                        {group.materials.map((mat, idx) => {
                          const isDone = completed.has(mat.id);
                          const isActive = activeMaterialId === mat.id;
                          const Icon = FILE_ICONS[mat.file_type || "link"] || FileText;

                          return (
                            <button key={mat.id} onClick={() => setActiveMaterialId(mat.id)}
                              className="w-full text-left px-4 py-3 border-l-2 transition-all flex items-start gap-2.5"
                              style={{
                                borderColor: isActive ? "var(--ag-navy)" : "transparent",
                                background: isActive ? "rgba(30,58,95,0.05)" : "transparent",
                              }}
                              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--ag-surface-alt)"; }}
                              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                              <div className="mt-0.5 flex-shrink-0" style={{
                                color: isDone ? "#166534" : isActive ? "var(--ag-navy)" : "var(--ag-text-light)",
                              }}>
                                {isDone ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm leading-snug mb-0.5 truncate" style={{
                                  fontWeight: isActive ? 600 : 400,
                                  color: isActive ? "var(--ag-navy)" : "var(--ag-text)",
                                }}>
                     
