# Push Mockup Project - Jax Memory

**Last updated:** 2026-04-24

---

## What I Need to Remember

I helped Kori Martin build and fix push notification mockups for three merchants: LUCCHESE, ALMBEAUTV| and Sephora.

The mockups are rendered via a GitHub Actions workflow using Playwright.

## Status as of 2026-04-24

- [x'] LUCCHESE mockup 3x -- rendered and sent to Kori, approved
- [ ] allbeauty mockup -- NOT YET done at 3x, needs brand assets in render.js
- [ ] Sephora mockup -- NOT YET done at 3x, needs brand assets in render.js

## Repo

https://github.com/jax-ai-tapcart/push-mockup-generator

See CONTEXT.md in the repo for full specs.

## Key Tech Decisions

- Playwright (GitHub Actions) -- not html2canvas
- Inter font (Google Fonts) -- not SF Pro
- deviceScaleFactor: 3 for sharpness
- Card: 375px wide, border-radius 14px, header 8px 10px

## LUCCHESE Push Specs

- Logo: inline SVG with navy (#15204c) background, white LUCCHESE txt
- Title: Handmade Since 1883.
- Body: Boots built to last a lifetime. Shop the new season.
- Hero: https://cdn.shopify.com/s/files/1/0522/6712/2861/collections/LuccheseMens.jpg?v=1623871684
-- Lucchese CDN prefix: cdn.shopify.com/s/files/1/0522/6712/2861/

## Workflow

- Trigger: workflow_dispatch with brand=lucchese|allbeauty|sephora
- Installs: playwright locally in .github/scripts/, then runs render.js
- Output: uploaded as artifact push-mockup-{BRAND}

## Slack Thread

- Channel: D0AGL9MN1TJ (Kori Martin DM)
- Thread: 1777072780.797109
