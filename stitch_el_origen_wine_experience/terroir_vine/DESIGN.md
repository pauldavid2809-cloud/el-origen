---
name: Terroir & Vine
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#544247'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#877277'
  outline-variant: '#d9c0c6'
  surface-tint: '#9d3c63'
  primary: '#5c0531'
  on-primary: '#ffffff'
  primary-container: '#7a2048'
  on-primary-container: '#ff8cb6'
  inverse-primary: '#ffb0ca'
  secondary: '#5f5e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfdb'
  on-secondary-container: '#636260'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca730'
  on-tertiary-container: '#4f3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e3'
  primary-fixed-dim: '#ffb0ca'
  on-primary-fixed: '#3e001f'
  on-primary-fixed-variant: '#7f244c'
  secondary-fixed: '#e5e2de'
  secondary-fixed-dim: '#c8c6c2'
  on-secondary-fixed: '#1c1c1a'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

This design system embodies the essence of "El Origen"—the source. It is built for a premium, boutique wine tasting experience where the connection between the land (the mountains) and the craft (the wine) is paramount. The brand personality is sophisticated yet grounded, offering a warm and inviting atmosphere that feels exclusive but never cold.

The visual style is **Contemporary Minimalism with Editorial flair**. It prioritizes generous whitespace to evoke the openness of a vineyard landscape, paired with high-contrast typography that mirrors the refinement of vintage wine labels. Tactile elements—such as subtle paper-like textures and soft shadows—ensure the digital interface feels as premium as a physical tasting room. The design is inspired by nature, using organic alignment and a motif-driven approach where the mountain and glass lines guide the user's eye.

## Colors

The palette is rooted in the deep, rich tones of a full-bodied red wine. 

- **Primary (#7A2048):** This deep burgundy is used for core brand moments, primary actions, and key headings. It represents the "Vinotinto" identity.
- **Secondary (#F9F6F2):** A soft cream that serves as the primary background surface. It is warmer and more premium than pure white, mimicking high-quality cardstock or linen.
- **Tertiary (#D4AF37):** A muted gold used sparingly for accents, highlights, and specialized "reserve" statuses.
- **Neutral (#2C2C2C):** A soft charcoal used for body text and secondary icons to maintain high legibility without the harshness of pure black.

Use white (#FFFFFF) only for nested containers or cards to create depth against the cream background.

## Typography

The typography system relies on the contrast between the classic, high-contrast Serif (Playfair Display) and the modern, geometric Sans-Serif (Manrope). 

**Headlines** should use Playfair Display. For large display sizes, use tighter letter spacing to emphasize the editorial look. **Body text** utilizes Manrope for its exceptional legibility and neutral character, ensuring that information remains accessible. 

**Label Caps** are reserved for breadcrumbs, categories, and small metadata, always presented in uppercase with generous letter spacing to evoke the feeling of boutique luxury branding.

## Layout & Spacing

The layout philosophy is a **Fixed Grid with expansive margins**. This creates a "frame" around the content, emphasizing the boutique nature of the brand.

- **Grid:** A 12-column system for desktop, 6-column for tablet, and 2-column for mobile.
- **Rhythm:** An 8px base unit drives all padding and margin decisions. 
- **Whitespace:** Use vertical spacing aggressively (e.g., 80px - 120px between sections) to allow the imagery and typography to "breathe," reflecting the quiet serenity of a mountain vineyard.
- **Alignment:** Centralized alignment is preferred for storytelling sections, while asymmetrical layouts are used for product showcases to create visual interest.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering and Ambient Shadows**. 

1. **Base:** The Cream (#F9F6F2) surface is the lowest level.
2. **Surface:** Cards and interactive containers use White (#FFFFFF) to lift them off the cream base.
3. **Shadows:** Shadows are extremely soft and diffused, using a tint of the primary burgundy (e.g., `rgba(122, 32, 72, 0.05)`) instead of grey. This keeps the depth feeling warm and intentional.
4. **Depth Motif:** Use the mountain line from the logo as a subtle background watermark or a divider between sections to create a sense of physical layering.

## Shapes

The shape language is organic but controlled. We avoid sharp, aggressive corners in favor of "Softened Architecture."

Standard components like buttons and input fields use a **12px (rounded-lg)** radius. This specific curvature mirrors the base of a wine glass—stable but curved. For large image containers, a larger **24px (rounded-xl)** radius may be used to soften the photography of the rugged mountains.

## Components

### Buttons
- **Primary:** Solid Burgundy (#7A2048) with White text. No border. 12px radius. High-emphasis.
- **Secondary:** Transparent background with a 1px Burgundy border. Used for less critical actions.
- **Ghost:** Text-only in Burgundy with a 0.1em letter spacing. Used for "Learn More" links.

### Cards
Cards should be White (#FFFFFF) with a very light 1px border in a darkened cream tone. The "Mountain Line" motif can be used as a decorative footer or header element within the card.

### Input Fields
Soft cream background, slightly darker than the page background, with a 1px bottom border that thickens when focused. This mimics the elegance of a guestbook.

### Interactive Elements
- **Checkboxes/Radios:** Should use the Burgundy color for the "selected" state.
- **Chips:** Used for wine characteristics (e.g., "Tannic", "Fruity"). These should have a secondary cream background and small caps typography.

### Specialized Component: The "Terroir Divider"
A custom horizontal rule that incorporates the mountain peak motif in the center, used to separate major thematic sections of a page.