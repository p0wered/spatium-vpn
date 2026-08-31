# Privacy technical graphic, iteration 6

One corrected browser-rendered SVG study inside the approved production Privacy composition.

## Corrections

- Every technical element is achromatic. The SVG uses black, white and neutral grays only.
- Encrypted traffic remains a mirrored TX/RX byte histogram.
- Site identity remains a discrete shared-IP state because it is a state, not a utilization metric.
- DNS leak prevention is a paired time-series comparison: DNS activity is present inside the VPN-tunnel lane while the outside-VPN lane remains at `0 LEAKED QUERIES`.
- Session memory uses an accumulating area graph inspired by process-memory diagnostics and drops vertically to zero at disconnect.
- Activity-log telemetry was removed.
- The explanatory sentence is placed below the graphic, following the Bypass diagram composition.

## Factual boundaries

- `0 LEAKED QUERIES` assumes Spatium prevents both IPv4 and IPv6 DNS escape paths and must be validated against the final client implementation.
- `PROCESS MEMORY` is illustrative telemetry, not a claim about a fixed memory profile or absolute consumption.

## Rendered output

- `privacy-telemetry-v6.png`
