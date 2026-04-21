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

export const NotificationCard = forwardRef<HTMLDivElement, NotificationCardProps>(
  ({ data }, ref) => {
    const timestamp = "now";

    return (
      <div
        ref={ref}
        className="w-[375px] bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif' }}
      >
        {/* iOS Lock Screen Header */}
        <div className="bg-[rgba(255,255,255,0.85)] backdrop-blur-xl px-4 pt-4 pb-3">
          {/* App Row */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-[8px] overflow-hidden flex-shrink-0"
              style={{ backgroundColor: data.iconBgColor }}
            >
              <img
                src={data.logoUrl}
                alt={data.brandName}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
            <span className="text-[13px] font-semibold text-[#1c1c1e] flex-1 uppercase tracking-wide">{data.brandName}</span>
            <span className="text-[12px] text-[#8e8e93]">{timestamp}</span>
          </div>

          {/* Notification content with hero image */}
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#1c1c1e] leading-snug">{data.title}</p>
              <p className="text-[15px] text-[#1c1c1e] leading-snug mt-0.5 opacity-80">{data.body}</p>
            </div>
            <div className="w-[72px] h-[72px] rounded-[12px] overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                src={data.heroImageUrl}
                alt="Product"
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

NotificationCard.displayName = "NotificationCard";
