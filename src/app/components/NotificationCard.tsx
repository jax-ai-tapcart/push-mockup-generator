import { forwardRef } from 'react';

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
  function NotificationCard({ data }, ref) {
    const { brandName, logoUrl, iconBgColor, title, body, heroImageUrl } = data;
    const initial = (brandName || '?')[0].toUpperCase();

    return (
      <div
        ref={ref}
        style={{
          width: '360px',
          background: '#ffffff',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 14px 8px 14px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            background: '#ffffff',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              overflow: 'hidden',
              marginRight: '10px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: iconBgColor,
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px', display: 'block' }}
                onError={(e) => {
                  const el = e.currentTarget;
                  const wrap = el.parentElement;
                  if (wrap) {
                    wrap.innerHTML = '<span style="font-weight:700;color:#fff;font-size:18px">' + initial + '</span>';
                  }
                }}
              />
            ) : (
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '18px' }}>{initial}</span>
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#555',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                }}
              >
                {brandName || 'Tapcart'}
              </span>
              <span style={{ fontSize: '11px', color: '#999', flexShrink: 0, marginLeft: '6px' }}>now</span>
            </div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#000',
                lineHeight: 1.3,
                marginBottom: '2px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#333',
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              } as React.CSSProperties}
            >
              {body}
            </div>
          </div>
        </div>

        {/* Hero image */}
        <div style={{ width: '100%', height: '200px', overflow: 'hidden', flexShrink: 0 }}>
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center center',
                display: 'block',
              }}
              onError={(e) => {
                const el = e.currentTarget;
                const wrap = el.parentElement;
                if (wrap) {
                  wrap.style.background = 'linear-gradient(135deg, ' + iconBgColor + ', #000)';
                  wrap.style.display = 'flex';
                  wrap.style.alignItems = 'center';
                  wrap.style.justifyContent = 'center';
                  wrap.style.fontSize = '48px';
                  wrap.style.color = 'rgba(255,255,255,0.3)';
                  wrap.innerHTML = 'ud83dudcf7';
                }
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, ' + iconBgColor + ', #000)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              ud83dudcf7
            </div>
          )}
        </div>
      </div>
    );
  }
);
