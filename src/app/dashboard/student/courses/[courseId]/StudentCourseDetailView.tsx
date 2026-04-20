"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCourseMaterials, useMaterialCompletions } from "@/lib/hooks/use-data";
import { toggleMaterialCompletion } from "@/app/actions/courses";
import { requestCertificate } from "@/app/actions/courses";
import ProgressBar from "@/components/ui/ProgressBar";
import { StudentCourseNavTabs } from "@/components/ui/StudentCourseNavTabs";
import type { Course, Material } from "@/lib/types";
import { PlayCircle, FileText, Link as LinkIcon, Image as ImageIcon, CheckCircle2, ChevronDown, ChevronRight, Menu, Lock } from "lucide-react";

interface Enrollment {
  id: string;
  progress: number;
  completed: boolean;
}

interface Props {
  course: Course;
  enrollment: Enrollment;
  userId: string;
  initialCertificateRequest?: { status: string; certificate_code: string | null } | null;
}

const FILE_ICONS: Record<string, any> = {
  video: PlayCircle,
  pdf: FileText,
  link: LinkIcon,
  image: ImageIcon,
};

const FILE_LABELS: Record<string, string> = {
  video: "VIDEO",
  pdf: "DOC",
  link: "LINK",
  image: "IMG",
};

function getEmbedUrl(url: string | null) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
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

  // Group materials
  const moduleGroups = useMemo(() => {
    const map = new Map<number, { title: string | null; materials: Material[] }>();
    materials.forEach((m: Material) => {
      const key = m.module_number ?? 0;
      if (!map.has(key)) {
        map.set(key, { title: m.module_title ?? null, materials: [] });
      }
      map.get(key)!.materials.push(m);
    });
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 0) return 1;
      if (b === 0) return -1;
      return a - b;
    });
  }, [materials]);

  // Set initial active material
  useEffect(() => {
    if (!activeMaterialId && materials.length > 0 && !isLoading) {
      // Find first incomplete
      const firstIncomplete = materials.find((m: Material) => !completed.has(m.id));
      setActiveMaterialId(firstIncomplete ? firstIncomplete.id : materials[0].id);
      
      // Auto expand the module of the active material
      const activeMat = firstIncomplete || materials[0];
      const mod = activeMat.module_number ?? 0;
      setExpandedModules(prev => new Set([...prev, mod]));
    }
  }, [materials, completed, activeMaterialId, isLoading]);

  const activeMaterial = useMemo(() => materials.find((m: Material) => m.id === activeMaterialId), [materials, activeMaterialId]);

  function handleToggle(materialId: string) {
    setPendingMaterialId(materialId);
    startTransition(async () => {
      const result = await toggleMaterialCompletion(materialId, course.id);
      if (result.success) {
        const nextCompleted = new Set(completed);
        if (result.nowCompleted) nextCompleted.add(materialId);
        else nextCompleted.delete(materialId);
        const total = materials.length;
        const done = nextCompleted.size;
        const newProgress = total > 0 ? Math.round((done / total) * 100) : 0;
        setLocalProgress(newProgress);
        setLocalCompleted(newProgress >= 100);
        queryClient.invalidateQueries({ queryKey: ["material_completions", course.id, userId] });
        queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        router.refresh(); // Refresh layout to update server comps
      }
      setPendingMaterialId(null);
    });
  }

  function toggleModule(modNum: number) {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(modNum)) next.delete(modNum);
      else next.add(modNum);
      return next;
    });
  }

  const navigateNext = () => {
     if (!activeMaterialId) return;
     const currentIndex = materials.findIndex((m: Material) => m.id === activeMaterialId);
     if (currentIndex < materials.length - 1) {
        setActiveMaterialId(materials[currentIndex + 1].id);
        const nextMod = materials[currentIndex + 1].module_number ?? 0;
        setExpandedModules(prev => new Set([...prev, nextMod]));
     }
  };

  const navigatePrev = () => {
    if (!activeMaterialId) return;
    const currentIndex = materials.findIndex((m: Material) => m.id === activeMaterialId);
    if (currentIndex > 0) {
       setActiveMaterialId(materials[currentIndex - 1].id);
       const prevMod = materials[currentIndex - 1].module_number ?? 0;
       setExpandedModules(prev => new Set([...prev, prevMod]));
    }
  };

  const handleRequestCertificate = () => {
     setCertIsPending(true);
     startTransition(async () => {
        const result = await requestCertificate(course.id);
        if (result.success) {
           setCertRequest({ status: 'pending', certificate_code: null });
        }
        setCertIsPending(false);
     });
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col min-h-screen">
      {/* Course hero */}
      <div className="relative rounded-t-3xl h-32 md:h-40 flex items-end bg-gradient-to-br from-[#1A56DB] to-[#38BDF8] overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 p-6 w-full flex justify-between items-end">
          <div>
            <Link href="/dashboard/student/courses" className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs mb-2 transition-colors">
              ← Mis cursos
            </Link>
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight">{course.title}</h1>
          </div>
        </div>
      </div>

      {/* Certificate gamified preview */}
      {localProgress > 0 && (
        <div className="border-l border-r border-[#1A56DB]/20 bg-gradient-to-br from-[#EFF6FF] via-white to-[#F0FDF4] px-6 py-5">
          <div className="flex flex-col lg:flex-row items-center gap-6">

            {/* Blurred diploma card */}
            <div className="relative flex-shrink-0 w-64">
              {/* Diploma mockup */}
              <div
                className={`bg-white rounded-2xl border border-black/5 shadow-lg p-5 transition-all duration-500 ${
                  localCompleted && (!certRequest || certRequest.status === 'approved')
                    ? certRequest?.status === 'approved' ? '' : 'blur-[2px]'
                    : 'blur-sm'
                }`}
                style={{ fontFamily: "'Georgia', serif" }}
                aria-hidden="true"
              >
                <div className="h-1 rounded-full bg-gradient-to-r from-[#1A56DB] via-[#38BDF8] to-[#059669] mb-3" />
                <div className="text-center">
                  <p className="text-[8px] uppercase tracking-widest text-[#1A56DB] font-semibold mb-1">Certificado de Finalización</p>
                  <p className="text-[9px] text-[#050F1F]/40 mb-1">Este certificado acredita que</p>
                  <p className="text-sm font-bold text-[#050F1F] leading-tight">████████████</p>
                  <p className="text-[9px] text-[#050F1F]/40 mt-1 mb-1">ha completado el curso</p>
                  <p className="text-[10px] font-bold text-[#1A56DB] leading-tight">{course.title}</p>
                </div>
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-[#1A56DB]/10" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1A56DB]/20" />
                  <div className="flex-1 h-px bg-[#1A56DB]/10" />
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="w-16 border-b border-[#050F1F]/20 mb-0.5" />
                    <p className="text-[7px] text-[#050F1F]/30 uppercase tracking-wide">Director/a</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[#1A56DB]/20 flex items-center justify-center text-xs">🎓</div>
                </div>
              </div>

              {/* Lock overlay — only when not yet approved */}
              {certRequest?.status !== 'approved' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`rounded-2xl p-3 shadow-xl transition-all duration-500 ${
                    localCompleted ? 'bg-[#1A56DB] scale-110' : 'bg-[#050F1F]/60'
                  }`}>
                    <Lock size={24} className="text-white" />
                  </div>
                  {localCompleted && (
                    <span className="mt-2 text-[10px] font-bold text-[#1A56DB] bg-white px-2 py-0.5 rounded-full shadow-sm">
                      ¡Listo para desbloquear!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right side: progress / CTA */}
            <div className="flex-1 min-w-0 text-center lg:text-left">
              {certRequest?.status === 'approved' ? (
                <>
                  <p className="text-lg font-black text-[#050F1F] mb-1">🎉 ¡Certificado desbloqueado!</p>
                  <p className="text-sm text-[#050F1F]/60 mb-4">Tu certificado fue aprobado. Podés verlo y compartirlo.</p>
                  <a
                    href={`/certificates/${certRequest.certificate_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all"
                  >
                    <CheckCircle2 size={16} /> Ver mi Certificado
                  </a>
                </>
              ) : certRequest?.status === 'pending' ? (
                <>
                  <p className="text-base font-black text-[#050F1F] mb-1">⏳ Certificado en revisión</p>
                  <p className="text-sm text-[#050F1F]/60 mb-3">Tu solicitud fue enviada. El profesor la revisará pronto.</p>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs font-semibold text-amber-700">Pendiente de aprobación</span>
                  </div>
                </>
              ) : certRequest?.status === 'rejected' ? (
                <>
                  <p className="text-base font-black text-red-600 mb-1">❌ Solicitud rechazada</p>
                  <p className="text-sm text-[#050F1F]/60 mb-3">Contactá a tu profesor para más información.</p>
                </>
              ) : localCompleted ? (
                <>
                  <p className="text-lg font-black text-[#050F1F] mb-1">🏆 ¡Curso completado!</p>
                  <p className="text-sm text-[#050F1F]/60 mb-4">Completaste el 100% del curso. Solicitá tu certificado digital.</p>
                  <button
                    onClick={handleRequestCertificate}
                    disabled={certIsPending}
                    className="px-6 py-2.5 bg-[#1A56DB] hover:bg-[#1A56DB]/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-[#1A56DB]/20 transition-all disabled:opacity-50"
                  >
                    {certIsPending ? "Solicitando..." : "🎓 Solicitar Certificado"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-base font-bold text-[#050F1F] mb-1">
                    <Lock size={14} className="inline mr-1.5 text-[#050F1F]/40" />
                    Certificado bloqueado
                  </p>
                  <p className="text-sm text-[#050F1F]/50 mb-3">
                    Completá el <span className="font-bold text-[#1A56DB]">100%</span> del curso para desbloquearlo.
                  </p>
                  {/* Progress to certificate */}
                  <div className="max-w-xs mx-auto lg:mx-0">
                    <div className="flex justify-between text-xs text-[#050F1F]/40 mb-1.5">
                      <span>Progreso</span>
                      <span className="font-bold text-[#1A56DB]">{localProgress}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#1A56DB] to-[#38BDF8] transition-all duration-700"
                        style={{ width: `${localProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[#050F1F]/30 mt-1.5">
                      Faltan {materials.length - completed.size} tema{materials.length - completed.size !== 1 ? 's' : ''} para desbloquear
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar + stats */}
      <div className="bg-white border text-sm border-black/5 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
         <StudentCourseNavTabs courseId={course.id} />
         <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-32 md:w-48">
             <ProgressBar value={localProgress} />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-[#050F1F]/60">
             <span className="font-semibold text-[#050F1F]">{completed.size}</span> de {materials.length} temas
          </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row bg-white border-x border-b border-black/5 rounded-b-3xl overflow-hidden min-h-[600px] relative">
         
         {/* Mobile Toggle */}
         <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden w-full p-4 bg-[#F0F9FF] text-[#1A56DB] font-semibold flex items-center justify-center gap-2 border-b border-black/5">
            <Menu size={18} /> {sidebarOpen ? "Ocultar temario" : "Mostrar temario"}
         </button>

         {/* SIDEBAR */}
         <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0 bg-[#F9FAFB] border-r border-black/5 overflow-y-auto max-h-[800px]`}>
            {isLoading ? (
               <div className="p-6 space-y-4 animate-pulse">
                  <div className="h-4 bg-black/10 rounded w-1/2"></div>
                  <div className="h-10 bg-black/5 rounded"></div>
                  <div className="h-10 bg-black/5 rounded"></div>
               </div>
            ) : materials.length === 0 ? (
               <div className="p-8 text-center text-[#050F1F]/40 text-sm">Este curso aún no tiene temas.</div>
            ) : (
               <div className="py-2">
                 {moduleGroups.map(([key, group]) => {
                    const isExpanded = expandedModules.has(key);
                    const label = key === 0 ? "General" : `Módulo ${key}`;
                    const moduleCompleted = group.materials.every(m => completed.has(m.id));
                    
                    return (
                      <div key={key} className="mb-1">
                        <button 
                           onClick={() => toggleModule(key)}
                           className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-black/5 transition-colors"
                        >
                           <div>
                              <div className="text-xs font-bold text-[#1A56DB] uppercase tracking-wider mb-0.5">{label}</div>
                              {group.title && <div className="text-sm font-semibold text-[#050F1F] line-clamp-1">{group.title}</div>}
                           </div>
                           <div className="flex items-center gap-2">
                              {moduleCompleted && group.materials.length > 0 && <CheckCircle2 size={16} className="text-green-500" />}
                              {isExpanded ? <ChevronDown size={18} className="text-[#050F1F]/40" /> : <ChevronRight size={18} className="text-[#050F1F]/40" />}
                           </div>
                        </button>
                        
                        {isExpanded && (
                           <div className="bg-white">
                              {group.materials.map((mat, idx) => {
                                 const isDone = completed.has(mat.id);
                                 const isActive = activeMaterialId === mat.id;
                                 const Icon = FILE_ICONS[mat.file_type || 'link'] || FileText;
                                 
                                 return (
                                   <button 
                                      key={mat.id}
                                      onClick={() => setActiveMaterialId(mat.id)}
                                      className={`w-full text-left px-5 py-3 border-l-4 transition-all flex items-start gap-3
                                         ${isActive 
                                           ? "border-[#1A56DB] bg-[#EFF6FF]" 
                                           : "border-transparent hover:bg-black/5"
                                         }`}
                                   >
                                      <div className={`mt-0.5 flex-shrink-0 ${isDone ? "text-green-500" : isActive ? "text-[#1A56DB]" : "text-[#050F1F]/40"}`}>
                                         {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                                      </div>
                                      <div>
                                         <div className={`text-sm leading-tight mb-1 ${isActive ? "font-bold text-[#1A56DB]" : "font-medium text-[#050F1F]/80"}`}>
                                            {idx + 1}. {mat.title}
                                         </div>
                                         <div className="text-[10px] uppercase font-bold text-[#050F1F]/40">
                                            {FILE_LABELS[mat.file_type || 'link'] || mat.file_type}
                                         </div>
                                      </div>
                                   </button>
                                 );
                              })}
                           </div>
                        )}
                      </div>
                    )
                 })}
               </div>
            )}
         </aside>

         {/* MAIN VIEWER */}
         <main className="flex-1 bg-white flex flex-col relative min-h-[500px]">
           {activeMaterial ? (
             <div className="h-full flex flex-col">
                {/* Visualizador de medios */}
                <div className="w-full bg-[#050F1F] flex-shrink-0 relative overflow-hidden" style={{ minHeight: '400px', height: '55vh' }}>
                   {activeMaterial.file_url ? (
                      activeMaterial.file_type === 'image' ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={activeMaterial.file_url} alt={activeMaterial.title} className="w-full h-full object-contain absolute inset-0" />
                      ) : activeMaterial.file_type === 'video' ? (
                         <iframe 
                           src={getEmbedUrl(activeMaterial.file_url) || ''} 
                           className="w-full h-full absolute inset-0 border-0" 
                           allowFullScreen
                           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                         ></iframe>
                      ) : activeMaterial.file_type === 'pdf' ? (
                         <iframe src={activeMaterial.file_url} className="w-full h-full absolute inset-0 border-0"></iframe>
                      ) : (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
                            <LinkIcon size={48} className="mb-4 opacity-50" />
                            <p className="mb-4 text-center px-4">Este material es un enlace externo o un formato no embebible.</p>
                            <a href={activeMaterial.file_url} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-[#1A56DB] text-white rounded-xl font-semibold hover:bg-[#1A56DB]/90">
                               Abrir material en nueva pestaña
                            </a>
                         </div>
                      )
                   ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/50">
                         <p>Este tema no tiene un archivo o enlace adjunto.</p>
                      </div>
                   )}
                </div>

                {/* Detalles y Acciones */}
                <div className="p-6 md:p-8 flex-1 flex flex-col bg-white">
                   <h2 className="text-2xl font-bold text-[#050F1F] mb-2">{activeMaterial.title}</h2>
                   {activeMaterial.description && (
                      <p className="text-[#050F1F]/70 text-sm whitespace-pre-wrap mb-8">
                         {activeMaterial.description}
                      </p>
                   )}
                   
                   <div className="mt-auto pt-6 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Navigator Prev */}
                      <button onClick={navigatePrev} className="text-[#050F1F]/40 hover:text-[#050F1F] font-semibold text-sm transition-colors px-4 py-2">
                         Anterior
                      </button>

                      {/* Marcar visto */}
                      {(() => {
                         const isDone = completed.has(activeMaterial.id);
                         const isThisPending = isPending && pendingMaterialId === activeMaterial.id;
                         return (
                           <button
                             onClick={() => handleToggle(activeMaterial.id)}
                             disabled={isThisPending}
                             className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                               isDone 
                                 ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 shadow-green-500/10"
                                 : "bg-gradient-to-r from-[#1A56DB] to-[#38BDF8] text-white hover:brightness-110 shadow-blue-500/20"
                             }`}
                           >
                             {isThisPending ? "Guardando..." : isDone ? <><CheckCircle2 size={18} /> Tema completado</> : "Marcar como terminado"}
                           </button>
                         );
                      })()}

                      {/* Navigator Next */}
                      <button onClick={navigateNext} className="text-[#1A56DB] hover:text-[#1A56DB]/70 font-semibold text-sm transition-colors px-4 py-2">
                         Siguiente →
                      </button>
                   </div>
                </div>
             </div>
           ) : (
              <div className="flex-1 flex items-center justify-center text-[#050F1F]/40 p-8 text-center min-h-[400px]">
                 Seleccioná un tema del temario para comenzar a estudiar.
              </div>
           )}
         </main>
      </div>
    </div>
  );
}
