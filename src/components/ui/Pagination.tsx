"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex gap-2 items-center justify-center p-4 border-t border-[var(--ag-border-light)]">
      <Link
        href={createPageURL(Math.max(1, currentPage - 1))}
        className={`px-3 py-1.5 border border-[var(--ag-border)] rounded-lg text-sm text-[var(--ag-text)]/70 transition-all ${
          currentPage <= 1
            ? "pointer-events-none opacity-50"
            : "hover:bg-[var(--ag-surface-alt)] hover:text-[var(--ag-text)]"
        }`}
      >
        Anterior
      </Link>

      <span className="text-sm font-medium text-[var(--ag-text)]">
        {currentPage}{" "}
        <span className="text-[var(--ag-text-muted)] font-normal">de {totalPages}</span>
      </span>

      <Link
        href={createPageURL(Math.min(totalPages, currentPage + 1))}
        className={`px-3 py-1.5 border border-[var(--ag-border)] rounded-lg text-sm text-[var(--ag-text)]/70 transition-all ${
          currentPage >= totalPages
            ? "pointer-events-none opacity-50"
            : "hover:bg-[var(--ag-surface-alt)] hover:text-[var(--ag-text)]"
        }`}
      >
        Siguiente
      </Link>
    <
