import { forwardRef } from "react";

export interface ImageTransform {
  /** Scale factor, 1.0 = 100-percent. Only zooms IN (>= 1). */
  scale: number;
  /** Horizontal anchor as 0-100 percent (50 = center). */
  offsetX: number;
  /** Vertical anchor as 0-100 percent (50 = center). */
  offsetY: number;
}

export const DEFAULT_TRANSFORM: ImageTransform = {
  scale: 1,
  offsetX: 50,
  offsetY: 50,
};

export interface NotificationCardData {
  brandName: string;
  logoUrl: string;
  iconBgColor: string;
  title: string;
  body: string;
  heroImageUrl: string;
  logoTransform?: ImageTransform;
  heroTransform?: ImageTransform;
}

interface NotificationCardProps {
  data: NotificationCardData;
}

/**
 * Inter is metrically very close to SF Pro Text and is loaded as a web font,
 * so html2canvas can actually render it correctly. SF Pro Display is a
 * system font that html2canvas cannot reliably access on non-Apple systems.
 */
const FONT_STACKK = "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

/**
 * Resolve a transform (defaults applied). We use `object-position` to pan
 * inside the already-clipped crop window, and `transform: scale()` with
 * `transform-origin` at the same anchor point so zoom happens around the
 * visible pan target without clipping anything outside the container.
 */
function resolveTransform(t: ImageTransform | undefined): ImageTransform {
  return t ?? DEFAULT_TRANSFORM;
}

export const NotificationCard = forwardRef<HTMLDivElement, NotificationCardProps>(
  ({ data }, ref) => {
    const timestamp = "now";
    const logoT = resolveTransform(data.logoTransform);
    const heroT = resolveTransform(data.heroTransform);

    return (
      <div
        ref={ref}
        style={{
          width: 375,
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          fontFamily: FONT_STACK,
        }}
      >
        {/* SECTION 1 — Header: icon + title/body + timestamp */}
        <div
          style={{
            padding: "8px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* 28x28 icon with iOS-style superellipse corner br adius */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: data.iconBgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {data.logoUrl && (
              <img
                src={data.logoUrl}
                alt={data.brandName}
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: `${logoT.offsetX}% ${logoT.offsetY}%`,
                  transform: `scale(${logoT.scale})`,
                  transformOrigin: `${logoT.offsetX}% ${logoT.offsetY}%`,
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            )}
          </div>

          {/* Title + body block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: "#000000",
                lineHeight: "1.2em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "-0.01em",
              }}
            >
              {data.title}
            </p>
            <p
              style={{
                margin: "1px 0 0",
                fontSize: 15,
                fontWeight: 400,
                color: "#3c3c3c",
                lineHeight: "1.2em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                letterSpacing: "-0.01em",
              }}
            >
              {data.body}
            </p>
          </div>

          {/* Timestamp top-right */}
          <span
            style={{
              fontSize: 11,
              fontWeight: 400,
              color: "#aeaeb2",
              alignSelf: "flex-start",
              marginTop: 2,
              flexShrink: 0,
            }}
          >
            {timestamp}
          </span>
        </div>

        {/* SECTION 2 — Full-bleed hero image, seamless with header above */}
        {data.heroImageUrl && (
          <div
            style={{
              width: "100%",
              height: 260,
              overflow: "hidden",
              backgroundColor: "#f2f2f2",
            }}
          >
            <img
              src={data.heroImageUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: `${heroT.offsetX}% ${heroT.offsetY}%`,
                display: "block",
                transform: `scale(${heroT.scale})`,
                transformOrigin: `${heroT.offsetX}% ${heroT.offsetY}%`,
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

NotificationCard.displayName = "NotificationCard";
