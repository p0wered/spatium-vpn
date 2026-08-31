# Privacy technical graphics, iteration 4

Three browser-rendered SVG studies inside the approved production Privacy composition.

## Variants

1. `mixed-telemetry`: separate instruments for packet traffic, site source identity, tunneled DNS events, volatile RAM occupancy and persistent log writes.
2. `correlated-scope`: the same privacy evidence aligned to one clock so packet events, DNS queries, buffer pressure and absent storage writes can be read together.
3. `observer-tap-circuit`: a circuit-style schematic showing what the ISP, VPN exit and destination can tap from one route, followed by an open storage contact.

## Design correction from iteration 3

- The traces no longer repeat a binary high/low shape.
- Traffic is represented as packet pulses.
- DNS is represented as discrete query events on the VPN-resolver lane, while the local/ISP DNS lane remains empty.
- RAM is represented as varying volatile occupancy that returns to zero at disconnect.
- Activity history is represented as zero persistent writes, not another enabled/disabled state.
- The alternative direction avoids UI cards entirely and uses circuit notation, rails, taps and open contacts.

## DNS terminology

A DNS resolver maps domain names to IP addresses. Routing DNS queries through the encrypted VPN tunnel to the VPN-selected resolver prevents a separate local DNS path from exposing or allowing the ISP to tamper with those queries. In the concepts, this is shown as DNS events inside the tunnel and zero events at the local/ISP DNS tap.

## Constraints

- Canvas: `1440 × 900`.
- Production text and `720 × 600` panel geometry are preserved.
- Primary information stays legible before the right-edge fade; continuation lines may disappear beyond the panel.
- No equal card grids or nested application-interface components.
- Retention and DNS-routing claims remain design assumptions until checked against the implemented Spatium architecture.

## Rendered outputs

- `comparison-sheet.png`
- `mixed-telemetry.png`
- `correlated-scope.png`
- `observer-tap-circuit.png`
