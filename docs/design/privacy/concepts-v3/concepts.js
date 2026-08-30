const W = 1440
const H = 900
const variant = new URLSearchParams(window.location.search).get('variant') || 'observer-scopes'

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
    <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M-1 1L1 -1M0 10L10 0M9 11L11 9" stroke="#dce7ff" stroke-opacity=".06" stroke-width=".75" /></pattern>
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

function node(x, y, w, h, label, value, strong = false) {
  return `<rect class="${strong ? 'node-strong' : 'node'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="10" />
    <text class="label" x="${x + 15}" y="${y + 24}">${label}</text>
    <text class="value ${strong ? 'value-strong' : ''}" x="${x + 15}" y="${y + 52}">${value}</text>`
}

function header(left, right) {
  return `<text class="eyebrow" x="654" y="198">${left}</text><text class="eyebrow" x="1302" y="198" text-anchor="end">${right}</text><path class="hairline" d="M654 218H1302" />`
}

function observerScopes() {
  return frame(`
    ${header('OBSERVER SCOPES', 'ONE ROUTE · DIFFERENT VIEWS')}
    <text class="diagram-title" x="654" y="254">What the network exposes</text>

    <rect class="scope" x="670" y="286" width="300" height="116" rx="12" />
    <text class="eyebrow" x="686" y="310">ISP SCOPE</text>
    <text class="dim" x="952" y="310" text-anchor="end">ENDS AT VPN</text>

    ${node(690, 330, 112, 72, 'DEVICE', 'REAL IP')}
    ${node(882, 330, 126, 72, 'SPATIUM', 'VPN ENTRY', true)}
    ${node(1086, 330, 118, 72, 'EXIT', 'SHARED IP', true)}
    ${node(1278, 330, 92, 72, 'SITE', 'WEB')}
    <path class="wire-accent" d="M802 366H882" marker-end="url(#arrow)" />
    <path class="wire-accent" d="M1008 366H1086" marker-end="url(#arrow)" />
    <path class="wire" d="M1204 366H1278" marker-end="url(#arrow)" />
    <text class="tiny" x="842" y="348" text-anchor="middle">ENCRYPTED</text>
    <text class="tiny" x="1047" y="348" text-anchor="middle">NEW SOURCE</text>

    <path class="wire-dim" d="M690 430H1204" />
    <path class="wire-dim" d="M690 422V438M1008 422V438M1204 422V438" />
    <text class="label" x="690" y="462">ISP KNOWS</text><text class="value" x="786" y="462">YOUR IP + VPN ENDPOINT</text>
    <text class="label" x="690" y="494">ISP CANNOT READ</text><text class="value" x="826" y="494">DNS · DESTINATION · PAYLOAD</text>
    <text class="label" x="1048" y="462">SITE KNOWS</text><text class="value" x="1150" y="462">SHARED IP</text>
    <text class="label" x="1048" y="494">SITE CANNOT SEE</text><text class="value" x="1180" y="494">REAL IP</text>

    <path class="hairline" d="M654 530H1302" />
    <text class="diagram-title" x="654" y="566">What remains afterward</text>
    <path class="wire-dim" d="M690 626H1260" />
    <circle class="dot" cx="712" cy="626" r="3.5" />
    <text class="label" x="690" y="606">LIVE SESSION</text>
    <text class="value" x="730" y="656">RAM STATE</text>
    <path class="strike" d="M846 614L870 638M870 614L846 638" />
    <text class="note" x="896" y="630">ACTIVITY HISTORY NOT WRITTEN</text>
    <path class="wire-dashed" d="M1218 626H1368" />
    <text class="tiny" x="1218" y="606">LINE CONTINUES BEYOND THE FRAME</text>
  `, 'Observer scopes on a VPN route with a separate retention branch')
}

function packetCutaway() {
  return frame(`
    ${header('PACKET CUTAWAY', 'OUTER ROUTE · INNER DATA')}
    <text class="diagram-title" x="654" y="254">Inside the encrypted tunnel</text>

    <rect class="node" x="654" y="286" width="604" height="178" rx="14" />
    <text class="eyebrow" x="674" y="312">OUTER HEADER · VISIBLE TO ISP</text>
    <rect class="field" x="674" y="334" width="170" height="104" rx="9" />
    <text class="label" x="692" y="360">SOURCE</text><text class="value" x="692" y="388">YOUR IP</text>
    <text class="label" x="692" y="412">DESTINATION</text><text class="value" x="692" y="432">VPN ENDPOINT</text>

    <rect class="field-active" x="862" y="334" width="376" height="104" rx="9" />
    <text class="eyebrow" x="882" y="360">ENCRYPTED INNER FIELDS</text>
    <text class="label" x="882" y="394">DNS</text><text class="value" x="938" y="394">PRIVATE RESOLVER</text>
    <text class="label" x="1060" y="394">SITE</text><text class="value" x="1110" y="394">DESTINATION</text>
    <text class="label" x="882" y="424">DATA</text><text class="value" x="938" y="424">PAYLOAD</text>

    <path class="wire-accent" d="M654 500H1248" marker-end="url(#arrow)" />
    <text class="tiny" x="950" y="486" text-anchor="middle">TUNNEL TRANSPORT</text>
    <circle class="dot" cx="950" cy="500" r="3" />

    <text class="diagram-title" x="654" y="548">At the VPN exit</text>
    <path class="wire-dim" d="M780 566V604" marker-end="url(#arrow)" />
    <rect x="654" y="612" width="594" height="92" rx="12" fill="url(#hatch)" stroke="rgb(255 255 255 / .12)" />
    <text class="eyebrow" x="674" y="638">OUTER HEADER REMOVED</text>
    <text class="label" x="674" y="674">NEW SOURCE</text><text class="value value-strong" x="778" y="674">SHARED EXIT IP</text>
    <text class="label" x="956" y="674">WEBSITE RECEIVES</text><text class="value" x="1098" y="674">REQUEST</text>
    <path class="wire" d="M1248 658H1384" marker-end="url(#arrow)" />
    <text class="tiny" x="1262" y="640">REAL IP NO LONGER PRESENT</text>
  `, 'Packet cutaway showing the visible outer VPN header and encrypted inner fields')
}

function sharedExitTopology() {
  return frame(`
    ${header('SHARED EXIT TOPOLOGY', 'MANY SOURCES · ONE PUBLIC IDENTITY')}
    <text class="diagram-title" x="654" y="254">The destination receives a crowd, not a device</text>

    <path class="wire-dim" d="M690 318C810 318 824 396 930 396" />
    <path class="wire-accent" d="M690 396H930" />
    <path class="wire-dim" d="M690 474C810 474 824 396 930 396" />
    <circle class="dot-dim" cx="690" cy="318" r="4" /><circle class="dot" cx="690" cy="396" r="4" /><circle class="dot-dim" cx="690" cy="474" r="4" />
    <text class="label" x="714" y="314">CLIENT 01</text><text class="dim" x="714" y="334">REAL IP A</text>
    <text class="label" x="714" y="392">YOUR DEVICE</text><text class="value" x="714" y="414">REAL IP B</text>
    <text class="label" x="714" y="470">CLIENT 03</text><text class="dim" x="714" y="490">REAL IP C</text>

    <circle cx="954" cy="396" r="38" fill="#0f1013" stroke="rgb(220 230 250 / .22)" />
    <circle class="dot" cx="954" cy="396" r="4" />
    <text class="eyebrow" x="954" y="456" text-anchor="middle">VPN EXIT</text>
    <text class="value" x="954" y="478" text-anchor="middle">SHARED IP</text>

    <path class="wire" d="M992 396C1096 396 1112 318 1230 318" />
    <path class="wire" d="M992 396H1230" />
    <path class="wire" d="M992 396C1096 396 1112 474 1230 474" />
    <circle class="dot-dim" cx="1230" cy="318" r="4" /><circle class="dot-dim" cx="1230" cy="396" r="4" /><circle class="dot-dim" cx="1230" cy="474" r="4" />
    <text class="label" x="1250" y="322">SITE A</text><text class="label" x="1250" y="400">SITE B</text><text class="label" x="1250" y="478">SITE C</text>

    <rect class="scope" x="650" y="286" width="378" height="220" rx="14" />
    <text class="eyebrow" x="668" y="530">ENCRYPTED TUNNELS · PRIVATE DNS INSIDE</text>
    <text class="eyebrow" x="1212" y="530" text-anchor="end">DESTINATIONS RECEIVE THE SAME SOURCE IP</text>

    <path class="hairline" d="M654 564H1302" />
    <text class="label" x="654" y="604">WEBSITE CAN LINK</text><text class="value" x="792" y="604">THIS VISIT TO THE SHARED EXIT</text>
    <text class="label" x="654" y="640">WEBSITE CANNOT RECOVER</text><text class="value value-strong" x="842" y="640">YOUR REAL IP</text>
    <path class="wire-dashed" d="M654 684H1380" />
    <path class="strike" d="M1078 672L1102 696M1102 672L1078 696" />
    <text class="note" x="1118" y="688">NO ACTIVITY HISTORY TO RECONNECT THE PATH</text>
  `, 'Network topology showing several clients sharing one VPN exit identity')
}

function sessionTraces() {
  const traceRow = (y, label, path, endLabel) => `<text class="label" x="654" y="${y - 8}">${label}</text><path class="hairline" d="M786 ${y}H1304" /><path class="signal" d="${path}" /><text class="dim" x="1304" y="${y - 8}" text-anchor="end">${endLabel}</text>`
  return frame(`
    ${header('SESSION TRACES', 'CONNECT · LIVE · DISCONNECT')}
    <path class="wire-dim" d="M786 270H1304" />
    <path class="wire-dim" d="M812 262V278M1050 262V278M1278 262V278" />
    <text class="eyebrow" x="812" y="250" text-anchor="middle">CONNECT</text>
    <text class="eyebrow" x="1050" y="250" text-anchor="middle">LIVE SESSION</text>
    <text class="eyebrow" x="1278" y="250" text-anchor="middle">DISCONNECT</text>

    ${traceRow(334, 'SITE SOURCE IP', 'M786 334H812V306H1278V334H1304', 'SHARED WHILE LIVE')}
    <text class="note" x="842" y="304">SHARED EXIT IP</text>
    ${traceRow(420, 'DNS IN TUNNEL', 'M786 420H812V390H1278V420H1304', 'ENDS WITH SESSION')}
    <path class="wire-dashed" d="M840 390H1250" />
    <text class="note" x="842" y="382">PRIVATE RESOLVER</text>
    ${traceRow(506, 'VOLATILE STATE', 'M786 506H812V476H1278V506H1304', 'CLEARED')}
    <text class="note" x="842" y="468">RAM ONLY</text>
    ${traceRow(592, 'ACTIVITY HISTORY', 'M786 592H1304', 'NEVER RISES')}
    <path class="strike" d="M1038 580L1062 604M1062 580L1038 604" />

    <path class="hairline" d="M654 636H1302" />
    <text class="diagram-title" x="654" y="674">Persistent account surface</text>
    <text class="label" x="884" y="674">RANDOM ID</text><text class="value" x="970" y="674">PRESENT</text>
    <text class="label" x="1082" y="674">EMAIL / PASSWORD</text><text class="value" x="1234" y="674">NOT ASKED</text>
    <path class="wire-dashed" d="M1278 674H1390" />
  `, 'Oscilloscope-like session traces showing transient and persistent privacy state')
}

function fieldTransform() {
  const field = (x, y, w, label, value, active = false) => `<rect class="${active ? 'field-active' : 'field'}" x="${x}" y="${y}" width="${w}" height="54" rx="8" /><text class="label" x="${x + 14}" y="${y + 21}">${label}</text><text class="value" x="${x + 14}" y="${y + 42}">${value}</text>`
  return frame(`
    ${header('FIELD TRANSFORM', 'INPUT · OPERATIONS · OUTPUT')}
    <text class="diagram-title" x="654" y="254">A connection changes fields, not destinations</text>

    <text class="eyebrow" x="654" y="294">INPUT AT DEVICE</text>
    ${field(654, 314, 164, 'SOURCE', 'REAL IP')}
    ${field(654, 380, 164, 'DNS', 'DOMAIN QUERY')}
    ${field(654, 446, 164, 'DATA', 'PAYLOAD')}

    <path class="wire-accent" d="M818 341H900" marker-end="url(#arrow)" />
    <path class="wire-accent" d="M818 407H900" marker-end="url(#arrow)" />
    <path class="wire-accent" d="M818 473H900" marker-end="url(#arrow)" />

    <path class="wire-dim" d="M930 310V510" />
    <circle class="dot" cx="930" cy="341" r="3" /><circle class="dot" cx="930" cy="407" r="3" /><circle class="dot" cx="930" cy="473" r="3" />
    <text class="eyebrow" x="930" y="294" text-anchor="middle">OPERATIONS</text>
    <text class="note" x="954" y="345">REPLACE SOURCE</text>
    <text class="note" x="954" y="411">RESOLVE IN TUNNEL</text>
    <text class="note" x="954" y="477">ENCRYPT TO VPN</text>

    <path class="wire" d="M1072 341H1142" marker-end="url(#arrow)" />
    <path class="wire" d="M1072 407H1142" marker-end="url(#arrow)" />
    <path class="wire" d="M1072 473H1142" marker-end="url(#arrow)" />
    <text class="eyebrow" x="1142" y="294">OUTPUT AT EXIT</text>
    ${field(1142, 314, 170, 'SOURCE', 'SHARED IP', true)}
    ${field(1142, 380, 170, 'DNS', 'RESOLVED', true)}
    ${field(1142, 446, 170, 'DATA', 'REQUEST', true)}
    <path class="wire-dashed" d="M1312 341H1386" /><path class="wire-dashed" d="M1312 407H1386" /><path class="wire-dashed" d="M1312 473H1386" />

    <path class="hairline" d="M654 548H1302" />
    <text class="diagram-title" x="654" y="584">Retention plane</text>
    <path class="wire-dim" d="M654 626H1302" />
    <circle class="dot" cx="704" cy="626" r="3" />
    <text class="label" x="654" y="612">LIVE STATE</text><text class="value" x="724" y="654">RAM</text>
    <path class="strike" d="M818 614L842 638M842 614L818 638" />
    <text class="note" x="868" y="630">ACTIVITY HISTORY NOT WRITTEN</text>
    <text class="label" x="1170" y="612">ACCOUNT</text><text class="value" x="1170" y="654">ID + EXPIRY</text>
  `, 'Field transformation diagram for source IP DNS and payload with a retention plane')
}

const concepts = {
  'observer-scopes': observerScopes,
  'packet-cutaway': packetCutaway,
  'shared-exit-topology': sharedExitTopology,
  'session-traces': sessionTraces,
  'field-transform': fieldTransform,
}

document.getElementById('concept-root').innerHTML = (concepts[variant] || observerScopes)()
