const base =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";

/** Shared admin class strings (kept in TS so we don't touch the global stylesheet). */
export const ui = {
  btn: `${base} bg-ink text-paper hover:bg-ink-deep`,
  btnGhost: `${base} border border-ink/20 bg-white text-ink hover:border-ink`,
  btnDanger: `${base} bg-red-600 text-white hover:bg-red-700`,
  btnSmall: "inline-flex min-h-10 items-center gap-1.5 md:min-h-0 border border-ink/15 bg-white px-2.5 py-1.5 text-[11px] font-medium text-ink transition-colors hover:border-ink disabled:opacity-50",
  iconBtn:
    "inline-flex h-10 w-10 items-center justify-center text-ink/60 md:h-8 md:w-8 transition-colors hover:bg-paper-light hover:text-ink disabled:opacity-40",
  iconBtnDanger:
    "inline-flex h-10 w-10 items-center justify-center text-ink/50 md:h-8 md:w-8 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40",
  input:
    "w-full border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/60 transition-colors max-sm:text-base focus:border-ink focus:outline-none disabled:bg-paper-light",
  label: "mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/60",
  hint: "mt-1 text-xs text-muted",
};
