"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

export function SearchInput({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (term: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 300);
  };

  return (
    <div className="relative">
      <input
        type="search"
        placeholder={placeholder || "Buscar..."}
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
        className="px-4 py-2 w-full max-w-sm text-sm bg-transparent border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all"
      />
      {isPending && (
        <span className="absolute right-3 top-2.5 w-4 h-4 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin"></span>
      )}
    </div>
  );
}

export default SearchInput
