const CONTEXT_API_BASE = "https://api.context.dev/v1";
const CONTEXT_API_KEY = import.meta.env.VITE_CONTEXT_DEV_API_KEY as string | undefined;

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

export interface BrandSocial {
  type: string;
  url: string;
}

export interface BrandData {
  title: string;
  description?: string;
  domain: string;
  logos: BrandLogo[];
  colors: BrandColor[];
  socials?: BrandSocial[];
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

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extra,
  };
  if (CONTEXT_API_KEY) {
    headers["Authorization"] = `Bearer ${CONTEXT_API_KEY}`;
  }
  return headers;
}

export async function getBrandData(url: string, skipCache = false): Promise<BrandData> {
  const domain = getDomainKey(url);
  const endpoint = `${CONTEXT_API_BASE}/brand/retrieve?domain=${encodeURIComponent(domain)}${skipCache ? "&skip_cache=true" : ""}`;

  const response = await fetch(endpoint, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Context.dev API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data.brand ?? data) as BrandData;
}

export async function getProductImages(url: string, _skipCache = false): Promise<ProductImage[]> {
  const domain = getDomainKey(url);
  const endpoint = `${CONTEXT_API_BASE}/brand/ai/products`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ domain }),
  });

  if (!response.ok) {
    // Products endpoint failing is non-fatal
    return [];
  }

  const data = await response.json();
  const products = Array.isArray(data) ? data : data.products || [];
  return products.map((product: any) => ({
    url: product.image_url || product.images?.[0] || product.url || "",
    alt: product.alt,
    title: product.name || product.title,
    price: product.price,
  })) as ProductImage[];
}

export function getFacebookProfilePicture(brandData: BrandData): string | null {
  const fb = brandData.socials?.find((s) => s.type === "facebook");
  const fbUrl = fb?.url;
  if (!fbUrl) return null;

  // Extract Facebook page ID or username from URL
  const match = fbUrl.match(/facebook\.com\/([^/?]+)/);
  if (!match) return null;

  const pageId = match[1];
  // Use the Facebook graph API CDN pattern for profile pictures
  return `https://graph.facebook.com/${pageId}/picture?type=large`;
}
