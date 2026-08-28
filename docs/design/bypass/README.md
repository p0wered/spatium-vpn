# Bypass section: design direction

Status: Ice Ridge selected and implemented; technical graphic remains deferred.

This document records the design conclusions for `src/pages/landing/Bypass.tsx`. The generated images are silhouette and composition studies. They are not pixel-perfect promises and must only be selected if the effect can be reproduced with a small fullscreen WebGL shader.

## Product and audience

Spatium is positioned as a VPN for people who already understand the practical reality of censorship, DPI and unstable access, but the landing page must not require protocol-level knowledge to understand the benefit.

The section therefore has two communication levels:

1. The heading and paragraph explain the outcome in ordinary language.
2. A future technical graphic adds credibility and rewards a technically prepared visitor without becoming a prerequisite for understanding.

Do not bind this section to one transport or protocol. Spatium is meant to use multiple protocols, so the visual should communicate adaptation and maintained connectivity rather than a specific implementation.

## Composition system

The centered and symmetrical composition is intentional. It follows the repeated stage structure seen on Reflect: each section preserves the same centered reading rhythm, while the silhouette of the decorative object changes.

The section should keep this order:

1. Abstract WebGL accent outside the technical container.
2. Centered heading and short paragraph.
3. Large translucent container.
4. Independent technical SVG or real UI inside the container later.

The exact overlap between the first two layers may vary. The light can sit above the copy, behind the negative space around it, or between the paragraph and container. It must never reduce text contrast.

Symmetry is not the source of monotony here. Reusing the same light topology is. The site can keep a centered scaffold if each section has a recognizably different silhouette, spatial behavior and motion profile.

## Separation of roles

### Abstract layer

- WebGL or OGL fragment shader.
- Decorative and atmospheric only.
- No labels, nodes, packets, protocol names or implied process.
- Lives outside the technical container.
- May create a soft highlight that the glass shell catches.

### Technical layer

- Crisp SVG, canvas or real DOM UI.
- Explains or suggests how blocking resistance works.
- Lives inside the technical container.
- Must remain sharp and visually independent from the abstract light.
- Preferred direction for later exploration: **Connection Timeline**.

### Allowed physical interaction

The container may blur or soften the external light behind its upper edge. This is a material relationship, not a semantic merge. The technical graphic must not distort with the decorative shader.

If `backdrop-filter` is inconsistent in Safari or creates excessive GPU cost, use a second low-resolution light pass clipped to the shell as a controlled approximation. Do not implement full scene refraction.

## Abstract concept set

### Existing idea: Ice Ridge

Strengths:

- Works naturally with the top edge of the glass container.
- Easy to implement and tune.
- Matches the current cold-light palette.

Weakness:

- It is still very close to Hero's Strands topology: a luminous horizontal field reduced to one cleaner line. Removing waviness does not create a new visual family by itself.

**Selected and implemented for Bypass.** The final version uses a dedicated lightweight OGL pass rather than configuring Hero's multi-strand shader. This keeps the relationship to Hero in the light palette while making the responsive geometry and intensity independent.

Implementation notes:

- One fullscreen triangle and one fragment shader.
- A straight white core with a cold steel-blue falloff.
- Faster horizontal fade at the sides and a broader central haze.
- Subtle brightness breathing only; no waviness or positional movement.
- The lower half sits behind the translucent shell so `backdrop-filter` softens it.
- The ridge width is controlled in shader space and ends just inside the shell edges; the oversized canvas is retained only to keep the vertical bloom unclipped.
- Its entrance starts after the shell has appeared as a central ignition pulse. The horizontal decay lengthens continuously and settles into the final ridge; there is deliberately no traveling clip edge or pair of bright fronts that could read as curtains opening.
- The glass itself is never opacity-animated. A separate black veil reveals the already-final material, avoiding the `backdrop-filter` compositor jump at the end of an ancestor fade.
- The render loop pauses outside the viewport and renders one stable frame for reduced motion.
- DPR is capped at `1.25` because the effect is intentionally soft.

### Variant A: Curtain

![Curtain concept, selected revision](./concepts/curtain-v4.png)

A single symmetric membrane with two concave sides opening toward the container. The sides approach a narrow dark channel but never meet. Each side fades independently into black above.

Implementation envelope:

- One fullscreen triangle.
- One signed-distance boundary for the membrane.
- A minimum center gap that prevents the two boundaries from forming an apex.
- Two or three smooth gradient bands.
- Low-amplitude domain warp for slow breathing motion.
- A separate soft bloom term, not post-processing.

Assessment:

- Best continuity with the current Bypass composition.
- More distinct from Strands than Ice Ridge because it reads as one surface, not a family of ribbons.
- The open upper channel removes the tent-like peak and makes the silhouette feel less like a closed object.
- A broad translucent fill now illuminates almost the entire membrane. It remains brightest at the curved rims and base, then softens toward the center without becoming empty black.
- Interior fill and exterior bloom are separate parameters. The selected revision keeps the dense v3 interior but returns the narrow, restrained v2 exterior glow so the surrounding black stays clean.
- Still shares the same vertical story as Ice Ridge: light grows out of the container edge. Neighboring sections should not repeat edge-born light.
- **Archived exploration.** Curtain is no longer selected for Bypass, but the revisions remain useful references for a future section that needs a vertical membrane.

### Variant B: Halo

![Halo concept, reserved revision](./concepts/halo-v2.png)

A giant low circular arc forms an architectural canopy around the centered copy. Only a small portion of the ring is bright.

Implementation envelope:

- One fullscreen triangle.
- Circle or ellipse SDF: distance to radius plus a crop mask.
- One bright core and two soft falloff bands.
- Extremely slow radius or center drift, if any.

Assessment:

- Strongest break from Hero because its governing geometry is radial rather than linear or ribbon-based.
- The most immediately legible silhouette at a glance.
- The full high arc intentionally keeps a visible relationship with Reflect. That resemblance is accepted.
- The halo must remain the only decorative light. Do not add a separate horizontal glow above the container.
- **Reserved for a future section.** Do not use it in Bypass now.

### Variant C: Fold

![Fold concept](./concepts/fold.png)

Two broad light planes converge into a central seam above the container.

Implementation envelope:

- One fullscreen triangle.
- Two oriented SDF bands or half-plane masks.
- Smooth union near the center seam.
- Soft curvature or very low-frequency distortion to avoid rigid triangles.
- No geometry, camera or lighting engine.

Assessment:

- Most independent from both Hero and Reflect.
- Simple enough for the current stack.
- The generated version is too hard-edged and currently reads as two spotlights or a stage opening. That metaphor is not useful for bypassing censorship.
- **Rejected.** Do not continue this direction for the current landing page. The file remains only as design-history evidence.

## Current decision

1. **Bypass:** use the implemented Ice Ridge.
2. **Future reserve:** keep the full high Halo without a horizontal container glow.
3. **Future reserve:** keep Curtain v4 as a vertical light-membrane direction.
4. **Rejected:** Fold.

The earlier `curtain.png`, `curtain-v2.png`, `curtain-v3.png` and `halo.png` are retained for visual comparison. The reserved references are `curtain-v4.png` and `halo-v2.png`.

## Technical stack decision

Keep the existing `ogl` dependency for this exploration.

All four current abstract directions, including Ice Ridge, can be built with a fullscreen triangle and a fragment shader. Three.js would add bundle weight and abstraction without improving these 2D light fields.

Introduce Three.js only if a later approved direction genuinely requires at least one of the following:

- Perspective camera and real 3D geometry.
- Mesh deformation or skeletal animation.
- Multiple render passes or substantial post-processing.
- Shared 3D objects across several sections.

Do not add Three.js merely to make a shader feel more sophisticated.

## Motion and performance boundaries

- Motion exists to make the light feel alive, not to explain the bypass process.
- Prefer one slow parameter change over several independent oscillations.
- No pointer tracking is required. If added later, interpolate it outside React state and keep the response subtle.
- Stop rendering when the section is offscreen or the document is hidden.
- Cap DPR around `1.25` to `1.5` for the soft light pass.
- Use a low-resolution canvas when possible. Blur hides resolution loss.
- `prefers-reduced-motion` should render one stable frame using a chosen `staticTime`.
- Avoid particles, true volumetric fog, framebuffer feedback and full optical refraction.
- Audit the existing `backdrop-filter: blur(48px)`. A lower value or clipped duplicate pass may be cheaper and visually cleaner.

## What to do

- Keep the centered section rhythm.
- Use one dominant abstract silhouette per section.
- Keep the cold light palette already defined by the project.
- Let the glass shell catch the light only near its upper edge.
- Judge every concept first as a static black-and-white silhouette.
- Make the technical graphic understandable without watching an animation.
- Keep broad-audience copy primary and technical detail secondary.

## What not to do

- Do not combine the WebGL light and technical SVG into one explanatory diagram.
- Do not place glowing nodes, packet trails or protocol labels in the abstract layer.
- Do not reuse Strands with only different `count`, `waviness` or `thickness` values and call it a new visual.
- Do not use film-grade CGI references as an implementation target.
- Do not add a row of small dashboard cards, transport pills or decorative system labels.
- Do not make the technical drawing glow like the decorative light. It should resemble documentation, not neon UI.
- Do not fake engineering precision with invented packet counts, latency values or success percentages.
- Do not allow the accent to become brighter than the heading or erase the container edge.

## Copy note

The current source says `Build to resist blocking`. Grammatically and semantically, `Built to resist blocking` is stronger because it describes the product rather than giving the visitor an instruction. The concept images use the corrected version, but production copy should only be changed as part of the later implementation decision.

## Deferred technical graphic

The next technical exploration should start with **Connection Timeline**: one continuous connection encounters a filtering event, changes its observable shape or route, and continues. It should remain protocol-agnostic and use crisp documentation-like SVG styling.

Technical graphics are explicitly out of scope for the current concept pass.

## Next step

Keep the Ice Ridge implementation stable while designing the Connection Timeline technical graphic inside the container. Halo and Curtain remain documented but should not be implemented until another section needs their respective radial or vertical topology.
