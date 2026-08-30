# Privacy section direction

## Production foundation

The landing now includes `src/pages/landing/Privacy.tsx` after Bypass.

- Split desktop composition: copy on the left, technical graphic container on the right.
- Heading: `Your traffic stays yours`.
- Desktop heading size matches Bypass at `64px`.
- Body: `Spatium hides your IP, keeps DNS inside the tunnel, and retains no activity history.`
- The panel uses the same translucent material and two-border construction as Bypass.
- Its fill and borders fade horizontally toward the right.
- Future diagram content remains fully opaque through `84%` of the panel and then softens to `42%` opacity at the edge, allowing continuation lines to disappear behind the composition without sacrificing primary information.
- At the wide desktop breakpoint the panel is `720px` wide, leaving a dedicated gap for the future abstract light.
- Current desktop panel height is `600px`; it may change when the selected technical graphic requires it.
- Mobile stacks copy above a `430px` empty panel with no horizontal page overflow.

The panel is intentionally empty. The abstract WebGL light and the technical graphic are separate future layers.

## Technical graphic iteration three

Do not repeat the second iteration's dashboard language:

- Avoid equal feature-card grids and pricing-like columns.
- Avoid containers nested repeatedly without a semantic reason.
- Diagram blocks should read as nodes in a technical document, not reusable interface cards.
- Use lines, spatial relationships, labels, states and transformations to carry meaning.
- Clarity remains mandatory: visual complexity cannot substitute for an explanatory model.

Earlier studies remain in `concepts/` and `concepts-v2/` as decision history, not approved production designs.
