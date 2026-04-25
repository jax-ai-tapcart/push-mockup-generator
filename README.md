# Push Notification Mockup Runbook

Everything needed to generate push notification mockups for Tapcart merchant pitches.

---

## Trigger Phrase (IMPORTANT)

To request a mockup, send Jax a message containing exactly this phrase:

    @Jax make me a push mockup for: [URL or brand name]

Jax will NOT make a mockup unless someone explicitly says those words. This applies to everyone on the team.

Examples:

    @Jax make me a push mockup for: https://www.lucchese.com
    @Jax make me a push mockup for: https://www.sephora.com
    @Jax make me a push mockup for: [url1] [url2] [url3+]

Optionally include notification copy if you have it:

    @Jax make me a push mockup for: https://www.brand.com
    Title: Your headline here
    Body: Your message copy here

If no copy is provided, Jax will write it based on the brand.

---

## Links

- Repo: https://github.com/jax-ai-tapcart/push-mockup-generator
- Web preview tool: https://jax-ai-tapcart.github.io/push-mockup-generator/
- Generate a mockup: https://github.com/jax-ai-tapcart/push-mockup-generator/actions/workflows/render-mockups.yml

---

## How Jax Generates a Mockup

1. Scrapes the brand site (Shopify sitemap) to find logo and hero image URLs
2. Updates .github/scripts/render.js with brand assets
3. Triggers the GitHub Actions workflow (Render Mockups)
4. Downloads the artifact PNG
5. Sends it to you directly in Slack

---

## What Jax Needs for Each Brand

1. Logo URL - Direct link to the brand logo image (Shopify CDN, etc). Used as the 28x28px app icon.
2. Logo background color - Hex color behind the icon.
3. Notification title - Bold headline, max ~40 chars.
4. Notification body - 1-2 lines of copy, max ~80 chars.
5. Hero image URL - Lifestyle photo, landscape, public URL.

---

## Photo Selection Criteria

Use:
- Lifestyle or editorial shots (people, environments, mood)
- Wide or landscape orientation
- Publicly accessible URL
- High resolution (at least 800px wide)

Avoid:
- Product on white backgrounds
- Images with text overlaid
- Images requiring login
- Vertical orientation

How to find hero images:
- Shopify sitemap: visit https://store.com/sitemap_collections_1.xml - images are in image:loc tags
- Brand website: right-click a lifestyle photo and Open image in new tab
- Jax can find it automatically from a URL

---

## Brand Specs

LUCCHESE - Done
- Logo: Inline SVG wordmark - LUCCHESE in white on navy #15204c
- Title: Handmade Since 1883.
- Body: Boots built to last a lifetime. Shop the new season.
- Hero image: https://cdn.shopify.com/s/files/1/0522/6712/2861/collections/LuccheseMens.jpg?v=1623871684
- Shopify CDN prefix: cdn.shopify.com/s/files/1/0522/6712/2861/
- Brand tone: Rooted, crafted, cowboy Americana. Images: ranchers, horses, outdoors.

ALLBEAUTY - Pending
- Status: Needs brand assets added to render.js and re-rendered at 3x
- Brand tone: Premium beauty, aspirational, clean, glossy. Editorial beauty shots.

SEPHORA - Pending
- Status: Needs brand assets added to render.js and re-rendered at 3x
- Brand tone: Bold, inclusive, editorial. Vibrant visuals with color and energy.

---

## Technical Specs

- Renderer: Playwright via GitHub Actions
- Resolution: deviceScaleFactor 3 (output is ~1125px wide from a 375px card)
- Font: Inter (Google Fonts) - NOT SF Pro (apple-only, breaks in CI)
- Card width: 375px
- Border radius: 14px
- Header padding: 8px 10px
- Icon size: 28px x 28px, border-radius 6px
- Timestamp style: 11px, color #aeaeb2
- Body text color: #3c3c3c
- Hero height: 260px
- Box shadow: 0 2px 12px rgba(0,0,0,0.15)
