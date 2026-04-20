"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCoursesForInstitute, useEnrollments } from "@/lib/hooks/use-data";
import EnrollButton from "@/components/ui/EnrollButton";

interface Props {
  instituteId: string | null;
  userId: string;
}

const GRADIENTS = [
  ["#1A56DB", "#38BDF8"],
  ["#7C3AED", "#A78BFA"],
  ["#059669", "#34D399"],
  ["#D97706", "#FCD34D"],
  ["#DC2626", "#F87171"],
  ["#0891B2", "#67E8F9"],
  ["#BE185D", "#F9A8D4"],
  ["#92400E", "#FDE68A"],
];

/* ── Framer Motion variants ───────────────────────────── */

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

/* ── Animated Check SVG ───────────────────────────────── */
function AnimatedCheck() {
  return (
    <svg
      className="check-animate"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

/* ── Skeleton Loader ──────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="skeleton-shimmer h-8 w-48 rounded-lg mb-2" />
        <div className="skeleton-shimmer h-4 w-72 rounded-md" />
      </div>
      <div className="skeleton-shimmer h-11 w-full rounded-xl mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="skeleton-shimmer h-28 w-full" />
            <div className="bg-white p-5 space-y-3">
              <div className="skeleton-shimmer h-5 rounded w-3/4" />
              <div className="skeleton-shimmer h-3 rounded w-full" />
              <div className="skeleton-shimmer h-3 rounded w-2/3" />
              <div className="skeleton-shimmer h-10 rounded-xl w-full mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────── */

export default function StudentCoursesCatalogView({ instituteId, userId }: Props) {
  const { data: courses = [], isLoading: loadingCourses } = useCoursesForInstitute(instituteId);
  const { data: enrollments = [], isLoading: loadingEnrollments } = useEnrollments(userId);
  const [search, setSearch] = useState("");

  const isLoading = loadingCourses || loadingEnrollments;
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));

  const filtered = search.trim()
    ? courses.filter((c) => c.title.toLowerCase().includes(search.trim().toLowerCase()))
    : courses;

  const enrolledCount = filtered.filter((c) => enrolledCourseIds.has(c.id)).length;

  if (isLoading) return <SkeletonGrid />;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ── Header ──────────────────────────────────────── */}
      <motion.div
        variants={headerVariants}
        initial="hidden"
        animate="show"
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[#050F1F]">Mis cursos</h1>
          {enrolledCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.4 }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {enrolledCount} inscripto{enrolledCount > 1 ? "s" : ""}
            </motion.span>
          )}
        </div>
        <p className="text-[#050F1F]/50">
          Explorá los cursos disponibles e inscribite.
        </p>
      </motion.div>

      {/* ── Search with animated focus ring ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="relative mb-8 group"
      >
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#050F1F]/30 text-sm transition-transform group-focus-within:scale-110">
          🔍
        </span>
        <input
          type="text"
          id="course-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cursos por título..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 text-sm
            bg-white/70 backdrop-blur-sm
            focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]/40
            focus:bg-white
            transition-all duration-300"
        />
      </motion.div>

      {/* ── Empty / no-results states ────────────────── */}
      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-16 text-center"
        >
          <p className="text-5xl mb-4">📚</p>
          <p className="text-[#050F1F]/50">No hay cursos publicados todavía.</p>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border-2 border-dashed border-[#BAE6FD] p-10 text-center"
        >
          <p className="text-[#050F1F]/50">No se encontraron cursos con ese título.</p>
        </motion.div>
      ) : (
        /* ── Course Grid ──────────────────────────────── */
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((course, idx) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const [from, to] = GRADIENTS[idx % GRADIENTS.length];

              const card = (
                <motion.div
                  variants={cardVariants}
                  layout
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative bg-white rounded-2xl overflow-hidden card-shine cursor-pointer
                    transition-shadow duration-300
                    ${isEnrolled
                      ? "shadow-md shadow-green-500/10 ring-1 ring-green-200 glow-enrolled"
                      : "shadow-sm border border-black/5 hover:shadow-xl hover:shadow-black/8"
                    }`}
                >
                  {/* ── Cover strip with depth ─────────── */}
                  <div
                    className="h-28 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {/* Subtle pattern overlay */}
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.4) 0%, transparent 50%),
                                          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
                      }}
                    />
                    <span className="text-5xl font-black text-white/25 select-none relative z-10">
                      {course.title.charAt(0).toUpperCase()}
                    </span>

                    {/* Enrolled badge (animated) */}
                    {isEnrolled && (
                      <motion.div
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 + idx * 0.05 }}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-green-500/90 backdrop-blur-sm
                          flex items-center justify-center shadow-lg shadow-green-600/30"
                      >
                        <AnimatedCheck />
                      </motion.div>
                    )}
                  </div>

                  {/* ── Content ────────────────────────── */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-[#050F1F] leading-snug line-clamp-1">
                        {course.title}
                      </h3>
                      {isEnrolled && (
                        <motion.span
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap flex-shrink-0"
                        >
                          Inscripto
                        </motion.span>
                      )}
                    </div>
                    <p className="text-sm text-[#050F1F]/50 line-clamp-2 mb-4 min-h-[2.5rem]">
                      {course.description ?? "Sin descripción"}
                    </p>

                    {isEnrolled ? (
                      <div
                        className="w-full py-2.5 rounded-xl text-white text-sm font-semibold text-center
                          shadow-md transition-all duration-300
                          hover:shadow-lg hover:brightness-110
                          active:scale-[0.97]"
                        style={{
                          background: `linear-gradient(135deg, ${from}, ${to})`,
                          boxShadow: `0 4px 14px ${from}33`,
                        }}
                      >
                        Ir al curso →
                      </div>
                    ) : (
                      <EnrollButton
                        courseId={course.id}
                        courseTitle={course.title}
                        isEnrolled={false}
                      />
                    )}
                  </div>
                </motion.div>
              );

              return isEnrolled ? (
                <Link key={course.id} href={`/dashboard/student/courses/${course.id}`} className="block">
                  {card}
                </Link>
              ) : (
                <div key={course.id}>{card}</div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
