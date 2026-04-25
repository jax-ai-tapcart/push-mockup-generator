# Push Mockup Generator - Session Context

**Last updated:** 2026-04-24
**Working with:** Kori Martin

---

## What We Built

A Playwright-based GitHub Actions workflow that renders phone-style push notification mockups at 3x resolution and uploads them as artifacts.

## Repo

https://github.com/jax-ai-tapcart/push-mockup-generator

## How to Regenerate a Mockup

1. Go to: https://github.com/jax-ai-tapcart/push-mockup-generator/actions/workflows/render-mockups.yml
2. Click "Run workflow"
3. Set `brand` = `lucchese`, `allbeauty`, or `sephora`
4. Download the artifact once complete

OR tell Jax to run it -- it'll do it automatically.

## Lucchese Mockup Specs

- **App name/logo:** LUCCHESE  wordmark (inline SVG, navy #15204c background)
- **Title:** Handmade Since 1883.
- **Body:** Boots built to last a lifetime. Shop the new season.
- **Hero image:** https://cdn.shopify.com/s/files/1/0522/6712/2861/collections/LuccheseMens.jpg?v=1623871684
- **Status:** ✅ Rendered and sent to Kori

## allbeauty and Sephora

- These mockups were originally rendered by html2canvas in the web app
- They still need to be re-rendered via the Playwright workflow at 3x
- The workflow currently only has Lucchese hardcoded in render.js
- To add allbeauty and Sephora, we need to update render.js with their brand assets

## Key Technical Decisions

- **Font:** Inter (Google Fonts) instead of SF Pro Display -- SF Pro is apple-only, Inter works everywhere
- **Renderer:** Playwright (GitHub Actions) instead of html2canvas -- more reliable
- **Resolution:** deviceScaleFactor: 3 (== 3x, sharp output)
- **Card width:** 375px (iPhone-sized)
- **Header padding:** 8px 10px
- **Icon size:** 28px
- **Timestamp:** 11px, #aeaeb2
- **Border radius:** 14px

## Workflow Files

- `.github/workflows/render-mockups.yml` -- triggers Playwright render
- `.github/scripts/render.js` -- the main render script
- `src/app/NotificationCard.tsx` -- web app component (used for live preview only)

## Web App (live preview tool)

- URL: https://jax-ai-tapcart.github.io/push-mockup-generator/
- Used for interactive preview only -- export via workflow for high-res output

## Pending Work

- [ ] allbeauty mockup -- needs brand assets added to render.js and re-rendered at 3x
- [ ] Sephora mockup -- needs brand assets added to render.js and re-rendered at 3x
- [ ] Deliver all 3 to Kori
