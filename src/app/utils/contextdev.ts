// Context.dev API integration
const CONTEXT_DEV_BASE = 'https://api.context.dev/v1';

export interface BrandLogo {
  url: string;
  type: 'icon' | 'logo' | 'wordmark';
  mode: 'light' | 'dark' | 'has_opaque_background';
  colors?: Array<{ hex: string; weight: number }>;
}

export interface BrandColor {
  hex: string;
  weight: number;
}

export interface BrandData {
  title: string;
  description?: string;
  logos: BrandLogo[];
  colors: BrandColor[];
  socialProfiles?: Array<{ platform: string; url: string; profileImageUrl?: string }>;
}

export interface ProductImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

const brandCache = new Map<string, { data: BrandData; ts: number }>();
const productCache = new Map<string, { data: ProductImage[]; ts: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function normalizeDomain(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace(/^www./, '');
  } catch {
    return url;
  }
}

export async function getBrandData(url: string, skipCache = false): Promise<BrandData> {
  const domain = normalizeDomain(url);
  const cacheKey = domain;

  if (!skipCache) {
    const cached = brandCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.data;
    }
  }

  const response = await fetch(
    CONTEXT_DEV_BASE + '/brands?domain=' + encodeURIComponent(domain),
    { headers: { 'Accept': 'application/json' } }
  );

  if (!response.ok) {
    throw new Error('Context.dev brand lookup failed: ' + response.status);
  }

  const raw = await response.json();
  const data: BrandData = {
    title: raw.name || raw.title || domain,
    description: raw.description,
    logos: (raw.logos || []).map((l: any) => ({
      url: l.url,
      type: l.type || 'icon',
      mode: l.mode || 'light',
      colors: l.colors,
    })),
    colors: (raw.colors || []).map((c: any) => ({
      hex: c.hex || c,
      weight: c.weight || 1,
    })),
    socialProfiles: raw.social_profiles || raw.socialProfiles,
  };

  brandCache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

export async function getProductImages(url: string, skipCache = false): Promise<ProductImage[]> {
  const domain = normalizeDomain(url);
  const cacheKey = domain;

  if (!skipCache) {
    const cached = productCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const response = await fetch(
      CONTEXT_DEV_BASE + '/products?domain=' + encodeURIComponent(domain) + '&limit=20',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      return [];
    }

    const raw = await response.json();
    const products = (raw.products || raw.items || raw || []);
    const images: ProductImage[] = [];

    for (const product of products) {
      const productImages = product.images || product.media || [];
      for (const img of productImages) {
        const imgUrl = typeof img === 'string' ? img : img.url || img.src;
        if (imgUrl) {
          images.push({
            url: imgUrl,
            alt: product.title || product.name,
            width: img.width,
            height: img.height,
          });
        }
      }
    }

    productCache.set(cacheKey, { data: images, ts: Date.now() });
    return images;
  } catch {
    return [];
  }
}

export function getFacebookProfilePicture(brandData: BrandData): string | null {
  const social = brandData.socialProfiles || [];
  const fb = social.find(p => p.platform === 'facebook' || p.platform === 'instagram');
  return fb?.profileImageUrl || null;
}
