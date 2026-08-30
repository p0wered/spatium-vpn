# Privacy technical graphics · iteration 3

Five browser-rendered SVG studies inside the approved production Privacy section composition.

## Variants

1. `observer-scopes`: measured visibility ranges around a single route, with a separate retention branch.
2. `packet-cutaway`: outer VPN header versus encrypted inner fields, followed by the exit transformation.
3. `shared-exit-topology`: several clients converging on one public exit identity and then branching to destinations.
4. `session-traces`: timeline and signal traces for IP identity, DNS, volatile state and activity history.
5. `field-transform`: explicit source, DNS and payload transformations plus a retention plane.

## Constraints

- Canvas: `1440 × 900`.
- Heading remains `64px`, matching Bypass.
- Production panel geometry is preserved: `720 × 600` with the larger text-to-panel gap.
- Primary diagram information stays fully opaque through `84%` of the panel; continuation lines soften toward the right edge.
- No equal feature-card grids, pricing-like columns or repeated nested UI containers.
- Claims about retention and account data remain provisional until checked against the implemented Spatium architecture.

Open `index.html?variant=<id>` through the project Vite server for an individual concept. Open `sheet.html` after rendering the PNG files for comparison.

## Rendered outputs

- `comparison-sheet.png`
- `observer-scopes.png`
- `packet-cutaway.png`
- `shared-exit-topology.png`
- `session-traces.png`
- `field-transform.png`
