const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = "gemini-2.5-flash";

export interface BrandResearchResult {
  brandName: string;
  title: string;
  body: string;
}

/**
 * Research a brand by URL and generate push notification copy.
 * Uses Gemini to infer brand name and write compelling iOS push copy.
 * Populates title/body fields that the user can then edit before generating.
 */
export async function researchBrand(brandUrl: string): Promise<BrandResearchResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("No Gemini API key — set VITE_GEMINI_API_KEY");
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
  "brandName": "The brand's display name (Title Case, e.g. 'Nike' or 'Allbirds')",
  "title": "Push notification title, max 40 chars, compelling",
  "body": "Push notification body, max 100 chars, specific to the brand"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
 * Derive a reasonable brand name from a URL hostname.
 * Strips www., splits on dots/hyphens, capitalizes words.
 * e.g. "https://www.allbirds.com" -> "Allbirds"
 * e.g. "https://shop.nike.com" -> "Nike" (drops common subdomains)
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
