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

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Helvetica Neue\", sans-serif";

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
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid #e0e0e0",
          fontFamily: FONT_STACK,
        }}
      >
        {/* SECTION 1 — Header: icon + title/body + timestamp */}
        <div
          style={{
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* 32x32 icon, vertically centered with the text block */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
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
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {data.title}
            </p>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 15,
                fontWeight: 400,
                color: "#000000",
                lineHeight: 1.25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {data.body}
            </p>
          </div>

          {/* Timestamp top-right */}
          <span
            style={{
              fontSize: 12,
              color: "#8e8e93",
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
              height: 270,
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
