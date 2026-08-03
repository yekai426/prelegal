import { DRAFT_DISCLAIMER } from "@/lib/disclaimer";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 py-4 text-center text-xs text-muted dark:border-zinc-800 dark:bg-zinc-950">
      {DRAFT_DISCLAIMER}
    </footer>
  );
}
