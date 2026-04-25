# Push Notification Mockup Runbook

Everything needed to generate push notification mockups for Tapcart merchant pitches.

---

## Links

- Repo: https://github.com/jax-ai-tapcart/push-mockup-generator
- Web preview tool: https://jax-ai-tapcart.github.io/push-mockup-generator/
- Generate a mockup: https://github.com/jax-ai-tapcart/push-mockup-generator/actions/workflows/render-mockups.yml

---

## How to Generate a Mockup

Option A: Ask Jax

Message Jax: "Generate a push mockup for [brand name]"
Jax will update the script, run the workflow, and send the PNG to you in Slack.

Option B: Run it yourself

1. Go to the Generate link above
2. Click Run workflow (top right)
3. Set brand = lucchese, allbeauty, or sephora
4. Wait 45 seconds
5. Download the artifact named push-mockup-brand from the completed run

---

## What Jax Needs for Each Brand

1. Logo URL - Direct link to the brand logo image (e.g. Shopify CDN URL). Used as the 28x28px app icon.
2. Logo background color - Hex color behind the icon (e.g. #15204c for Lucchese).
3. Notification title - The bold headline (max ~40 chars).
4. Notification body - 1-2 lines of copy (max ~80 chars).
5. Hero image URL - Large lifestyle photo below the text. Must be landscape orientation and a public URL.

---

## Photo Selection Criteria

Use:
- Lifestyle or editorial shots (people, environments, mood)
- Wide or landscape orientation
- Publicly accessible URL
- High resolution (at least 800px wide)
- Visual mood that matches the brand tone

Avoid:
- Product on white backgrounds
- Images with text overlaid
- Images requiring login
- Vertical orientation

How to find hero images:
- Shopify sitemap: visit https://store.com/sitemap_collections_1.xml - images are in image:loc tags
- Brand website: right-click a lifestyle photo and Open image in new tab to get the URL
- Ask Jax to find it - Jax can scrape the sitemap automatically

---

## Brand Specs

LUCCHESE - Done
- Logo: Inline SVG wordmark - LUCCHESE in white on navy #15204c background
- Title: Handmade Since 1883.
- Body: Boots built to last a lifetime. Shop the new season.
- Hero image: https://cdn.shopify.com/s/files/1/0522/6712/2861/collections/LuccheseMens.jpg?v=1623871684
- LCDN pure prefix: cdn.shopify.com/s/files/1/0522/6712/2861/
- Brand tone: Rooted, crafted, cowboy Americana. Images: ranchers, horses, outdoors.

ALLBEAUTY - Pending
- Status: Not yet rendered at 3x. Needs brand assets added to render.js.
- Brand tone: Premium beauty, aspirational, clean, glossy. Editorial beauty shots.

SEPHORA - Pending
- Status: Not yet rendered at 3x. Needs brand assets added to render.js.
- Brand tone: Bold, inclusive, editorial. Vibrant visuals with color and energy.

---

## Technical Specs

- Renderer: Playwright via GitHub Actions
- Resolution: deviceScaleFactor 3 (output is ~1125px wide from a 375px card)
- Font: Inter (Google Fonts) - NOT SF Pro (apple-only, breaks in CI)
- Card width: 375px iPhone-sized
- Border radius: 14px
- Header padding: 8px 10px
- Icon size: 28px x 28px, border-radius 6px
- Timestamp style: 11px, color #aeaeb2
- Body text color: #3c3c3c
- Hero height: 260px
- Box shadow: 0 2px 12px rgba(0,0,0,0.15)

---

Output: Finished PNG uploaded as artifact named push-mockup-brand, downloaded by Jax, sent to you in Slack.
