# Design QA — Bypass prism field

## Evidence

- Source visual truth: `/Users/eva-02/.codex/generated_images/01a0054e-63ca-7c22-b5b5-2d64972a2f0e/exec-ffb693b7-33f2-4a8b-a20c-8ccc6017c0bb.png`
- Light-profile issue capture: `/var/folders/lb/4tdjw03n5_g8jqrglwwtvh5r0000gn/T/codex-clipboard-1d37c51a-ac2d-41b7-b625-7e5c6ad66f14.png` (`1588 × 628`)
- Strands light-behavior reference: `/var/folders/lb/4tdjw03n5_g8jqrglwwtvh5r0000gn/T/codex-clipboard-87cece6e-8ccf-455f-be9d-35d33762fa2e.png` (`1742 × 1545`; qualitative behavior reference, not a same-viewport layout target)
- Previous revised beam capture: `/var/folders/lb/4tdjw03n5_g8jqrglwwtvh5r0000gn/T/codex-clipboard-54633caa-8011-4e05-bbc2-69348e75cde2.png` (`2940 × 1138`)
- Current Strands target close-up: `/var/folders/lb/4tdjw03n5_g8jqrglwwtvh5r0000gn/T/codex-clipboard-1156d6bb-d6b2-4844-a333-83ae8cc6d721.png` (`2940 × 1244`; qualitative falloff and color target)
- Alignment annotation source: `/Users/eva-02/Desktop/Снимок экрана — 2026-08-18 в 17.10.07.png` (`2940 × 1638`, `@2x`)
- Alignment source normalized for comparison: `/Users/eva-02/Projects/prism-vpn/qa-prism-reference-normalized.png` (`1470 × 819`)
- Source pixels: `1672 × 941`
- Same-size implementation: `/Users/eva-02/Projects/prism-vpn/qa-prism-source-viewport.png`
- Animation midpoint: `/Users/eva-02/Projects/prism-vpn/qa-prism-desktop-mid.png`
- Active right-hand light front: `/Users/eva-02/Projects/prism-vpn/qa-prism-light-front.png`
- Desktop final state: `/Users/eva-02/Projects/prism-vpn/qa-prism-desktop-final.png`
- Active light close-up: `/Users/eva-02/Projects/prism-vpn/qa-prism-light-closeup.png` (`1120 × 420` focused crop)
- Tablet final state: `/Users/eva-02/Projects/prism-vpn/qa-prism-tablet-final.png`
- Mobile final state: `/Users/eva-02/Projects/prism-vpn/qa-prism-mobile-final.png`
- Latest aligned/faded desktop state: `/Users/eva-02/Projects/prism-vpn/qa-prism-aligned-fade.png` (`1470 × 819`)
- Primary comparison viewport: `1672 × 941` CSS px, `deviceScaleFactor: 1`; source and implementation are both `1672 × 941`, so no density normalization was required.
- Additional viewports: `1280 × 720` desktop, `768 × 900` tablet, and `390 × 844` mobile, all captured at 1:1 CSS-to-image pixels.
- State: dark landing page, `#features`, final optical-field state after the 2.45 s passage and synchronized content reveals.

The selected composition and same-size implementation were opened together in one comparison input. The previous revised beam, the current Strands close-up, and the latest implementation were also opened together in a focused comparison input. For the latest alignment pass, the user's `2940 × 1638` annotation was normalized to `1470 × 819` and opened in the same comparison input as the browser-rendered `1470 × 819` implementation. A separate animation-state pass inspected the moving reveal, active right-hand front, partially decayed afterglow, and settled frame.

## Findings

No actionable P0/P1/P2 findings remain.

- Fonts and typography: the section keeps the project's existing font stack, weights, line heights, and responsive wrapping. Copy and hierarchy match the selected direction. The wider source concept uses a different global container width; preserving the established landing container is an intentional product constraint, not drift in the new graphic.
- Spacing and layout rhythm: the first desktop prism's outer edge is now computed from the same `max-w-6xl px-6` inset as the text and transport content, rather than a fixed screen percentage. In the `1470 × 819` comparison both start at `x = 183 CSS px`. The field span is preserved at `66vw`. The mobile field uses seven gates and fits cleanly between the paragraph and transport chips without overlap.
- Colors and visual tokens: the beam uses the Strands rational distance field rather than stacked Gaussian glow layers. A `Taper = 6` longitudinal envelope concentrates thickness and luminance at the moving right-hand front, while a low persistent envelope leaves the traversed line visible. The core and falloff are now independently configurable; defaults reuse Hero's `#ffffff` core and `#b4d2ff` ice-blue glow. There is no warm tint, rainbow, or multicolor dispersion. A `13vw` symmetric edge mask darkens the entire optical composite, including the beam, contacts, and gates.
- Image quality and asset fidelity: the selected source is a concept frame for an animated graphic, not a raster asset placed in the product. The WebGL implementation reproduces its optical field analytically, stays sharp across DPRs, and avoids compression, masking seams, or canvas-edge rectangles. Contact points now retain a crisp 1–2 CSS px nucleus inside a compact corona instead of reading only as blur.
- Copy and content: heading, description, section label, and transport names match the selected visual and existing product content.
- Motion and interaction: clicking `Features` starts the one-shot passage; `unfiltered` decodes during the passage; transport chips arrive after it. Settled motion is limited to a slow local prism-group adaptation instead of replaying the intro. Off-screen rendering pauses, and reduced-motion users receive the final static state.
- Browser/runtime: desktop, tablet, and mobile routes rendered successfully in the in-app browser; no console errors or warnings were observed during the final reload-and-interaction pass.

## Comparison history

1. Initial comparison — P2: at the exact source viewport, the beam and frames sat too high, and the desktop gate field extended too far right. This weakened fidelity to the chosen composition.
2. Fix — separated the desktop frame center from the beam baseline, lowered both to their source positions, and tightened the desktop gate span. Mobile coordinates were intentionally retained.
3. Post-fix evidence — `/Users/eva-02/Projects/prism-vpn/qa-prism-source-viewport.png` shows the prism bounds, beam baseline, two deflections, and exit line aligned with the source. The `1280 × 720` and `390 × 844` captures confirm the correction does not create overlap or clipping at smaller breakpoints.
4. Light-profile refinement — P2: the first beam profile was uniform along its length and used soft Gaussian contacts, so it resembled an SVG stroke with a box-shadow and the points disappeared when inspected closely.
5. First fix — introduced a custom layered profile and rebuilt contacts as a visible nucleus, compact corona, and separate halo.
6. Second comparison — P2: `/var/folders/lb/4tdjw03n5_g8jqrglwwtvh5r0000gn/T/codex-clipboard-54633caa-8011-4e05-bbc2-69348e75cde2.png` still showed a nearly uniform blue-white stroke. Against the Strands target, it lacked the extreme thin-to-dense longitudinal transition and the broad neutral-white active-front wedge.
7. Second fix — removed the custom Gaussian core/body/bloom/haze stack and ported the relevant Strands formula almost literally: `g = thick / (d + thick * 0.45); g *= g`, `Glow = 0.7`, and a cosine envelope raised to `Taper = 6`. The moving envelope is centered at the reveal front; a restrained persistent floor remains behind it. Beam tone mapping is isolated from the gate/contact composite so the active front does not flatten. Beam, contact, and gate colors were neutralized from cool blue to warm-neutral white.
8. Post-fix evidence — `/Users/eva-02/Projects/prism-vpn/qa-prism-light-front.png` and `/Users/eva-02/Projects/prism-vpn/qa-prism-light-closeup.png` show the same visible behavior as the Strands target: an understated thin left side, a much thicker high-luminance right-hand front, and a broad neutral halo. `/Users/eva-02/Projects/prism-vpn/qa-prism-desktop-final.png` confirms that the glow decays to a visible line rather than disappearing. Tablet and mobile final-state captures show no clipping or content washout.
9. Alignment/fade comparison — P2: the annotated source showed the prism group beginning roughly `155 CSS px` to the right of the text, while the requested green boundary starts exactly with the text. The shader also faded only gate/contact details at a narrow `3.5%` edge; the separately composited beam stayed bright through the canvas boundary.
10. Fix — derive `uContentLeft` from the actual responsive container geometry, offset the first prism center by its half-width so its outer edge aligns exactly, keep the desktop center span at `0.66`, and apply the shared `uEdgeFade` mask to both `col` and `beamCol`. Split beam/contact core and glow colors into named settings, defaulting to the Hero palette.
11. Post-fix evidence — the combined `1470 × 819` comparison of `/Users/eva-02/Projects/prism-vpn/qa-prism-reference-normalized.png` and `/Users/eva-02/Projects/prism-vpn/qa-prism-aligned-fade.png` shows the first prism and text both beginning at `x = 183 CSS px`; the line now disappears gradually at both viewport edges. `/Users/eva-02/Projects/prism-vpn/qa-prism-mobile-final.png` shows that the desktop alignment calculation does not regress the portrait layout.

## Open questions

- None blocking. The generated source does not specify exact animation timing; the implemented 2.45 s passage is a product-motion decision based on the approved discussion.

## Implementation checklist

- [x] Match the approved neutral-white optical direction without blue fog or rainbow dispersion.
- [x] Replace the uniform line shadow with the Strands rational profile and tapered moving envelope.
- [x] Keep contact points visibly sharp inside their bloom.
- [x] Synchronize beam passage, word decode, and transport reveal.
- [x] Keep settled motion sparse and local.
- [x] Support desktop, mobile, off-screen pause, and reduced motion.
- [x] Verify build, lint, browser interaction, and responsive captures.
- [x] Align the first prism edge with the adaptive content inset.
- [x] Fade the complete optical composite at both horizontal edges.
- [x] Expose core, glow, contact, glass, intensity, taper, and fade settings in one editable object.

## Follow-up polish

- P3: after observing the section in the context of the full landing scroll, the idle-cycle interval could be tuned by roughly ±1–2 seconds if it feels too quiet or too noticeable. This is subjective and does not block fidelity.

final result: passed
