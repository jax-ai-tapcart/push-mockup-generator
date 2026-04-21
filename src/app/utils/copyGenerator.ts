import type { BrandData, ProductImage } from './contextdev';

export type MessageType =
  | 'new-arrivals'
  | 'flash-sale'
  | 'back-in-stock'
  | 'limited-time'
  | 'exclusive'
  | 'best-sellers'
  | 'seasonal'
  | 'loyalty';

export const MESSAGE_TYPES: Array<{ value: MessageType; label: string }> = [
  { value: 'new-arrivals', label: 'New Arrivals' },
  { value: 'flash-sale', label: 'Flash Sale' },
  { value: 'back-in-stock', label: 'Back In Stock' },
  { value: 'limited-time', label: 'Limited Time Offer' },
  { value: 'exclusive', label: 'Exclusive Drop' },
  { value: 'best-sellers', label: 'Best Sellers' },
  { value: 'seasonal', label: 'Seasonal Collection' },
  { value: 'loyalty', label: 'Member Reward' },
];

const TEMPLATES: Record<MessageType, (productName?: string) => { title: string; body: string }> = {
  'new-arrivals': (p) => ({
    title: p ? 'New: ' + p + ' is here u2728' : 'New arrivals just dropped u2728',
    body: p ? 'Shop ' + p + ' before it sells out.' : 'Fresh styles added to the store. Shop now.',
  }),
  'flash-sale': (p) => ({
    title: p ? p + ' on sale u26a1' : 'Flash sale u2014 today only u26a1',
    body: p ? p + ' is part of our flash sale. Don't miss it.' : 'Up to 400ff u2014 ends tonight. Grab it now.',
  }),
  'back-in-stock': (p) => ({
    title: p ? p + ' is back ud83dude4c' : 'Back in stock ud83dude4c',
    body: p ? p + ' is available again. Grab yours before it's gone.' : 'Your wishlist item is available again.',
  }),
  'limited-time': (p) => ({
    title: p ? p + ' u2014 limited offer u23f0' : 'Limited time offer u23f0',
    body: p ? 'Get ' + p + ' at a special price u2014 offer ends soon.' : 'This deal wonu2019t last long. Shop now.',
  }),
  'exclusive': (p) => ({
    title: p ? 'Exclusive: ' + p + ' ud83dudd12' : 'Exclusive drop ud83dudd12',
    body: p ? p + ' is exclusively yours u2014 members only.' : 'Only for our VIP members. Unlock your access.',
  }),
  'best-sellers': (p) => ({
    title: p ? p + ' is a fan fave u2b50' : 'Our best sellers u2b50',
    body: p ? 'See why everyone loves ' + p + '.' : 'Discover what everyone is buying right now.',
  }),
  'seasonal': (p) => ({
    title: p ? p + ' u2014 the seasonu2019s pick ud83cudf43' : 'Seasonal collection is live ud83cudf43',
    body: p ? 'Perfect for the season: ' + p + '. Shop it now.' : 'Shop our seasonal edit u2014 curated for right now.',
  }),
  'loyalty': (_p) => ({
    title: 'Your reward is waiting ud83cudf81',
    body: 'Youu2019ve earned points. Redeem them for something special.',
  }),
};

export function getMessageTemplate(
  type: MessageType,
  productName?: string
): { title: string; body: string } {
  return TEMPLATES[type]?.(productName) ?? TEMPLATES['new-arrivals'](productName);
}

export interface GeneratedCopy {
  title: string;
  body: string;
  selectedImageUrl: string;
  productName?: string;
}

function pickBestImage(images: ProductImage[]): string {
  // Prefer landscape images (wider than tall) over square/portrait
  // Avoid tiny thumbnails
  const candidates = images.filter((img) => {
    if (!img.url) return false;
    // Skip tiny images if dimensions known
    if (img.width && img.height) {
      if (img.width < 200 || img.height < 100) return false;
    }
    return true;
  });

  // Prefer landscape
  const landscape = candidates.filter(
    (img) => img.width && img.height && img.width > img.height
  );
  const pool = landscape.length > 0 ? landscape : candidates;

  if (pool.length === 0 && images.length > 0) return images[0].url;
  if (pool.length === 0) return '';

  return pool[Math.floor(Math.random() * Math.min(pool.length, 5))].url;
}

export async function selectImageAndGenerateCopy(
  brandData: BrandData,
  products: ProductImage[],
  messageType: MessageType
): Promise<GeneratedCopy> {
  const selectedImageUrl = pickBestImage(products);
  const productName = products.find((p) => p.alt && p.url === selectedImageUrl)?.alt;
  const copy = getMessageTemplate(messageType, productName);

  return {
    title: copy.title,
    body: copy.body,
    selectedImageUrl,
    productName,
  };
}
