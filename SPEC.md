# Push Notification Mockup Design Spec

## Icon Container
- Size: 28px x 28px (84px physical at 3x)
- Shape: IOS squircle - `border-radius: 22%` (not 6px)
- Border: `1px solid rgba(0, 0, 0, 0.15)` - faint grey line around the ENTIRE container
- Overflow: hidden
- Background: brand color (set via c.bg`)

## Text
### Title
- Font-size: 15px
- Font-weight: 600
- Color: #000
- Line-height: 1.2em
- NO white-space:nowrap - title must wrap if needed

### Body
- Font-size: 15px
- Font-weight: 400
- Color: #3c3c3c
- Line-clamp: 2 (max 2 lines)

## Hero Image
- Width: 100% (full width)
- Height: 260px
- object-fit: cover
- Real lifestyle/product photo - no SVG placeholders
- Unsplash as fallback if brand CDN is locked

## Card
- Width: 375px
- Border-radius: 14px
- Background: white
- Box-shadow: 0 2px 12px rgba(0,0,0,.15)

## Viewport
- Width: 750px, Height: 710px, ScaleFactor: 3x (retina)
