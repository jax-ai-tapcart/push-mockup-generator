// scripts/render.mjs — Headless PNG renderer via Playwright
// Usage: node scripts/render.mjs \
//   --logoUrl <url> --heroUrl <url> --title <text> --body <text>
//   [--logoBg <color>] [--output <path>]
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

cnst args = process.argv.slice(2);
const getArg = name => { const i = args.indexOf(`--${name}`); return i !== -1 ? args[i + 1] : null; };

const logoUrl = getArg('logoUrl');
const heroUrl = getArg('heroUrl');
const title = getArg('title');
const body = getArg('body');
const logoBg = getArg('logoBg') || '#FFFFFF';
const outputPath = getArg('output') || './out/push.png';

if (!logoUrl || !heroUrl || !title || !body) {
  console.error('Missing one of: --logoUrl --heroUrl --title --body');
  process.exit(1);
}

(async () => {
  const params = new URLSearchParams({ logoUrl, heroUrl, title, body, logoBg });
  const pageUrl = `https://tapcartinc.github.io/push-mockup-generator/?${params}`;
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-export-ready="true"]', { timeout: 20000 });
  
  console.log('💹 Page ready, exporting...');
  
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    page.click('[data-export-btn]'),
  ]);
  
  const stream = await dl.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const buffer = Buffer.concat(chunks);
  
  mkdirSync(dirname(resolve(outputPath)), { recursive: true });
  writeFileSync(outputPath, buffer);
  console.log(`😊 Saved: ${outputPath}`);
  await browser.close();
})();
