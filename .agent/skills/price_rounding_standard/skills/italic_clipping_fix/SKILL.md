# Italic Text Clipping Fix (Smmplan Standard)

## Problem Description
When using premium fonts (like Inter, Outfit, or custom brand fonts) with the `italic` style or `skew` transformations, the last character of the word (especially Cyrillic characters like "Ы", "Д", "Щ" or Latin "f", "l") often gets clipped by the container boundary. This happens because the font's bounding box doesn't account for the overhang of italic glyphs.

## The "Smmplan" Solution (Standard)

### 1. The Non-Breaking Space Hack (Preferred)
The most reliable way to prevent clipping in high-performance React components is to append a thin or standard non-breaking space (`&nbsp;`) at the end of the italic text.

**React Example:**
```tsx
<span className="italic">
  {text}&nbsp;
</span>
```

**Tailwind Utility approach:**
In `index.css`, always ensure italic elements have a tiny bit of right padding:
```css
.italic {
  padding-right: 0.15em;
}
```

### 2. Framer Motion Fix
If the text is inside a `motion.div`, ensure `overflow: visible` is set on the container, or use `display: inline-block`.

## Automatic Guardrail (The Skill)
Whenever you see a user request involving **"Letter Clipping"**, **"Broken Suffix"**, or **"Italic issues"**, you MUST:
1. Identify the component (e.g., `DashboardUI.tsx`, `InstantOrder.tsx`).
2. Locates the `italic` class or `font-italic` style.
3. Manually append `\u00A0` (non-breaking space) in the code or add `pr-1` (padding-right) via Tailwind.

### Specific fixes for Smmplan:
- **Headings**: Use `italic pr-2` for large H1/H2 titles.
- **Dynamic Usernames**: Always use `{user.username}&nbsp;` in italic spans.
