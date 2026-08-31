const W = 1440
const H = 900

function defs() {
  return `<defs>
    <linearGradient id="title-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" />
      <stop offset="1" stop-color="#bcbcbc" />
    </linearGradient>
    <linearGradient id="shell-fill" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#111111" stop-opacity=".82" />
      <stop offset=".62" stop-color="#0c0c0c" stop-opacity=".82" />
      <stop offset=".8" stop-color="#090909" stop-opacity=".6" />
      <stop offset="1" stop-color="#000" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="shell-border" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity=".14" />
      <stop offset=".65" stop-color="#fff" stop-opacity=".1" />
      <stop offset="1" stop-color="#fff" stop-opacity="0" />
    </linearGradient>
    <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#fff" fill-opacity=".055" /></pattern>
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

function dnsBars() {
  const events = [10, 18, 12, 22, 14, 8, 20, 15, 24, 11, 17, 9, 21, 13, 19, 10, 16, 8, 14, 7]
  return events.map((height, index) => {
    const x = 834 + index * 22
    return `<rect class="dns-bar" x="${x}" y="${490 - height}" width="6" height="${height}" />`
  }).join('')
}

function concept() {
  return `<svg class="concept" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Privacy telemetry showing encrypted network throughput, shared exit identity, DNS queries kept inside the VPN and session memory released at disconnect">
    ${defs()}
    <rect width="1440" height="900" fill="#000" />
    <text class="title" x="102" y="268"><tspan x="102">Your traffic</tspan><tspan x="102" dy="68">stays yours</tspan></text>
    <text class="body" x="102" y="672"><tspan x="102">Spatium hides your IP, keeps DNS inside the tunnel,</tspan><tspan x="102" dy="27">and retains no activity history.</tspan></text>
    <rect x="618" y="150" width="720" height="600" rx="24" fill="url(#shell-fill)" stroke="url(#shell-border)" />
    <rect x="630" y="162" width="696" height="576" rx="16" fill="rgb(0 0 0 / .26)" stroke="url(#shell-border)" />
    <rect x="630" y="162" width="696" height="576" rx="16" fill="url(#dots)" />

    <g clip-path="url(#panel-clip)" mask="url(#diagram-mask)">
      <text class="eyebrow" x="654" y="198">SESSION PRIVACY TELEMETRY</text>
      <text class="eyebrow" x="1302" y="198" text-anchor="end">TRAFFIC / DNS / MEMORY</text>
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
      <text class="tiny" x="760" y="478">VPN TUNNEL</text>
      <path class="hairline" d="M802 490H1304" />
      ${dnsBars()}
      <text class="dim" x="1304" y="478" text-anchor="end">IPv4 + IPv6 QUERIES ROUTED</text>
      <text class="tiny" x="760" y="526">OUTSIDE VPN</text>
      <path class="hairline" d="M802 532H1304" />
      <path class="wire-dashed" d="M802 532H1390" />
      <text class="value" x="1278" y="524" text-anchor="end">0 LEAKED QUERIES</text>

      <text class="label" x="654" y="574">SESSION MEMORY</text>
      <path class="gridline" d="M802 588H1304M802 610H1304M802 632H1304" />
      <path class="memory-fill" d="M802 632H828L842 630L856 627L870 628L886 622L902 621L918 618L934 619L950 612L966 611L982 606L998 608L1014 600L1030 601L1046 594L1062 596L1078 588L1094 590L1110 582L1126 584L1142 578L1158 580L1174 574L1190 576L1206 570L1222 572L1238 566L1254 568L1270 560L1278 560V632H1304V632Z" />
      <path class="memory-line" d="M802 632H828L842 630L856 627L870 628L886 622L902 621L918 618L934 619L950 612L966 611L982 606L998 608L1014 600L1030 601L1046 594L1062 596L1078 588L1094 590L1110 582L1126 584L1142 578L1158 580L1174 574L1190 576L1206 570L1222 572L1238 566L1254 568L1270 560H1278V632H1304" />
      <text class="tiny" x="802" y="650">PROCESS MEMORY · RELATIVE USAGE</text>
      <text class="dim" x="1304" y="574" text-anchor="end">DROPS TO 0 AT DISCONNECT</text>

      <path class="hairline" d="M654 674H1302" />
      <text class="caption" x="654" y="710">A shared identity leaves the tunnel while DNS stays inside and memory is released.</text>
    </g>
  </svg>`
}

document.getElementById('concept-root').innerHTML = concept()
