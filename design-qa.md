# Design QA — Bypass DPI field

## Evidence

- Selected direction: `/Users/eva-02/.codex/generated_images/01a0199f-7a01-7402-a64b-1fd216b9e0ee/exec-7e67c4e7-9889-4b59-bb7a-2f08075c8993.png` (`1672 × 941`)
- Equal-size stable implementation: `/Users/eva-02/Projects/prism-vpn/qa-bypass-dpi-desktop-final.jpg` (`1672 × 941`)
- Equal-size combined comparison: `/Users/eva-02/Projects/prism-vpn/qa-bypass-dpi-comparison.jpg`
- Local reveal state: `/Users/eva-02/Projects/prism-vpn/qa-bypass-dpi-reveal.jpg` (`1672 × 941`)
- Tablet: `/Users/eva-02/Projects/prism-vpn/qa-bypass-dpi-tablet.jpg` (`768 × 1024`)
- Mobile: `/Users/eva-02/Projects/prism-vpn/qa-bypass-dpi-mobile.jpg` (`390 × 844`)
- State: landing page at `#features`, after the 2.45 s passage unless noted otherwise.

The selected direction and the browser-rendered implementation were normalized to the same viewport and inspected in one vertical comparison image. The moving light-front state was inspected separately because the approved interaction intentionally differs from the generated static concept: the technical construction is dim at rest and becomes more legible only near the passing beam.

## Findings

No actionable P0/P1/P2 findings remain.

- Composition and hierarchy: the implementation preserves the existing landing header, content container, section typography, transport chips, and dominant light path. Five modules replace the primitive repeated frames without competing with the headline or beam.
- Technical visual language: `SNI`, `TLS FP`, `L7`, `POLICY`, and `RATE` use distinct flat instrument anatomies—sample matrices, fingerprint fields, channels, rule grids, result slots, and a rate waveform—inside matte one-pixel enclosures. There are no glass bodies, perspective, reflections, CGI depth, or card fills.
- Light behavior: the beam and its ten contact points remain the only luminous elements. A narrow moving proximity field raises nearby outline, internal-detail, and label contrast; after passage the module returns to a readable low-contrast state. The modules do not emit bloom.
- Layout and spacing: the desktop field follows the same `max-w-6xl px-6` inset as the copy and transport row. The outer `DPI EDGE` boundary, module labels, status labels, and line remain aligned at `1672 × 941`, `768 × 1024`, and `390 × 844`. Mobile intentionally hides the small DOM labels while retaining the five technical diagrams, preventing cramped or illegible annotation.
- Typography and content: existing Geist/Geist Mono treatment and all landing copy are preserved. The new labels use the monospace technical layer consistently and do not affect semantic reading because the field is decorative.
- Color and image quality: the diagrams reuse a subdued cold-neutral token; the beam keeps its existing neutral-white core and restrained ice-blue falloff. The analytic WebGL render remains sharp across DPRs and introduces no bitmap assets, compression artifacts, or canvas seams.
- Viewport resilience: no horizontal overflow, clipping, label collision, or broken transport wrapping was observed on desktop, tablet, or mobile.
- Motion and accessibility: off-screen rendering still pauses. `prefers-reduced-motion` resolves directly to progress `1`, presenting the final static field without the passage or idle sweep.
- Runtime: the in-app browser reported no errors or warnings. `npm run build`, `npm run lint`, and `git diff --check` pass. Vite reports only the pre-existing non-blocking bundle-size advisory.

## Intentional differences from the generated concept

- The generated image is a direction, not a pixel specification. Module internals were redrawn as deterministic shader geometry rather than copied literally.
- The real landing container is retained, so the modules span the product's established content width instead of adopting the concept image's exact synthetic spacing.
- The concept shows every module at high contrast simultaneously. The approved implementation uses a dim stable state plus local optical reveal, keeping the beam as the sole strong effect.

## Comparison history

1. Initial implementation replaced twelve empty frames with five named flat DPI modules and kept the existing beam timing and section layout.
2. Browser comparison confirmed the required hierarchy, but the stable frame alone underrepresented the approved local-light behavior.
3. A moving-state capture verified that the beam front locally reveals `POLICY` and `RATE` details without making their outlines glow; after the front passes, contrast settles back down.
4. Tablet and mobile passes confirmed five modules remain visible without overflow. Small labels are removed below `sm`, while technical interiors and the line preserve the concept.
5. Final equal-size comparison found only the intentional differences listed above. No fidelity, responsiveness, runtime, or accessibility blocker remains.

## Implementation checklist

- [x] Replace primitive repeated blocks with five differentiated technical modules.
- [x] Keep the line and contact points as the only luminous elements.
- [x] Add local beam-driven reveal without glass, bloom, or 3D depth.
- [x] Retain a readable but quiet settled state.
- [x] Preserve existing copy, line timing, transport reveal, and content alignment.
- [x] Support desktop, tablet, mobile, off-screen pause, and reduced motion.
- [x] Verify equal-size visual comparison, browser logs, build, lint, and diff hygiene.

final result: passed
