# Design QA — Bypass contact points

## Evidence

- Source visual truth: `/Users/eva-02/Projects/prism-vpn/qa-bypass-contact-points-before.png`
- Browser-rendered implementation: `/Users/eva-02/Projects/prism-vpn/qa-bypass-contact-points-viewport.png`
- Focused implementation crop: `/Users/eva-02/Projects/prism-vpn/qa-bypass-contact-points-after.png`
- Same-input before/after comparison: `/Users/eva-02/Projects/prism-vpn/qa-bypass-contact-points-comparison.png`
- Browser viewport: `1408 × 900` CSS px at `devicePixelRatio: 1`.
- Source and focused implementation pixels: `1408 × 436` each; no density scaling.
- Full viewport implementation pixels: `1408 × 900`.
- State: Bypass section after the 2.45 s introductory passage, with the settled beam visible.
- Primary behavior checked: scroll into the Bypass section and completion of the beam reveal.
- Browser console: no warnings or errors.

## Findings

No actionable P0/P1/P2 findings remain for the requested alignment correction.

- Contact geometry: every entry and exit pearl now uses the exact same module half-width as its rounded frame, so each pearl center and each beam segment endpoint lies on the vertical outline. The previous `0.94` multiplier visibly inset both contacts.
- Fonts and typography: unchanged; the existing Geist and Geist Mono rendering, labels, wrapping, and hierarchy are preserved.
- Spacing and layout rhythm: module positions, sizes, gaps, section spacing, and path heights are unchanged. Only horizontal contact coordinates moved to the outlines.
- Colors and visual tokens: unchanged; beam, contact glow, frame, and diagram colors retain their existing tokens and opacity behavior.
- Image quality and asset fidelity: the browser-rendered WebGL field remains sharp at the tested DPR; the correction introduces no scaling, raster substitution, or bloom clipping.
- Copy and content: unchanged.
- Responsive logic: desktop and mobile use the same exact-width contact calculation; the existing mobile half-width remains authoritative. The in-app browser did not expose a smaller responsive viewport during this run, so the current mobile state was not separately captured.

## Comparison History

1. The attached source crop showed contact pearls inset from the visible vertical outlines.
2. Code inspection found the path and contact loops both using `moduleHalfWidth(fi) * 0.94`, while the frames used `moduleHalfWidth(fi)`.
3. Both loops were changed to the exact frame half-width.
4. The post-fix browser capture shows all ten contact centers aligned with their corresponding vertical outlines; the same-input comparison records the visible correction.
5. `npm run build`, `npm run lint`, and `git diff --check` pass.

## Implementation Checklist

- [x] Align beam entry/exit endpoints with module outlines.
- [x] Align contact-light centers with the same endpoints.
- [x] Preserve frame geometry, path height, copy, color, animation, and section layout.
- [x] Verify settled desktop rendering and browser console.
- [x] Verify build, lint, and diff hygiene.

final result: passed
