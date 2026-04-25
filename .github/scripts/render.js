/**
 * Playwright script to render push notification mockups as PNG files.
 * Usage: node .github/scripts/render.js <brand>
 */

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const OUT_DIR = 'mockup-output';
mkdirSync(OUT_DIR, { recursive: true });

const BRANDS = {
  lucchese: {
    name: 'Lucchese',
    logoUrl: 'https://cdn.shopify.com/s/files/1/0551/8834/1374/files/Lucchese_Logo_2023_whitebg.png',
    logoBgcolor: '#FFFFFF',
    title: 'Handmade Since 1883.',
    body: 'Boots built to last a lifetime. Shop the new season.',
    heroUrl: 'https://cdn.shopify.com/s/files/1/0551/8834/1374/files/Lucchese_Lifestyle_Boots_2024.jpg',
  },
  allbeauty: {
    name: 'allbeauty',
    logoUrl: 'https://cdn.shopify.com/s/files/1/0618/4264/0113/files/allbeauty_logo_new.png',
    logoBgcolor: '#000000',
    title: 'Beauty at Prices You\'ll Love',
    body: 'Top brands, unbeatable prices. Shop now and save big.',
    heroUrl: 'https://cdn.shopify.com/s/files/1/0618/4264/0113/files/allbeauty_hero.jpg',
  },
  sephora: {
    name: 'Sephora',
    logoUrl: 'https://www.sephora.com/img/uix/logo/sephora_logo_white.svg',
    logoBgcolor: '#000000',
    title: 'Just Dropped ✩ New Arrivals',
    body: 'New beauty finds you didn\'t know you needed.',
    heroUrl: 'https://www.sephora.com/img/banners/homepage-banner_2024.jpg',
  },
};

function getHTML.brand) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=block" rel="stylesheet" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
.card {
  width: 375px;
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}
.header {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: ${brand.logoBgcolor};
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.text-block {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 15px;
  font-weight: 600;
  color: #000000;
  line-height: 1.2em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}
.body {
  font-size: 15px;
  font-weight: 400;
  color: #3c3c3c;
  line-height: 1.2em;
  margin-top: 1px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.01em;
}
.timestamp {
  font-size: 11px;
  font-weight: 400;
  color: #aeaeb2;
  align-self: flex-start;
  margin-top: 2px;
  flex-shrink: 0;
}
.hero {
  width: 100%;
  height: 260px;
  overflow: hidden;
  background: #f2f2f2;
}
.hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="icon">
      <img src="${brand.logoUrl}" alt="${brand.name}" crossorigin="anonymous" />
    </div>
    <div class="text-block">
      <p class="title">${brand.title}</p>
      <p class="body">${brand.body}</p>
    </div>
    <span class="timestamp">now</span>
  </div>
  <div class="hero">
    <img src="${brand.heroUrl}" alt="" crossorigin="anonymous" />
  </div>
</div>
</body>
</html>`;
}

async function main() {
  const brandKey = process.argv[2] || 'lucchese';
  const brand = BRANDS[brandKey];
  if (!brand) {
    console.error(`Unknown brand: ${brandKey}. Available: ${Object.keys(BRANDS).join(', ')}`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to match card size @ 2x
  await page.setViewportSize({ width: 750, height: 710 });

  const html = getHTML(brand);
  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for fonts and images
  await page.waitForFunction(() => document.fonts.ready.then(() => true));
  await page.waitForTimeout(500);

  // Screenshot just the card element
  const card = await page.$('.card');
  const outputPath = join(OUT_DIR, `push-${brandKey}.png`);
  await card.screenshot({ path: outputPath, scale: 'device' });

  await browser.close();
  console.log(`Saved: ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
