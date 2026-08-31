const W = 1440
const H = 900

function defs() {
  return `<defs>
    <linearGradient id="title-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" />
      <stop offset="1" stop-color="#bcbcbc" />
    </linearGradient>
    <linearGradient id="shell-fill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#111318" stop-opacity=".82" />
      <stop offset=".62" stop-color="#0b0c0e" stop-opacity=".82" />
      <stop offset=".8" stop-color="#090a0c" stop-opacity=".6" />
      <stop offset="1" stop-color="#000" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="shell-border" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".14" />
      <stop offset=".65" stop-color="#fff" stop-opacity=".1" />
      <stop offset="1" stop-color="#fff" stop-opacity="0" />
    </linearGradient>
    <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#dce7ff" fill-opacity=".065" /></pattern>
    <filter id="dot-glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L8 5L1 9" fill="none" stroke="#999" stroke-opacity=".72" stroke-width="1.2" /></marker>
    <clipPath id="panel-clip"><rect x="618" y="150" width="720" height="600" rx="24" /></clipPath>
    <linearGradient id="diagram-mask-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="white"/><stop offset=".84" stop-color="white"/><stop offset=".93" stop-color="white" stop-opacity=".82"/><stop offset="1" stop-color="white" stop-opacity=".42"/></linearGradient>
    <mask id="diagram-mask"><rect x="618" y="150" width="720" height="600" fill="url(#diagram-mask-gradient)" /></mask>
  </defs>`
}

function networkBars() {
  const tx = [10, 22, 15, 34, 18, 27, 12, 39, 26, 18, 31, 14, 24, 36, 19, 28, 12, 32, 20, 16, 27, 11, 23, 18]
  const rx = [8, 14, 20, 12, 26, 17, 9, 24, 15, 28, 16, 11, 22, 18, 30, 13, 20, 15, 25, 10, 19, 14, 21, 9]
  return tx.map((height, index) => {
    const x = 812 + index * 20
    return `<rect class="bar-tx" x="${x}" y="${334 - height}" width="7" height="${height}" />
      <rect class="bar-rx" x="${x + 8}" y="338" width="7" height="${rx[index]}" />`
  }).join('')
}

function concept() {
  return `<svg class="concept" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Privacy telemetry showing encrypted network throughput, shared exit identity, DNS leak prevention, volatile session memory and zero activity log writes">
    ${defs()}
    <rect width="1440" height="900" fill="#000" />
    <text class="title" x="102" y="268"><tspan x="102">Your traffic</tspan><tspan x="102" dy="68">stays yours</tspan></text>
    <text class="body" x="102" y="672"><tspan x="102">Spatium hides your IP, keeps DNS inside the tunnel,</tspan><tspan x="102" dy="27">and retains no activity history.</tspan></text>
    <rect x="618" y="150" width="720" height="600" rx="24" fill="url(#shell-fill)" stroke="url(#shell-border)" />
    <rect x="630" y="162" width="696" height="576" rx="16" fill="rgb(0 0 0 / .26)" stroke="url(#shell-border)" />
    <rect x="630" y="162" width="696" height="576" rx="16" fill="url(#dots)" />

    <g clip-path="url(#panel-clip)" mask="url(#diagram-mask)">
      <text class="eyebrow" x="654" y="198">SESSION PRIVACY TELEMETRY</text>
      <text class="eyebrow" x="1302" y="198" text-anchor="end">ROUTE / RESOLUTION / RETENTION</text>
      <path class="hairline" d="M654 218H1302" />

      <path class="wire-dim" d="M802 254H1302" />
      <path class="wire-dim" d="M828 246V262M1052 246V262M1278 246V262" />
      <text class="eyebrow" x="828" y="238" text-anchor="middle">CONNECT</text>
      <text class="eyebrow" x="1052" y="238" text-anchor="middle">LIVE SESSION</text>
      <text class="eyebrow" x="1278" y="238" text-anchor="middle">DISCONNECT</text>

      <text class="label" x="654" y="298">ENCRYPTED TRAFFIC</text>
      <text class="tiny" x="760" y="316">TX</text>
      <text class="tiny" x="760" y="356">RX</text>
      <path class="hairline" d="M802 336H1304" />
      ${networkBars()}
      <text class="dim" x="1304" y="298" text-anchor="end">BYTES / INTERVAL</text>

      <text class="label" x="654" y="394">SITE SOURCE</text>
      <path class="hairline" d="M802 404H1304" />
      <path class="wire" d="M802 404H828V386H1278V404H1304" />
      <text class="value" x="852" y="382">SHARED EXIT IP</text>
      <text class="dim" x="1304" y="394" text-anchor="end">REAL IP ABSENT</text>

      <text class="label" x="654" y="452">DNS ROUTE</text>
      <circle class="dot" cx="810" cy="470" r="2.6" />
      <text class="tiny" x="782" y="494">SYSTEM QUERY</text>
      <path class="wire" d="M814 470H872" marker-end="url(#arrow)" />
      <rect class="gate" x="882" y="452" width="86" height="36" rx="7" />
      <text class="tiny" x="925" y="467" text-anchor="middle">ROUTE +</text>
      <text class="tiny" x="925" y="479" text-anchor="middle">FIREWALL</text>
      <path class="wire" d="M968 470H1120" />
      <text class="tiny" x="1000" y="456">IPv4 / SUPPORTED IPv6</text>
      <text class="note" x="1134" y="466">VPN TUNNEL</text>
      <path class="wire" d="M1120 470H1220" marker-end="url(#arrow)" />
      <circle class="dot" cx="1230" cy="470" r="2.6" />
      <text class="value" x="1244" y="474">VPN DNS</text>

      <path class="wire-dashed" d="M925 488V522H1174" />
      <path class="strike" d="M1164 514L1182 532M1182 514L1164 532" />
      <text class="tiny" x="925" y="540">OUTSIDE VPN: ISP DNS + UNSUPPORTED IPv6 BLOCKED</text>

      <text class="label" x="654" y="570">SESSION MEMORY</text>
      <path class="hairline" d="M802 588H1304" />
      <path class="step-fill" d="M802 588H828V576H860V580H900V564H936V570H974V554H1012V562H1052V548H1090V566H1130V558H1168V574H1208V564H1246V578H1278V588H1304V588Z" />
      <path class="step-line" d="M802 588H828V576H860V580H900V564H936V570H974V554H1012V562H1052V548H1090V566H1130V558H1168V574H1208V564H1246V578H1278V588H1304" />
      <text class="tiny" x="802" y="608">SESSION BUFFER · ALLOCATED BYTES</text>
      <text class="dim" x="1304" y="570" text-anchor="end">RELEASED AT DISCONNECT</text>

      <text class="label" x="654" y="638">ACTIVITY LOG WRITES</text>
      <path class="hairline" d="M802 646H1304" />
      <path class="wire-dashed" d="M802 646H1390" />
      <circle class="open-contact" cx="866" cy="646" r="4" /><circle class="open-contact" cx="946" cy="646" r="4" /><circle class="open-contact" cx="1030" cy="646" r="4" /><circle class="open-contact" cx="1114" cy="646" r="4" /><circle class="open-contact" cx="1198" cy="646" r="4" /><circle class="open-contact" cx="1278" cy="646" r="4" />
      <text class="value" x="1278" y="634" text-anchor="end">0 WRITES</text>

      <path class="hairline" d="M654 674H1302" />
      <text class="caption" x="654" y="710">A shared identity leaves the tunnel while DNS and session state stay contained.</text>
    </g>
  </svg>`
}

document.getElementById('concept-root').innerHTML = concept()
