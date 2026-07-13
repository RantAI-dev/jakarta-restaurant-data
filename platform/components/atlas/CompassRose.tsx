/**
 * Compass-rose glyph used as the Jakarta Atlas mark — in the sub-nav,
 * on the home hero, and as a decorative element across the site. The
 * design is a stylised 8-point rose with cardinal N/E/S/W letters and
 * a small centred dot, drawn in the current text colour so it adapts
 * to whichever section accent is active.
 */
export function CompassRose({
  size = 28,
  className = "",
  withLetters = true,
}: {
  size?: number;
  className?: string;
  withLetters?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`compass-rose-svg ${className}`}
      aria-hidden="true"
    >
      {/* Outer hairline ring */}
      <circle
        cx="32"
        cy="32"
        r="29"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.45"
      />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.30"
      />

      {/* Cardinal points (long) — N, E, S, W */}
      <path d="M32 4 L34 32 L32 30 L30 32 Z" fill="currentColor" opacity="0.95" />
      <path d="M60 32 L32 34 L34 32 L32 30 Z" fill="currentColor" opacity="0.55" />
      <path d="M32 60 L30 32 L32 34 L34 32 Z" fill="currentColor" opacity="0.95" />
      <path d="M4 32 L32 30 L30 32 L32 34 Z" fill="currentColor" opacity="0.55" />

      {/* Ordinal points (short) — NE, SE, SW, NW */}
      <path
        d="M50 14 L34 30 L32 32 L30 30 Z"
        fill="currentColor"
        opacity="0.30"
      />
      <path
        d="M50 50 L32 34 L32 32 L30 30 Z"
        fill="currentColor"
        opacity="0.30"
      />
      <path
        d="M14 50 L30 32 L32 30 L34 32 Z"
        fill="currentColor"
        opacity="0.30"
      />
      <path
        d="M14 14 L32 32 L30 32 L32 30 Z"
        fill="currentColor"
        opacity="0.30"
      />

      {/* Centre dot */}
      <circle cx="32" cy="32" r="1.4" fill="currentColor" />

      {withLetters && (
        <>
          <text
            x="32"
            y="2.2"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="5"
            fontWeight="500"
            fill="currentColor"
            opacity="0.6"
            dominantBaseline="hanging"
          >
            N
          </text>
          <text
            x="62"
            y="34"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="5"
            fontWeight="500"
            fill="currentColor"
            opacity="0.6"
          >
            E
          </text>
          <text
            x="32"
            y="64"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="5"
            fontWeight="500"
            fill="currentColor"
            opacity="0.6"
          >
            S
          </text>
          <text
            x="2"
            y="34"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="5"
            fontWeight="500"
            fill="currentColor"
            opacity="0.6"
          >
            W
          </text>
        </>
      )}
    </svg>
  );
}
