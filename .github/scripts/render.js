import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = 'mockup-output';
mkdirSync(OUT_DIR, { recursive: true });

const LUCCHESE_LOGO_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 44'%3E%3Crect width='120' height='44' fill='%2315204c'%2F%3E%3Ctext x='60' y='20' font-family='Helvetica Neue,Arial,sans-serif' font-size='11' font-weight='700' letter-spacing='2' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'%3ELUCCHESE%3C%2Ftext%3E%3C/svg%3E`;

const HERO_URL = 'https://cdn.shopify.com/s/files/1/0522/6712/2861/collections/LuccheseMens.jpg?v=1623871684';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=block" rel="stylesheet" />
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #f0f0f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
.card { width: 375px; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
.header { padding: 8px 10px; display: flex; align-items: center; gap: 8px; }
.icon { width: 28px; height: 28px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background: #15204c; display: flex; align-items: center; justify-content: center; }
.icon img { width: 100%; height: 100%; object-fit: contain; }
.text-block { flex: 1; min-width: 0; }
.title { font-size: 15px; font-weight: 600; color: #000000; line-height: 1.2em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.01em; }
.body { font-size: 15px; font-weight: 400; color: #3c3c3c; line-height: 1.2em; margin-top: 1px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; letter-spacing: -0.01em; }
.timestamp { font-size: 11px; font-weight: 400; color: #aeaeb2; align-self: flex-start; margin-top: 2px; flex-shrink: 0; }
.hero { width: 100%; height: 260px; overflow: hidden; background: #f2f2f2; }
.hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="icon"><img src="${LUCCHESE_LOGO_SVG}" alt="Lucchese" /></div>
    <div class="text-block">
      <p class="title">Handmade Since 1883.</p>
      <p class="body">Boots built to last a lifetime. Shop the new season.</p>
    </div>
    <span class="timestamp">now</span>
  </div>
  <div class="hero"><img src="${HERO_URL}" alt="" crossorigin="anonymous" /></div>
</div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 750, height: 710 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.fonts.ready.then(() => true));
await page.waitForTimeout(1000);
const card = await page.$('.card');
const outPath = join(OUT_DIR, 'push-lucchese.png');
await card.screenshot({ path: outPath, scale: 'device' });
await browser.close();
console.log('Saved: ' + outPath);
