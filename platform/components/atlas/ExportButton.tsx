"use client";

import { useEffect, useRef, useState } from "react";
import type { ExportFormat } from "@/lib/export";

const FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  { id: "csv", label: "CSV", hint: ".csv" },
  { id: "xls", label: "XLS", hint: ".xls" },
  { id: "xlsx", label: "XLSX", hint: ".xlsx" },
];

export function ExportButton({
  onExport,
  label,
  disabled,
}: {
  onExport: (format: ExportFormat) => void;
  label: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click-outside and Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handlePick(format: ExportFormat) {
    setOpen(false);
    setBusy(format);
    try {
      await onExport(format);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className="press-scale inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 apple-caption-strong text-ink-muted-80 hover:text-[color:var(--accent)] hover:border-[color:var(--accent)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {busy ? <Spinner /> : <DownloadIcon />}
        <span>{label}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 min-w-[156px] rounded-lg border border-hairline bg-canvas shadow-[0_8px_24px_rgba(15,23,42,0.10),0_2px_6px_rgba(15,23,42,0.05)] py-1 z-50"
        >
          {FORMATS.map((f) => (
            <button
              key={f.id}
              role="menuitem"
              onClick={() => handlePick(f.id)}
              disabled={busy !== null}
              className="press-scale w-full flex items-center justify-between gap-3 px-3.5 py-2 apple-caption hover:bg-paper text-ink disabled:opacity-50 text-left"
            >
              <span className="apple-caption-strong">{f.label}</span>
              <span className="atlas-mono text-ink-muted-48 text-[10px]">
                {f.hint}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 1.5v9" />
      <path d="M4.5 7L8 10.5 11.5 7" />
      <path d="M2 12.5v1A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5v-1" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3 w-3 text-ink-muted-48 transition-transform ${
        open ? "rotate-180" : ""
      }`}
      aria-hidden="true"
    >
      <path fill="currentColor" d="M7 10l5 5 5-5z" />
    </svg>
  );
}
