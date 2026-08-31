const W = 1440
const H = 900
const variant = new URLSearchParams(window.location.search).get('variant') || 'mixed-telemetry'

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
    <linearGradient id="signal-fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dce6ff" stop-opacity=".16" />
      <stop offset="1" stop-color="#dce6ff" stop-opacity=".015" />
    </linearGradient>
    <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#dce7ff" fill-opacity=".065" /></pattern>
    <filter id="wire-glow" x="-80%" y="-300%" width="260%" height="700%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="dot-glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="2.7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L8 5L1 9" fill="none" stroke="#999" stroke-opacity=".72" stroke-width="1.2" /></marker>
    <clipPath id="panel-clip"><rect x="618" y="150" width="720" height="600" rx="24" /></clipPath>
    <linearGradient id="diagram-mask-gradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="white"/><stop offset=".84" stop-color="white"/><stop offset=".93" stop-color="white" stop-opacity=".82"/><stop offset="1" stop-color="white" stop-opacity=".42"/></linearGradient>
    <mask id="diagram-mask"><rect x="618" y="150" width="720" height="600" fill="url(#diagram-mask-gradient)" /></mask>
  </defs>`
}

function frame(content, ariaLabel) {
  return `<svg class="concept" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}">
    ${defs()}
    <rect width="1440" height="900" fill="#000" />
    <text class="title" x="102" y="268"><tspan x="102">Your traffic</tspan><tspan x="102" dy="68">stays yours</tspan></text>
    <text class="body" x="102" y="672"><tspan x="102">Spatium hides your IP, keeps DNS inside the tunnel,</tspan><tspan x="102" dy="27">and retains no activity history.</tspan></text>
    <rect x="618" y="150" width="720" height="600" rx="24" fill="url(#shell-fill)" stroke="url(#shell-border)" />
    <rect x="630" y="162" width="696" height="576" rx="16" fill="rgb(0 0 0 / .26)" stroke="url(#shell-border)" />
    <rect x="630" y="162" width="696" height="576" rx="16" fill="url(#dots)" />
    <g clip-path="url(#panel-clip)" mask="url(#diagram-mask)">${content}</g>
  </svg>`
}

function header(left, right) {
  return `<text class="eyebrow" x="654" y="198">${left}</text><text class="eyebrow" x="1302" y="198" text-anchor="end">${right}</text><path class="hairline" d="M654 218H1302" />`
}

function axis() {
  return `<path class="wire-dim" d="M802 260H1302" />
    <path class="wire-dim" d="M828 252V268M1048 252V268M1278 252V268" />
    <text class="eyebrow" x="828" y="242" text-anchor="middle">CONNECT</text>
    <text class="eyebrow" x="1048" y="242" text-anchor="middle">LIVE SESSION</text>
    <text class="eyebrow" x="1278" y="242" text-anchor="middle">DISCONNECT</text>`
}

function mixedTelemetry() {
  return frame(`
    ${header('MIXED SESSION TELEMETRY', 'ONE SESSION · FOUR MEASUREMENTS')}
    ${axis()}

    <text class="label" x="654" y="310">ENCRYPTED TRAFFIC</text>
    <path class="hairline" d="M802 326H1304" />
    <path class="signal-bright" d="M802 326H828L834 326L838 306L842 346L846 314L850 326H874L880 326L884 296L888 354L892 308L896 326H928L934 326L938 300L942 350L946 312L950 326H990L996 326L1000 290L1004 360L1008 306L1012 326H1040L1046 326L1050 302L1054 350L1058 316L1062 326H1104L1110 326L1114 292L1118 358L1122 308L1126 326H1166L1172 326L1176 304L1180 348L1184 314L1188 326H1230L1236 326L1240 298L1244 352L1248 310L1252 326H1278H1304" />
    <text class="dim" x="1304" y="310" text-anchor="end">PACKET PULSES</text>

    <text class="label" x="654" y="390">SITE SOURCE</text>
    <path class="hairline" d="M802 406H1304" />
    <path class="signal" d="M802 406H828V382H1278V406H1304" />
    <text class="note" x="850" y="376">SHARED EXIT IP</text>
    <text class="dim" x="1304" y="390" text-anchor="end">REAL IP ABSENT</text>

    <text class="label" x="654" y="470">DNS EVENTS</text>
    <path class="hairline" d="M802 486H1304" />
    <text class="tiny" x="802" y="504">VPN RESOLVER</text>
    <path class="signal" d="M858 486V462M946 486V454M1072 486V464M1186 486V450M1240 486V466" />
    <circle class="dot" cx="858" cy="462" r="2.6" /><circle class="dot" cx="946" cy="454" r="2.6" /><circle class="dot" cx="1072" cy="464" r="2.6" /><circle class="dot" cx="1186" cy="450" r="2.6" /><circle class="dot" cx="1240" cy="466" r="2.6" />
    <path class="wire-dim" d="M802 518H1304" />
    <text class="tiny" x="802" y="536">LOCAL / ISP DNS</text>
    <text class="dim" x="1304" y="504" text-anchor="end">QUERIES STAY IN TUNNEL</text>
    <text class="value" x="1278" y="536" text-anchor="end">0 EVENTS</text>

    <text class="label" x="654" y="590">RAM SESSION STATE</text>
    <path class="hairline" d="M802 606H1304" />
    <path class="signal-fill" d="M802 606H828C846 600 856 576 878 584S918 592 934 570S972 584 994 578S1032 548 1054 568S1098 592 1118 574S1156 558 1174 582S1218 570 1240 590S1264 598 1278 606H1304V606Z" />
    <path class="signal" d="M802 606H828C846 600 856 576 878 584S918 592 934 570S972 584 994 578S1032 548 1054 568S1098 592 1118 574S1156 558 1174 582S1218 570 1240 590S1264 598 1278 606H1304" />
    <text class="dim" x="1304" y="590" text-anchor="end">RETURNS TO ZERO</text>

    <text class="label" x="654" y="670">ACTIVITY LOG WRITES</text>
    <path class="hairline" d="M802 686H1304" />
    <path class="signal-dim" d="M802 686H1304" />
    <text class="value" x="1278" y="674" text-anchor="end">0 WRITES</text>
    <path class="wire-dashed" d="M1278 686H1392" />
  `, 'Mixed session telemetry with packet pulses, shared site identity, tunneled DNS events, volatile RAM occupancy and zero log writes')
}

function correlatedScope() {
  const markers = [854, 922, 1002, 1094, 1172, 1244]
  return frame(`
    ${header('CORRELATED EVENT SCOPE', 'EVENTS SHARE ONE CLOCK')}
    ${axis()}
    <text class="diagram-title" x="654" y="296">Each packet leaves temporary evidence, not a durable record</text>

    ${markers.map((x) => `<path class="gridline" d="M${x} 320V686" />`).join('')}

    <text class="label" x="654" y="350">TRAFFIC</text>
    <path class="hairline" d="M802 366H1304" />
    <path class="signal-bright" d="M802 366H828L836 366L840 342L844 390L848 350L852 366H900L906 366L910 334L914 396L918 346L922 366H980L986 366L990 340L994 392L998 350L1002 366H1070L1076 366L1080 330L1084 402L1088 344L1092 366H1148L1154 366L1158 338L1162 394L1166 348L1170 366H1220L1226 366L1230 344L1234 388L1238 352L1242 366H1278H1304" />
    <text class="dim" x="1304" y="350" text-anchor="end">ENCRYPTED PACKETS</text>

    <text class="label" x="654" y="430">NAME LOOKUPS</text>
    <path class="hairline" d="M802 446H1304" />
    <path class="signal" d="M854 446V424M1002 446V416M1172 446V422" />
    <circle class="dot" cx="854" cy="424" r="3" /><circle class="dot" cx="1002" cy="416" r="3" /><circle class="dot" cx="1172" cy="422" r="3" />
    <text class="note" x="874" y="420">VPN RESOLVER</text>
    <path class="wire-dim" d="M802 470H1304" />
    <text class="tiny" x="802" y="488">ISP DNS TAP</text><text class="value" x="1278" y="488" text-anchor="end">NO EVENTS</text>

    <text class="label" x="654" y="546">VOLATILE BUFFER</text>
    <path class="hairline" d="M802 562H1304" />
    <path class="signal-fill" d="M802 562H828L854 548L922 536L1002 542L1094 518L1172 530L1244 546L1278 562H1304V562Z" />
    <path class="signal" d="M802 562H828L854 548L922 536L1002 542L1094 518L1172 530L1244 546L1278 562H1304" />
    <text class="note" x="1094" y="510" text-anchor="middle">RAM ONLY</text>
    <path class="strike" d="M1266 550L1290 574M1290 550L1266 574" />

    <text class="label" x="654" y="626">PERSISTENT STORAGE</text>
    <path class="hairline" d="M802 642H1304" />
    ${markers.map((x) => `<circle class="open-contact" cx="${x}" cy="642" r="4.5" />`).join('')}
    <path class="wire-dashed" d="M802 666H1390" />
    <text class="note" x="854" y="684">EVENT CONTACTS REMAIN OPEN</text>
    <text class="value" x="1278" y="626" text-anchor="end">ACTIVITY HISTORY NOT WRITTEN</text>
  `, 'Correlated technical scope sharing a single clock across traffic, DNS, RAM and persistent storage channels')
}

function observerTapCircuit() {
  return frame(`
    ${header('OBSERVER TAP SCHEMATIC', 'ROUTE / VISIBILITY / RETENTION')}
    <text class="diagram-title" x="654" y="256">One connection, three limited observation points</text>

    <text class="eyebrow" x="682" y="306">DEVICE</text>
    <circle class="terminal" cx="706" cy="360" r="18" />
    <circle class="dot" cx="706" cy="360" r="3" />
    <text class="tiny" x="682" y="400">REAL IP</text>

    <path class="wire-accent" d="M724 360H1218" marker-end="url(#arrow)" />
    <path class="wire" d="M724 410H1218" marker-end="url(#arrow)" />
    <path class="wire" d="M724 460H1218" marker-end="url(#arrow)" />
    <text class="label" x="744" y="350">SOURCE IDENTITY</text>
    <text class="label" x="744" y="400">DNS QUERY</text>
    <text class="label" x="744" y="450">REQUEST DATA</text>

    <path class="wire-dashed" d="M786 326H1100V492H786Z" />
    <text class="eyebrow" x="804" y="318">ENCRYPTED TUNNEL</text>

    <circle class="tap" cx="816" cy="360" r="3.2" />
    <path class="wire-dim" d="M816 360V286H936" />
    <text class="eyebrow" x="952" y="282">ISP TAP</text>
    <text class="value" x="952" y="304">REAL IP + VPN ENDPOINT</text>
    <path class="wire-dim" d="M816 410V324H932" />
    <circle class="open-contact" cx="936" cy="324" r="4.5" />
    <text class="tiny" x="952" y="328">NO DNS EVENT</text>

    <path class="wire-dim" d="M1032 340V480" />
    <circle class="tap" cx="1032" cy="360" r="3.2" />
    <text class="eyebrow" x="1010" y="520">VPN EXIT</text>
    <text class="value value-strong" x="1010" y="542">SOURCE → SHARED IP</text>
    <text class="note" x="1010" y="564">DNS RESOLVED IN TUNNEL</text>

    <circle class="tap" cx="1180" cy="360" r="3.2" />
    <path class="wire-dim" d="M1180 360V286H1260" />
    <text class="eyebrow" x="1276" y="282">SITE TAP</text>
    <text class="value" x="1276" y="304">SHARED IP</text>
    <text class="tiny" x="1276" y="324">REAL IP ABSENT</text>

    <path class="hairline" d="M654 594H1302" />
    <text class="diagram-title" x="654" y="628">Session state leaves the route here</text>
    <path class="wire-accent" d="M802 674H932" />
    <path class="wire" d="M932 654V694M948 654V694" />
    <text class="label" x="802" y="662">LIVE STATE</text>
    <text class="note" x="966" y="678">RAM</text>
    <path class="wire-dim" d="M1006 674H1118" />
    <circle class="open-contact" cx="1126" cy="674" r="5" />
    <path class="wire-dashed" d="M1132 674H1390" />
    <text class="value" x="1160" y="658">NO STORAGE CONTACT</text>
    <text class="tiny" x="1160" y="692">ACTIVITY HISTORY NOT WRITTEN</text>
  `, 'Circuit-style observer tap schematic showing what the ISP, VPN exit and website can observe, plus an open storage contact')
}

const concepts = {
  'mixed-telemetry': mixedTelemetry,
  'correlated-scope': correlatedScope,
  'observer-tap-circuit': observerTapCircuit,
}

document.getElementById('concept-root').innerHTML = (concepts[variant] || mixedTelemetry)()
