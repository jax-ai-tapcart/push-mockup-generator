# Push Notification Mockup Spec   Approved 2026-04-27

## Card Dimensions
- Width: **270px** (810px @3x)
- Border-radius: **20px* ( 60px @3x   iOS squircle)
- Box-shadow: 0 2px 16px rgba(0,0,0,.18)
- Viewport: width:550, height:700, deviceScaleFactor:3
- Aspect ratio: portrait ~4:5 (matches real iOS rich push)

## Header
- Padding: 12px all sides
- Display: flex, align-items: center, gap: 10px

## App Icon / Logo Container
- Size: **28px * 28px** (84px@3x)
- Border-radius: 22% (squircle)
- **NO border** (removed border:1px solid #d1d1d6)
- Logo source: `graph.facebook.com/<page_slug>/picture?type=large`
- object-fit: **contain** (show full FB profile pic, no cropping)
- Container background: **sampled from FB profile pic's background color** (NOT logo color)
  - Tuckernuck: #f2ede6 (cream)
  - Lola: #C4A882 (tan)
  - Makes icon seamless - no visible edges

## Text Rules
- Title: 12px, weight 600, color #000, white-space:nowrap (hard 1 line)
  - **Max ~28-30 chars** - no ellipsis ever, shorten copy instead
- Body: 12px, weight 400, color #3c3c3c, -webkit-line-clamp:2 (hard 2 lines)
- Timestamp "now": 10px, color #aeaeb2

## Hero Image
- Height: **268px** (804px @3x), width: 100%, object-fit: cover
- Source: Shopify CDN (cdn.shopify.com/s/files/...)
- Prefer: lifestyle/campaign couples or aspirational scenes (not product shots)

## How to Find Assets
1. Logo: `graph.facebook.com/<page_slug>/picture?type=large`
   - Find slug: search "[brand name] site:facebook.com"
2. Hero: Search "[brand] cdn.shopify.com collections lifestyle"
3. Logo container bg: sample the FB profile pic background color

## Brand Registry
| Brand | FB Slug | Logo BG | Notes |
|-slam-|---------|--------|-------|
| lucchese | lucchese | #15204c | dark navy |
| prettylitter | prettylittercats | #11BCCA | teal |
| vnuck | shoptuckernuck | #f2ede6 | cream; hero = bougainvillea couple |
| lola | lolablankets | #C4A882 | tan |
| rtr | peterthomasrothofficial | #000000 | black; Cloudflare blocks CDN |
