/**
 * AgorifyLogo — Open Book mark + wordmark
 *
 * Props:
 *   size     — height of the icon box in px (default 36)
 *   variant  — "mark" | "full" | "full-stacked"
 *   theme    — "light" (white icon + text, for dark bg)
 *              "dark"  (navy icon + text, for light bg)
 *              "auto"  (icon in navy box, works on any bg)
 */

interface AgorifyLogoProps {
  size?: number;
  variant?: "mark" | "full";
  theme?: "light" | "dark" | "auto";
  showSub?: boolean;
}

const ICON_VIEWBOX = "0 0 36 36";

function BookIcon({ color = "white" }: { color?: string }) {
  return (
    <>
      {/* Left page */}
      <path
        d="M18 10 C15 10.5 11 10.5 8 10 L8 27 C11 26.5 15 26.5 18 27"
        stroke={color} strokeWidth="2.2" strokeLinejoin="round"
        strokeLinecap="round" fill="none"
      />
      {/* Right page */}
      <path
        d="M18 10 C21 10.5 25 10.5 28 10 L28 27 C25 26.5 21 26.5 18 27"
        stroke={color} strokeWidth="2.2" strokeLinejoin="round"
        strokeLinecap="round" fill="none"
      />
      {/* Spine */}
      <line x1="18" y1="10" x2="18" y2="27"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Top arc suggestion */}
      <path d="M10 13 C12 12.5 15 12.5 18 13"
        stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M26 13 C24 12.5 21 12.5 18 13"
        stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
    </>
  );
}

export function AgorifyLogo({
  size = 36,
  variant = "full",
  theme = "auto",
  showSub = false,
}: AgorifyLogoProps) {

  const textColor   = theme === "light" ? "white"   : "#1E3A5F";
  const mutedColor  = theme === "light" ? "rgba(255,255,255,0.45)" : "#94A3B8";
  const iconBg      = theme === "light" ? "rgba(255,255,255,0.14)" : "#1E3A5F";
  const iconBorder  = theme === "light" ? "rgba(255,255,255,0.22)" : "transparent";
  const iconColor   = "white"; // icon is always white on its bg

  const iconSize = size;
  const fontSize = Math.round(size * 0.52);
  const subSize  = Math.round(size * 0.28);

  const Mark = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox={ICON_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <rect
        width="36" height="36" rx="8"
        fill={iconBg}
        stroke={iconBorder}
        strokeWidth="1"
      />
      <BookIcon color={iconColor} />
    </svg>
  );

  if (variant === "mark") return Mark;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(size * 0.3) }}>
      {Mark}
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{
          fontSize,
          fontWeight: 800,
          color: textColor,
          letterSpacing: "-0.4px",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}>
          Agorify
        </span>
        {showSub && (
          <span style={{
            fontSize: subSize,
            fontWeight: 500,
            color: mutedColor,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginTop: 3,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            Campus Virtual
          </span>
        )}
      </div>
    </div>
  );
}
