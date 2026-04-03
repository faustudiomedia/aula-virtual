'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex gap-2 items-center justify-center p-4 border-t border-black/5">
      <Link
        href={createPageURL(Math.max(1, currentPage - 1))}
        className={`px-3 py-1.5 border border-black/10 rounded-lg text-sm text-[#050F1F]/70 transition-all ${
          currentPage <= 1 ? 'pointer-events-none opacity-50' : 'hover:bg-black/5 hover:text-[#050F1F]'
        }`}
      >
        Anterior
      </Link>

      <span className="text-sm font-medium text-[#050F1F]">
        {currentPage} <span className="text-[#050F1F]/40 font-normal">de {totalPages}</span>
      </span>

      <Link
        href={createPageURL(Math.min(totalPages, currentPage + 1))}
        className={`px-3 py-1.5 border border-black/10 rounded-lg text-sm text-[#050F1F]/70 transition-all ${
          currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-black/5 hover:text-[#050F1F]'
        }`}
      >
        Siguiente
      </Link>
    </div>
  );
}
