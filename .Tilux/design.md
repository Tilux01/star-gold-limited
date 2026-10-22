# Mixtas - Design Blueprint

## 1. Aesthetic
Contemporary streetwear / modern lifestyle fashion e-commerce. Editorial, airy, high-end minimal. Flat architectural surfaces, zero rounded cards, generous white space, sharp type hierarchy with a mix of geometric sans and Didone serif accents.

## 2. Color Palette
- Page background: #FFFFFF
- Ink / primary text: #111111
- Secondary text / inactive specs: #8E8E93, #6B6B70
- Hairlines: #E9E9EB
- Product tile background: #F4F4F5
- Hero sky blue base: #0A47E8 -> #2F7BFF gradient
- Promo card 1 bg: #EFEFEF
- Promo card 2 bg: #EAEAEA
- Promo card 3 bg: #F5F5F5
- Promo card 4 (sale) bg: #53708E
- Error / sale accent: #111111

## 3. Typography
- Display / headings: geometric sans, tight tracking, weight 700 to 800. Hero H1 clamp(40px, 7vw, 96px), letter-spacing -0.03em, line-height 0.95.
- Section titles: 30px, weight 700, letter-spacing -0.01em.
- Nav links: 12px, uppercase, letter-spacing 0.08em, weight 500.
- Specs / eyebrows: 10px, uppercase, letter-spacing 0.14em, color #8E8E93.
- Product name: 14px, weight 600, #111111.
- Price: 13px, weight 600.
- Serif accent (sale number, wordmark detail): Didone style serif, weight 400, italic optional.

## 4. Layout System
- Container max-width 1320px, gutters 24px (16px mobile).
- Header: single row, height 72px, wordmark left, centered nav, right icon cluster (search, account, wishlist, bag with count). Sticky, background rgba(255,255,255,0.92) with backdrop blur, 1px bottom hairline on scroll.
- Hero: full-bleed art-directed panel, min-height 560px, content bottom-left aligned, dark neutral button on white, floating circular prev/next arrows (36px, box-shadow 0 2px 10px rgba(0,0,0,0.12)) vertically centered at the edges.
- New Arrivals: centered header, tab filter row (gap 24px, 11px uppercase), 4 column product grid, gap 24px. Product tile 1:1 aspect, bg #F4F4F5, image centered with 16px padding, border-radius 0, no shadow.
- Bento promo: 2 columns (1.15fr / 1fr), left tall card span 2 rows, right column split into a wide top card and a row of two bottom cards. Gap 24px. Card radius 0.
- Footer: 4 column link grid + newsletter + legal bar.

## 5. Components
- Primary CTA: black fill #111111, white text, padding 14px 30px, radius 4px, hover lifts to #000 with 0 6px 18px rgba(0,0,0,0.12).
- Promo CTA: white fill, black text, padding 9px 20px, radius 2px, shadow 0 1px 3px rgba(0,0,0,0.08).
- Tab: 11px uppercase, letter-spacing 0.1em, color #8E8E93, active #111111 + 2px underline offset 10px.
- Rating stars: 10px, inline, letter-spacing 2px.
- Icons: stroke 1.5px line icons (Lucide/Feather).

## 6. Motion
- Hover on product tile: image scale 1.04 over 600ms cubic-bezier(.2,.7,.2,1).
- Section reveal: 14px translateY + fade, 700ms, staggered.
- Tabs / arrows: 250ms ease transitions.

## 7. Responsive
- >=1200px: 4 column grid, bento 2 columns.
- 768-1199px: 3 then 2 column grid, bento collapses to stacked full-width cards.
- <768px: hamburger nav, 2 column product grid with 12px gap, single column promo stack, hero 72vh min 460px.


## Star Gold adaptation

Layout, spacing scale, type hierarchy and component shapes follow the reference blueprint exactly. Chromatic accents are remapped for Star Gold Limited: ink #0E0E10, espresso #1C1710, paper #FFFFFF, bone #F6F3EE, gold #C9A227, gold bright #E4C46A, line #E6E1D8. Buttons stay pill/uppercase with .12em tracking, product cards stay 4:5 with a quick view bar, sections keep 96px vertical rhythm.
