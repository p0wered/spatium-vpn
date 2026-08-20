# Design QA — Bypass POLICY / RATE interiors

## Evidence

- Source visual truth: `/Users/eva-02/.codex/generated_images/01a01f8f-a863-79e2-a1b7-aa938c241a75/exec-a42539c4-45fd-4b20-9e3e-464b0b7eb02e.png`
- Browser-rendered desktop implementation: `/Users/eva-02/Projects/prism-vpn/qa-bypass-policy-rate-desktop.png`
- Equal-size full-view comparison: `/Users/eva-02/Projects/prism-vpn/qa-bypass-policy-rate-comparison.png`
- Focused POLICY / RATE comparison: `/Users/eva-02/Projects/prism-vpn/qa-bypass-policy-rate-focus.png`
- Browser-rendered mobile implementation: `/Users/eva-02/Projects/prism-vpn/qa-bypass-policy-rate-mobile.png`
- Desktop source and implementation pixels: `1672 × 941` each.
- Desktop CSS viewport: `1672 × 941`; density normalization: equal pixel dimensions, no scaling.
- Mobile CSS viewport and pixels: `390 × 844`.
- State: Bypass section after the initial 2.45 s light passage, with the settled beam visible.

## Findings

No actionable P0/P1/P2 findings remain.

- Fonts and typography: existing Geist / Geist Mono typography, labels, sizes, spacing, wrapping, and optical hierarchy are unchanged. The shader edit introduces no text.
- Spacing and layout rhythm: module frames, gate spacing, content inset, section height, beam path, and transport layout are unchanged. The new details remain inside the existing POLICY and RATE bounds on desktop and mobile.
- Colors and visual tokens: both interiors reuse the existing cold-neutral diagram color and the established low-contrast reveal gain. Neither module emits bloom; the white beam and contact points remain the only luminous elements.
- Image quality and asset fidelity: the source concept is translated into deterministic analytic shader geometry, which stays sharp across DPRs and avoids raster artifacts. POLICY uses nine disconnected vertical samples with varied extents. RATE uses one continuous staircase path plus a deliberately weaker partial echo.
- Copy and content: all landing copy and labels are unchanged.
- Visual character: POLICY reads as a sampled field rather than circuit routing because the strokes have no connectors, pads, nodes, or common baseline. RATE reads as a continuous duration signal with discrete value levels.
- Responsive behavior: at `390 × 844`, both interiors remain legible inside narrower modules without overflow or collisions. Small DOM labels retain the existing mobile behavior.
- Runtime and accessibility: browser console contains no errors or warnings. Existing off-screen pause and `prefers-reduced-motion` behavior are unchanged.

## Intentional Differences From The Source Concept

- Only the two requested interiors were changed. The real landing layout, existing module spacing, beam amplitude, and settled contrast remain authoritative even where the generated concept differs.
- POLICY sample positions were regularized enough to render reliably at mobile width while retaining varied heights and gaps.
- RATE is implemented as a genuinely continuous polyline; the generated mock visually suggested the idea but contained breaks around the bright beam.

## Comparison History

1. The selected ImageGen direction was resolved from the explicitly attached second option.
2. POLICY and RATE were implemented in the existing WebGL shader without touching the first three module interiors or page structure.
3. Equal-size desktop and focused comparisons confirmed the new anatomies match the selected direction and remain subordinate to the beam.
4. Mobile capture confirmed the geometry scales without clipping; browser logs remained clean.
5. `npm run build`, `npm run lint`, and `git diff --check` pass. Vite reports only its pre-existing non-blocking bundle-size advisory.

## Implementation Checklist

- [x] Replace POLICY placeholder with a sparse vertical sampling field.
- [x] Replace RATE placeholder with a continuous stepped signal and faint echo.
- [x] Preserve the first three modules, frames, beam, copy, spacing, and motion behavior.
- [x] Verify desktop and mobile rendering.
- [x] Verify build, lint, diff hygiene, and browser console.

final result: passed
