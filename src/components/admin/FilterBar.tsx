"use client";

import { useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle, Search, X } from "lucide-react";
import { ui } from "./styles";
import { cn } from "@/lib/utils";

type SelectFilter = {
  name: string;
  label: string;
  options: { value: string; label: string }[];
};

/**
 * URL-driven search + select filters for list pages. Current values come from the
 * server page's searchParams so the page stays the single source of truth.
 */
export function FilterBar({
  values,
  searchPlaceholder = "Search…",
  selects = [],
  className,
}: {
  values: Record<string, string | undefined>;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(values.q ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...values, ...patch })) {
      if (v && k !== "page") params.set(k, v);
    }
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const onSearch = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ q: value.trim() }), 350);
  };

  const hasFilters = Boolean(values.q) || selects.some((s) => values[s.name]);

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      <div className="relative flex-1">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
        <input
          type="search"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(ui.input, "pl-9")}
          aria-label="Search"
        />
        {pending && (
          <LoaderCircle size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink/40" />
        )}
      </div>
      {selects.length > 0 && (
        // Side by side on phones; the wrapper dissolves into the row from `sm` up.
        <div className={cn("grid gap-3 sm:contents", selects.length > 1 && "grid-cols-2")}>
          {selects.map((s) => (
            <select
              key={s.name}
              value={values[s.name] ?? ""}
              onChange={(e) => navigate({ [s.name]: e.target.value })}
              className={cn(ui.input, "min-w-0 sm:w-48")}
              aria-label={s.label}
            >
              <option value="">{s.label}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
      {hasFilters && (
        <button
          type="button"
          className={cn(ui.btnSmall, "self-start sm:self-auto")}
          onClick={() => {
            setQ("");
            const cleared = Object.fromEntries([["q", ""], ...selects.map((s) => [s.name, ""])]);
            navigate(cleared);
          }}
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  );
}
