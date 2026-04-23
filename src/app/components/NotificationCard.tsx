import { forwardRef } from "react";

export interface NotificationCardData {
  brandName: string;
  logoUrl: string;
  iconBgColor: string;
  title: string;
  body: string;
  heroImageUrl: string;
}

interface NotificationCardProps {
  data: NotificationCardData;
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, \"SF Pro Display\", \"Helvetica Neue\", sans-serif";

export const NotificationCard = forwardRef<HTMLDivElement, NotificationCardProps>(
  ({ data }, ref) => {
    const timestamp = "now";

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
        {/* SECTION 1 — Text header */}
        <div
          style={{
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* App row: icon + brand name + timestamp */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              )}
            </div>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                color: "#1c1c1e",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {data.brandName}
            </span>
            <span style={{ fontSize: 12, color: "#8e8e93" }}>{timestamp}</span>
          </div>

          {/* Title + body + right thumbnail */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#1c1c1e",
                  lineHeight: 1.3,
                }}
              >
                {data.title}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 15,
                  fontWeight: 400,
                  color: "#1c1c1e",
                  opacity: 0.8,
                  lineHeight: 1.3,
                }}
              >
                {data.body}
              </p>
            </div>
            {data.heroImageUrl && (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 12,
                  overflow: "hidden",
                  flexShrink: 0,
                  backgroundColor: "#f2f2f2",
                }}
              >
                <img
                  src={data.heroImageUrl}
                  alt="Preview"
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2 — Full-bleed hero image */}
        {data.heroImageUrl && (
          <div
            style={{
              width: "100%",
              height: 270,
              overflow: "hidden",
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
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
                display: "block",
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
