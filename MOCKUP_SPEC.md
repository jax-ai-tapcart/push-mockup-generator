# Push Notification Mockup Spec   Approved 2026-04-27

## Card Dimensions
- Width: **270px** (810px @3x)
- Border-radius: **20px** (60px @3x   iOS squircle)
- Box-shadow: 0 2px 16px rgba(0,0,0,.18)
- Viewport: width:550, height:700, deviceScaleFactor:3
- Aspect ratio: portrait ~5:6 (matches real iOS rich push)

## Header
- Padding: 12px all sides
- Display: flex, align-items: center, gap: 10px

## App Icon / Logo Container
- Size: **28px * 28px** (84px@3x)
- Border-radius: 22% (squircle)
- **Border: 1px solid #d1d1d6** (keep it -- visible on light bgs, ok to be invisible on dark bgs)
- Logo source: `graph.facebook.com/<page_slug>/picture?type=large`
- object-fit: **contain** (show full FB profile pic, no cropping)
- Container background: **sampled from FB profile pic's background color** (NOT logo color)
  - Tuckernuck: #f2ede6 (cream)
  - Lola: #C4A882 (tan)
  - PTR: #000000 (back -- matches PTR logo bg)
  - Makes icon seamless - no visible edges where possible

## Text Rules
- Title: 12px, weight 600, color #000, white-space:nowrap (hard 1 line)
  - **Max ~28-30 chars** - no ellipsis ever, shorten copy instead
- Body: 12px, weight 400, color #3c3c3c, -webkit-line-clamp:2 (hard 2 lines)
- Timestamp "now": 10px, color #aeaeb2

## Hero Image
- Height: **268px** (804px @3x), width: 100%, object-fit: cover
- Prefer: lifestyle/campaign scenes, models, aspirational images
- Product-only shots are ok, but see Copy-Image Matching rule below

## Copy-Image Matching Rule (APPROVED 2026-04-27)
The text must match what's in the image.

| Image Type | Copy Rule | Example |
|-----------|-----------|-----------|
| Lifestyle/aspirational (people, mood, setting) | Generic brand copy fine | "Wherever life takes you." with a lifestyle shot |
| Product/specific item/formula shot | Copy must reference that product/category directly | "Skin-transforming formulas." with PTR texture swatch shot |
| Collection/multi-product shot | Copy references the collection or product category | Blankets shot → "The plushest faux-fur blankets." |

**TL;DR:** Don't put generic brand copy on a specific product image. They must tell the same story.

## How to Find Assets
3-step waaterfall (most to least preferred):

1. **Direct Shopify CDN** (free, instant)
   - Search "[brand] cdn.shopify.com collections lifestyle"
   - Logo: `graph.facebook.com/<page_slug>/picture?type=large`
   - Find slug: search "[brand name] site:facebook.com"

2. **Social media graph URLs** (usually accessible)

3. **context.dev web scrape images** (last resort, 1 credit/call)
   - `GET https://api.context.dev/v1/web/scrape/images?url=<brand-homepage>`
   - Auth: `Authorization: Bearer <key>` (stored in Keychain)
   - Use only when direct fetch is Cloudflare-blocked
   - After scraping: visually review images, pick best for context
   - Apply Copy-Image Matching rule based on what was found

## Brand Registry
| Brand | FB Slug | Logo BG | Notes |
|-------|---------|--------|-------|
| lucchese | lucchese | #15204c | dark navy |
| prettylitter | prettylittercats | #11BCCA | teal |
| tnuck | shoptuckernuck | #f2ede6 | cream; hero = bougainvillea couple |
| lola | lolablankets | #C4A882 | tan |
| ptr | peterthomasrothofficial | #000000 | black; Cloudflare-blocked - use context.dev scrape; hero = texture swatch shot; copy = formula-focused |
