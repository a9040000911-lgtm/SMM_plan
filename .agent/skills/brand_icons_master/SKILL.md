# Brand Icons Master Skill

## Purpose
This skill defines the standards and protocols for managing social media and brand icons within the Smmplan project. It ensures that all icons are "original" (authentic to the brand's official guidelines) and follow a high-premium aesthetic.

## Protocol: "Authenticity over Simplicity"
1. **No Generic Containers**: Avoid wrapping every icon in a generic circle or rectangle unless the official logo *is* a circle (e.g., Telegram's primary app icon).
2. **Official Paths**: Use exact SVG paths from official sources (Brand Guidelines) or reputable libraries like [Simple Icons](https://simpleicons.org/).
3. **Brand Gradients**: Use official multi-stop gradients (e.g., Instagram's 4-stop sunset gradient) rather than flat colors where possible in `colorMode="original"`.
4. **ViewBox Uniformity**: All icons must strictly follow the `0 0 24 24` viewBox for consistent scaling within the `BrandIcon` component.

## Implementation Checklist
- [ ] Verify SVG path against official brand assets.
- [ ] Implement `isOriginal` logic for brand-specific colors and gradients.
- [ ] Ensure `fill="currentColor"` is used for `colorMode="white"` (monochrome) to support Tailwind's text color utilities.
- [ ] Test visibility on both dark and light themes (Glassmorphism compatibility).

## Recommended Resources
- [Simple Icons](https://simpleicons.org/) - The gold standard for brand SVG paths.
- [BrandColors](https://brandcolors.net/) - For accurate hex codes.
