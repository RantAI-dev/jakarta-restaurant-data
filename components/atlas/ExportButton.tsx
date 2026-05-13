"use client";

export function ExportButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="press-scale inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas px-3 py-1.5 apple-caption-strong text-ink-muted-80 hover:text-[color:var(--accent)] hover:border-[color:var(--accent)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
      aria-label={label}
    >
      <DownloadIcon />
      <span>{label}</span>
    </button>
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
