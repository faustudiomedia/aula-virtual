"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCoursesForInstitute, useEnrollments } from "@/lib/hooks/use-data";
import EnrollButton from "@/components/ui/EnrollButton";
import { Palette, X, CheckCircle2, BookOpen, Search } from "lucide-react";
import { ACCENT_PALETTE } from "@/components/dashboard/CourseCard";

interface Props {
  instituteId: string | null;
  userId: string;
}

/* -- LocalStorage helpers -------------------------------- */
const STORAGE_KEY = "agorify_catalog_colors";
function getStoredColors(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveColor(courseId: string, colorId: string) {
  const current = getStoredColors();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [courseId]: colorId }));
}

/* -- Framer Motion variants ------------------------------ */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24 } },
};

/* -- Skeleton -------------------------------------------- */
function SkeletonGrid() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="skeleton-shimmer h-8 w-48 rounded-lg mb-2" />
        <div className="skeleton-shimmer h-4 w-72 rounded-md" />
      </div>
      <div className="skeleton-shimmer h-11 w-full rounded-xl mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="skeleton-shimmer h-20 w-full" />
            <div className="bg-white p-4 space-y-3">
              <div className="skeleton-shimmer h-4 rounded w-3/4" />
              <div className="skeleton-shimmer h-3 rounded w-full" />
              <div className="skeleton-shimmer h-9 rounded-lg w-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Course card with color picker ----------------------- */
interface CatalogCardProps {
  courseId: string;
  title: string;
  description?: string | null;
  isEnrolled: boolean;
  defaultIdx: number;
}
function CatalogCard({ courseId, title, description, isEnrolled, defaultIdx }: CatalogCardProps) {
  const defaultAccent = ACCENT_PALETTE[defaultIdx % ACCENT_PALETTE.length];
  const [accent, setAccent] = useState(defaultAccent);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = getStoredColors()[courseId];
    if (stored) {
      const found = ACCENT_PALETTE.find(a => a.id === stored);
      if (found) setAccent(found);
    }
  }, [courseId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setPickerOpen(false);
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  function handleColorSelect(a: typeof ACCENT_PALETTE[0]) {
    setAccent(a);
    saveColor(courseId, a.id);
    setPickerOpen(false);
  }

  const initial = title.charAt(0).toUpperCase();

  const inner = (
    <div
      className="group bg-white rounded-xl overflow-visible relative transition-all duration-200"
      style={{
        border: isEnrolled ? `1px solid ${accent.bg}40` : "1px solid var(--ag-border-light)",
        boxShadow: isEnrolled
          ? `0 2px 12px ${accent.bg}20`
          : "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Color picker button */}
      <div ref={pickerRef} className="absolute top-2 right-2 z-20">
        <button
          onClick={(e) => { e.preventDefault(); setPickerOpen(v => !v); }}
          title="Cambiar color"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
          style={{ background: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.85)" }}
        >
          {pickerOpen ? <X size={13} /> : <Palette size={13} />}
        </button>
        {pickerOpen && (
          <div
            className="absolute top-9 right-0 p-2.5 rounded-xl z-30"
            style={{
              background: "white",
              border: "1px solid var(--ag-border-light)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              width: 184,
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-0.5"
              style={{ color: "var(--ag-text-muted)" }}
            >
              Color de la materia
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {ACCENT_PALETTE.map((a) => (
                <button
                  key={a.id}
                  title={a.label}
                  onClick={() => handleColorSelect(a)}
                  className="w-6 h-6 rounded-md transition-transform hover:scale-110 relative"
                  style={{ background: a.bg }}
                >
                  {accent.id === a.id && (
                    <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card header */}
      <div
        className="h-20 flex items-end px-4 pb-3 relative rounded-t-xl overflow-hidden"
        style={{ background: accent.bg }}
      >
        <span
          className="absolute right-2 top-1 text-5xl font-black opacity-[0.08] leading-none select-none"
          style={{ color: "white" }}
        >
          {initial}
        </span>
        {/* Status badge */}
        <span
          className="relative z-10 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
          style={{
            background: isEnrolled ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {isEnrolled ? (
            <><CheckCircle2 size={11} /> Inscripto</>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-white/50 inline-block" /> Disponible</>
          )}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-snug mb-1" style={{ color: "var(--ag-text)" }}>
          {title}
        </h3>
        <p className="text-xs mb-4 line-clamp-2 min-h-[2rem]" style={{ color: "var(--ag-text-muted)" }}>
          {description ?? "Sin descripcion"}
        </p>
        {isEnrolled ? (
          <div
            className="w-full py-2 rounded-lg text-white text-sm font-semibold text-center transition-all"
            style={{ background: accent.bg, opacity: 0.9 }}
          >
            Ir al curso &rarr;
          </div>
        ) : (
          <EnrollButton courseId={courseId} courseTitle={title} isEnrolled={false} />
        )}
      </div>
    </div>
  );

  return isEnrolled
    ? <Link href={`/dashboard/student/courses/${courseId}`} className="block">{inner}</Link>
    : <div>{inner}</div>;
}

/* -- Main Component --------------------------------------- */
export default function StudentCoursesCatalogView({ instituteId, userId }: Props) {
  const { data: courses = [], isLoading: loadingCourses } = useCoursesForInstitute(instituteId);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useEnrollments(userId);
  const [search, setSearch] = useState("");

  const isLoading = loadingCourses || loadingEnrollments;
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));

  const filtered = search.trim()
    ? courses.filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()))
    : courses;

  const enrolledCount = courses.filter((c) => enrolledCourseIds.has(c.id)).length;

  if (isLoading) return <SkeletonGrid />;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* -- Header -- */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold" style={{ color: "var(--ag-text)" }}>
            Catalogo de cursos
          </h1>
          {enrolledCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(30,58,95,0.1)", color: "var(--ag-navy)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "var(--ag-navy)" }} />
              {enrolledCount} inscripto{enrolledCount > 1 ? "s" : ""}
            </motion.span>
          )}
        </div>
        <p className="text-sm" style={{ color: "var(--ag-text-muted)" }}>
          Explora los cursos disponibles e inscribite.
        </p>
      </motion.div>

      {/* -- Search -- */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-8"
      >
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--ag-text-muted)" }} />
        <input
          type="text"
          id="course-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cursos por titulo..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white focus:outline-none transition-all"
          style={{
            border: "1px solid var(--ag-border)",
            color: "var(--ag-text)",
          }}
        />
      </motion.div>

      {/* -- Empty states -- */}
      {courses.length === 0 ? (
        <div
          className="rounded-xl p-16 text-center bg-white"
          style={{ border: "2px dashed var(--ag-border-light)" }}
        >
          <BookOpen size={36} className="mx-auto mb-3" style={{ color: "var(--ag-text-light)" }} />
          <p className="text-sm" style={{ color: "var(--ag-text-muted)" }}>
            No hay cursos publicados todavia.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center bg-white"
          style={{ border: "2px dashed var(--ag-border-light)" }}
        >
          <p className="text-sm" style={{ color: "var(--ag-text-muted)" }}>
            No se encontraron cursos con ese titulo.
          </p>
        </div>
      ) : (
        /* -- Course grid -- */
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((course, idx) => (
              <motion.div key={course.id} variants={cardVariants} layout>
                <CatalogCard
                  courseId={course.id}
                  title={course.title}
                  description={course.description}
                  isEnrolled={enrolledCourseIds.has(course.id)}
                  defaultIdx={idx}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
