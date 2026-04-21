const CONTEXT_API_BASE = "https://api.context.dev/v1";

export interface BrandLogo {
  url: string;
  type: "icon" | "full" | "wordmark";
  mode: "light" | "dark" | "has_opaque_background";
  colors?: Array<{ hex: string; name?: string }>;
}

export interface BrandColor {
  hex: string;
  name?: string;
}

export interface BrandData {
  title: string;
  description?: string;
  domain: string;
  logos: BrandLogo[];
  colors: BrandColor[];
  social?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface ProductImage {
  url: string;
  alt?: string;
  title?: string;
  price?: string;
}

function getDomainKey(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function getBrandData(url: string, skipCache = false): Promise<BrandData> {
  const domain = getDomainKey(url);
  const endpoint = `${CONTEXT_API_BASE}/brand?domain=${encodeURIComponent(domain)}${skipCache ? "&skip_cache=true" : ""}`;

  const response = await fetch(endpoint, {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Context.dev API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data as BrandData;
}

export async function getProductImages(url: string, skipCache = false): Promise<ProductImage[]> {
  const domain = getDomainKey(url);
  const endpoint = `${CONTEXT_API_BASE}/products?domain=${encodeURIComponent(domain)}${skipCache ? "&skip_cache=true" : ""}`;

  const response = await fetch(endpoint, {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    // Products endpoint failing is non-fatal
    return [];
  }

  const data = await response.json();
  const products = Array.isArray(data) ? data : data.products || [];
  return products as ProductImage[];
}

export function getFacebookProfilePicture(brandData: BrandData): string | null {
  const fbUrl = brandData.social?.facebook;
  if (!fbUrl) return null;

  // Extract Facebook page ID or username from URL
  const match = fbUrl.match(/facebook\.com\/([^/?]+)/);
  if (!match) return null;

  const pageId = match[1];
  // Use the Facebook graph API CDN pattern for profile pictures
  return `https://graph.facebook.com/${pageId}/picture?type=large`;
}
