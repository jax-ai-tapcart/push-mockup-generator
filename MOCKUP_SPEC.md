# Push Notification Mockup — Complete Spec & SOP
As of 2026-04-28 | Approved by Kori Martin | FINAL

---

## TRIGGER
When someone says `@Jax make me a push mockup for: <url>` → run autonomously.
Return ONLY the finished mockup image + brief asset source note (2–3 lines).
**NO intermediate messages. NO status updates. NO reasoning shown. ONE reply: the image.**

---

## SILENT EXECUTION (CRITICAL)
- Do NOT send any messages, status updates, or progress notes during the build
- Do NOT narrate what you are doing
- The ONLY output is: the final PNG + a 2–3 line caption (Logo source, Hero source, any flags)
- If something is genuinely blocked, say so clearly in one message and ask for help

---

## STEP 1 — IDENTIFY THE BRAND
1. Identify brand name and website from the URL
2. Find their Facebook page slug: search `[brand name] site:facebook.com`
3. Construct logo URL: `https://graph.facebook.com/<slug>/picture?type=large`

---

## STEP 2 — LOGO CONTAINER BACKGROUND COLOR
1. Fetch/inspect the FB profile picture
2. Identify the background color BEHIND the logo/icon — NOT the logo color itself
   - e.g. Tuckernuck compass on cream/off-white → #F2EDE6
   - e.g. Lola Blankets logo on tan → #C4A882
   - e.g. Lucchese text on dark navy → #15204C
3. This fills the icon container so the profile pic looks seamless

---

## STEP 3 — HERO IMAGE
1. Find a lifestyle/campaign hero from brand Shopify CDN:
   - Search: `[brand] cdn.shopify.com/s/files collections lifestyle`
   - Aspirational shots — people, editorial, cooking, wearing, using
   - NOT product-only, flat lays, white backgrounds
   - NOT stock/Unsplash — brand CDN only
2. If CDN blocked → flag it, ask for image URL. Do not sub in stock silently.

---

## STEP 4 — WRITE PUSH COPY
Research brand voice from website/social. Then write:

**Title:**
- Max ~28–30 chars — fits one line at 270px card width
- No ellipsis ever. If too long, write shorter.
- Bold, punchy, brand-appropriate. Ends with period.

**Body:**
- Fits exactly 2 lines at 12px font, 270px width
- No truncation, no ellipsis
- Audience = existing app users (re-engagement, new arrivals, loyalty — NOT acquisition)
- Specific, benefit-forward

---

## STEP 5 — GENERATE THE MOCKUP
- Repo: `github.com/jax-ai-tapcart/push-mockup-generator`
- Workflow: `.github/workflows/render-mockups.yml`
- Script: `.github/scripts/render.js`
- Add new brand to BRANDS object in render.js via GitHub Git API (blob → tree → commit → ref update)
- Trigger workflow dispatch with `brand=<slug>`
- Wait for run to complete, download artifact, deliver PNG via Slack

---

## CARD LAYOUT SPEC

```
CARD
  width: 270px (810px @3x)
  background: #FFFFFF
  border-radius: 20px
  box-shadow: 0 2px 16px rgba(0,0,0,.18)
  overflow: hidden

VIEWPORT (Playwright)
  width: 550, height: 700, deviceScaleFactor: 3

HEADER
  padding: 12px
  display: flex; align-items: center; gap: 10px

LOGO / APP ICON
  width: 28px; height: 28px
  border-radius: 22%
  border: 1px solid #D1D1D6  ← ALWAYS PRESENT
  overflow: hidden
  background: <sampled from FB profile pic background>
  img: object-fit: contain

TITLE
  font-size: 12px; font-weight: 600; color: #000
  white-space: nowrap; overflow: hidden (NO ellipsis)
  line-height: 1.25em; letter-spacing: -0.01em

BODY
  font-size: 12px; font-weight: 400; color: #3C3C3C
  -webkit-line-clamp: 2; overflow: hidden
  margin-top: 1px; line-height: 1.25em; letter-spacing: -0.01em

TIMESTAMP
  font-size: 10px; color: #AEAEB2
  align-self: flex-start; margin-top: 3px; flex-shrink: 0

HERO
  width: 100%; height: 268px
  object-fit: cover; display: block
  background: #F2F2F2 (fallback)

FONT: Inter (Google Fonts, weights 400+600)
```

---

## BRAND REGISTRY

| Brand | FB Slug | Icon BG | Notes |
|---|---|---|---|
| Lucchese | lucchese | #15204C | |
| PrettyLitter | prettylittercats | #11BCCA | |
| Tuckernuck | shoptuckernuck | #F2EDE6 | hero patched in workflow |
| Lola Blankets | lolablankets | #C4A882 | |
| Peter Thomas Roth | peterthomasrothofficial | #000000 | CDN blocked, use context.dev |
| GreenPan | GreenPan | #8DB82A | hero: Shopify CDN NCCC011022-001-5.jpg |

---

## CURRENT BRAND COPY

| Brand | Title | Body |
|---|---|---|
| Lucchese | Built to outlast everything. | Handcrafted boots that only get better with age. Shop now. |
| PrettyLitter | Is your cat's litter honest? | Health issues flagged early. Time to reorder. |
| Tuckernuck | Someone else wants this too. | New arrivals just landed — classic styles selling fast. |
| Lola Blankets | You'll never go back. | The plushest faux-fur blanket you'll ever own. Grab yours. |
| Peter Thomas Roth | Your skin will thank you. | Clinical actives. Real results. Shop the bestsellers. |
| GreenPan | Your kitchen deserves this. | Nonstick that lasts. PFAS-free ceramic, shop now. |

---

## QC CHECKLIST (before sending)
- [ ] Title: 1 line, no overflow, ends with period
- [ ] Body: max 2 lines, no "...", ends with period
- [ ] Logo: visible, grey border (1px solid #D1D1D6) present
- [ ] Hero: loads, lifestyle shot, matches copy theme
- [ ] Card width: 270px (patched by sed at CI runtime)

---

## WHAT NOT TO DO
- Never use stock/Unsplash without flagging it
- Never let title wrap to 2 lines
- Never use ellipsis on title or body
- Never fill logo bg with the logo color — use the FB pic background color
- Never remove the grey border from logo container
- Never send intermediate renders or WIP to anyone
- Never send status messages during the build — image only, one message
