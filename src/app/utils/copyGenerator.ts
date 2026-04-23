const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_COPY_MODEL = "gemini-2.0-flash";
const GEMINI_SEARCH_MODEL = "gemini-2.0-flash";

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
  if (!GEMINI_API_KEY) {
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_COPY_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

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
  if (!GEMINI_API_KEY) {
    throw new Error("No Gemini API key configured");
  }
  const cleanUrl = brandUrl.trim();
  if (!cleanUrl) {
    throw new Error("Please enter a brand URL");
  }

  const brand = brandNameFromUrl(cleanUrl);
  const prompt = `Use Google Search to find up to ${limit} direct product image URLs for the e-commerce brand "${brand}" (${cleanUrl}).

Requirements:
- URLs must end in .jpg, .jpeg, .png, or .webp (direct image URLs, not product page URLs)
- Prefer hero/lifestyle product shots from the brand official site or its CDN
- No duplicates, no tiny thumbnails, no logos
- Return at most ${limit} URLs

Respond with ONLY a raw JSON array of URL strings, no prose, no markdown, no code fences. Example:
["https://cdn.example.com/a.jpg","https://cdn.example.com/b.jpg"]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_SEARCH_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini image search error: ${response.status}`);
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
