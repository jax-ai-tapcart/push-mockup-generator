export const GEMINI_COPY_MODEL = "gemini-2.5-flash";
export const GEMINI_SEARCH_MODEL = "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-1.5-flash";

/**
 * Read the Gemini API key. Prefers a user-provided key from localStorage,
 * falls back to the build-time env var if present, otherwise returns "".
 */
export function getGeminiApiKey(): string {
  try {
    const fromStorage =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("gemini_api_key")
        : null;
    if (fromStorage && fromStorage.trim()) return fromStorage.trim();
  } catch {
    /* localStorage may be blocked */
  }
  const fromEnv = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return fromEnv || "";
}

/**
 * Fetch from the Gemini API using a primary model. If the primary model
 * returns a 503 (model overloaded/unavailable), retry once with the
 * fallback model instead.
 */
async function fetchWithFallback(
  primaryModel: string,
  buildRequest: (model: string) => { url: string; body: object }
): Promise<Response> {
  const primary = buildRequest(primaryModel);
  const res = await fetch(primary.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(primary.body),
  });
  if (res.status === 503) {
    const fallback = buildRequest(GEMINI_FALLBACK_MODEL);
    return fetch(fallback.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fallback.body),
    });
  }
  return res;
}

export interface BrandResearchResult {
  brandName: string;
  title: string;
  body: string;
}

/**
 * Research a brand by URL and generate push notification copy.
 * Optional — used only by the "AI Copy Assist" flow.
 */
export async function researchBrand(brandUrl: string): Promise<BrandResearchResult> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API key configured");
  }

  const cleanUrl = brandUrl.trim();
  if (!cleanUrl) {
    throw new Error("Please enter a brand URL");
  }

  const prompt = `You are writing iOS push notification copy for an e-commerce brand.

Brand website: ${cleanUrl}

Research this brand and write a compelling iOS push notification.

Respond with JSON only, no markdown, no code fences:
{
  "brandName": "The brand display name (Title Case, e.g. Nike or Allbirds)",
  "title": "Push notification title, max 40 chars, compelling",
  "body": "Push notification body, max 100 chars, specific to the brand"
}`;

  const response = await fetchWithFallback(GEMINI_COPY_MODEL, (model) => ({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    body: {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    },
  }));

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = JSON.parse(text);

  if (!parsed.title || !parsed.body) {
    throw new Error("Invalid Gemini response");
  }

  return {
    brandName: parsed.brandName || brandNameFromUrl(cleanUrl),
    title: parsed.title,
    body: parsed.body,
  };
}

/**
 * Use Gemini with Google Search grounding to find product image URLs for a brand.
 * Returns up to `limit` direct image URLs (jpg/png/webp). Best-effort: the model
 * is instructed to return a raw JSON array of URLs, and we pull any URLs we find
 * out of the response text as a fallback.
 */
export async function searchProductImages(
  brandUrl: string,
  limit = 10
): Promise<string[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("No Gemini API key configured");
  }
  const cleanUrl = brandUrl.trim();
  if (!cleanUrl) {
    throw new Error("Please enter a brand URL");
  }

  const domain = domainFromUrl(cleanUrl);
  const brandName = brandNameFromUrl(cleanUrl);
  const prompt = `Search ${brandName} (${domain}) for recent lifestyle or campaign photography suitable for a mobile push notification. I'm looking for images that: show real people wearing or using the product in real-world or styled editorial settings (outdoors, at home, at an event, etc.), have strong visual energy with bold colors or dramatic lighting, feel authentic or campaign-quality rather than clinical, and where the product is visible but the overall mood and lifestyle context is the hero. Avoid: white-background studio shots, flat lay product photos, logo graphics, packaging-only images, or anything that looks like a product listing. Prioritize images from the last 6-12 months. The image should feel punchy and grab attention at small thumbnail sizes on a phone screen. Return ONLY a JSON array of up to ${limit} direct image URLs (jpg/png/webp) that are publicly accessible. No explanations, just the JSON array.`;

  const response = await fetchWithFallback(GEMINI_SEARCH_MODEL, (model) => ({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    body: {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 1 },
    },
  }));

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    throw new Error(`Gemini image search error: ${response.status}${errBody ? ` — ${errBody.slice(0, 200)}` : ""}`);
  }

  const data = await response.json();
  const parts: Array<{ text?: string }> =
    data.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text || "").join("\n");

  const urls = extractImageUrls(text);
  return dedupe(urls).slice(0, limit);
}

function extractImageUrls(text: string): string[] {
  // First try: parse a JSON array if present.
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const arr = JSON.parse(jsonMatch[0]);
      if (Array.isArray(arr)) {
        return arr.filter(
          (v): v is string => typeof v === "string" && isImageUrl(v)
        );
      }
    } catch {
      /* fall through to regex */
    }
  }
  // Fallback: regex-scan for image URLs.
  const matches = text.match(/https?:\/\/[^\s"\u0027)<>]+\.(?:jpe?g|png|webp)(?:\?[^\s"\u0027)<>]*)?/gi);
  return matches ?? [];
}

function isImageUrl(u: string): boolean {
  return /^https?:\/\/.+\.(jpe?g|png|webp)(\?.*)?$/i.test(u);
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of arr) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/**
 * Return the bare hostname for a URL (e.g. "https://www.nike.com/foo" -> "nike.com").
 * Falls back to the raw input if URL parsing fails.
 */
function domainFromUrl(url: string): string {
  try {
    const withProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`;
    const { hostname } = new URL(withProtocol);
    return hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

/**
 * Derive a reasonable brand name from a URL hostname.
 * e.g. "https://www.allbirds.com" -> "Allbirds"
 * e.g. "https://shop.nike.com" -> "Nike"
 */
export function brandNameFromUrl(url: string): string {
  try {
    const withProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`;
    const { hostname } = new URL(withProtocol);
    const stripped = hostname
      .replace(/^www\./i, "")
      .replace(/^shop\./i, "")
      .replace(/^store\./i, "")
      .replace(/\.(com|net|co|io|shop|store|org)(\..+)?$/i, "");
    const base = stripped.split(".")[0] || stripped;
    return base
      .split(/[-_]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  } catch {
    return url;
  }
}
