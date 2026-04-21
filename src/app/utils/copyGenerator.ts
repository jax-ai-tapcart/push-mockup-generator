import type { BrandData, ProductImage } from "./contextdev";

export type MessageType =
  | "new-arrivals"
  | "flash-sale"
  | "back-in-stock"
  | "limited-time"
  | "exclusive-offer"
  | "free-shipping"
  | "loyalty-reward"
  | "abandoned-cart"
  | "price-drop"
  | "seasonal";

export const MESSAGE_TYPES: Array<{ value: MessageType; label: string }> = [
  { value: "new-arrivals", label: "New Arrivals" },
  { value: "flash-sale", label: "Flash Sale" },
  { value: "back-in-stock", label: "Back in Stock" },
  { value: "limited-time", label: "Limited Time Offer" },
  { value: "exclusive-offer", label: "Exclusive Offer" },
  { value: "free-shipping", label: "Free Shipping" },
  { value: "loyalty-reward", label: "Loyalty Reward" },
  { value: "abandoned-cart", label: "Abandoned Cart" },
  { value: "price-drop", label: "Price Drop" },
  { value: "seasonal", label: "Seasonal" },
];

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = "gemini-2.5-flash";

const MESSAGE_TEMPLATES: Record<MessageType, { title: string; body: string }> = {
  "new-arrivals": {
    title: "New arrivals just dropped",
    body: "Check out what's new in our collection. Fresh styles, just for you.",
  },
  "flash-sale": {
    title: "Flash sale — limited time only",
    body: "Up to 40% off select items. Hurry, this deal won't last long.",
  },
  "back-in-stock": {
    title: "Back in stock",
    body: "Your favorites are back. Grab them before they sell out again.",
  },
  "limited-time": {
    title: "Limited time offer",
    body: "This exclusive deal expires soon. Don't miss out.",
  },
  "exclusive-offer": {
    title: "Exclusive offer for you",
    body: "As a valued customer, here's a special deal just for you.",
  },
  "free-shipping": {
    title: "Free shipping, today only",
    body: "Shop now and get free delivery on your entire order.",
  },
  "loyalty-reward": {
    title: "You've earned a reward",
    body: "Congrats! You've unlocked a special discount. Use it now.",
  },
  "abandoned-cart": {
    title: "Still thinking it over?",
    body: "You left something behind. Complete your purchase before it's gone.",
  },
  "price-drop": {
    title: "Price drop on your wishlist",
    body: "Good news — something you loved just got cheaper.",
  },
  "seasonal": {
    title: "The season's biggest sale",
    body: "Shop our seasonal collection and save big. Shop now.",
  },
};

export function getMessageTemplate(
  type: MessageType,
  productName?: string
): { title: string; body: string } {
  const template = MESSAGE_TEMPLATES[type] || MESSAGE_TEMPLATES["new-arrivals"];
  if (productName) {
    return {
      title: template.title,
      body: template.body.replace(/your favorites|something you loved|what's new/i, productName),
    };
  }
  return { ...template };
}

async function generateCopyWithGemini(
  brandData: BrandData,
  productTitle: string | undefined,
  messageType: MessageType
): Promise<{ title: string; body: string }> {
  if (!GEMINI_API_KEY) throw new Error("No Gemini API key");

  const prompt = `You are writing iOS push notification copy for an e-commerce brand.

Brand: ${brandData.title}
Brand description: ${brandData.description || "N/A"}
Product: ${productTitle || "general collection"}
Message type: ${messageType}

Write a short, engaging iOS push notification with:
- title: max 40 characters, compelling
- body: max 100 characters, specific to the brand/product

Respond with JSON only:
{"title": "...", "body": "..."}`;

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

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = JSON.parse(text);

  if (!parsed.title || !parsed.body) throw new Error("Invalid Gemini response");
  return { title: parsed.title, body: parsed.body };
}

export async function selectImageAndGenerateCopy(
  brandData: BrandData,
  products: ProductImage[],
  messageType: MessageType
): Promise<{ title: string; body: string; selectedImageUrl: string; productName?: string }> {
  // Pick a random product image if available
  let selectedImageUrl = "";
  let productName: string | undefined;

  if (products.length > 0) {
    const randomProduct = products[Math.floor(Math.random() * Math.min(products.length, 10))];
    selectedImageUrl = randomProduct.url || "";
    productName = randomProduct.title;
  }

  // Try Gemini first, fall back to templates
  let copy: { title: string; body: string };
  try {
    copy = await generateCopyWithGemini(brandData, productName, messageType);
  } catch {
    copy = getMessageTemplate(messageType, productName);
  }

  return { ...copy, selectedImageUrl, productName };
}
