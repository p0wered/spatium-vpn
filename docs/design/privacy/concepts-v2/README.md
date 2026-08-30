# Privacy section technical graphics · iteration 2

Four browser-rendered SVG studies placed inside the split composition established in the supplied Figma screenshots.

## Variants

1. `route-record-v2`: answers two explicit questions: what changes during the connection, and what remains after it.
2. `privacy-controls`: presents IP masking, private DNS, session retention and account identity as four independent controls.
3. `observer-cards`: preserves the clarity of the observer ledger without using a plain table.
4. `data-lifecycle`: explains privacy temporally, from connection through disconnect.

## Constraints

- Desktop concept canvas: `1600 × 960`.
- The left copy, split composition, translucent panel and static light placeholder remain identical in all four variants.
- The static ridge is composition context only. It is not a proposal for the final WebGL implementation or motion.
- Technical geometry is browser-rendered SVG, not generated CGI.
- Claims about retention, RAM-only state and account fields remain provisional until checked against the implemented Spatium architecture.

## Rendered output

- `comparison-sheet.png`: all four concepts in the fixed composition.
- `route-record-v2.png`: Route / Record, second iteration.
- `privacy-controls.png`: four independent privacy controls.
- `observer-cards.png`: observer-specific visibility cards.
- `data-lifecycle.png`: connection and retention lifecycle.

Open `index.html?variant=<id>` through the project Vite server for an individual concept. Open `sheet.html` after rendering the PNG files for comparison.
