const W = 1440
const H = 1000

const variant = new URLSearchParams(window.location.search).get('variant') || 'route-dual-plane'

function defs(extra = '') {
  return `
    <defs>
      <linearGradient id="privacy-title-gradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#b8b8b8" />
      </linearGradient>
      <pattern id="privacy-dots" width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.75" fill="#dce7ff" fill-opacity="0.075" />
      </pattern>
      <pattern id="privacy-hatch" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M-1 1L1 -1M0 12L12 0M11 13L13 11" stroke="#d8e1f5" stroke-opacity="0.07" stroke-width="0.8" />
      </pattern>
      <filter id="line-glow" x="-80%" y="-300%" width="260%" height="700%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M1 1L8 5L1 9" fill="none" stroke="#999" stroke-opacity="0.72" stroke-width="1.2" />
      </marker>
      ${extra}
    </defs>`
}

function copyBlock(x, y, width = 390, split = true) {
  const title = split
    ? `<text class="title" x="${x}" y="${y}"><tspan x="${x}">Your traffic</tspan><tspan x="${x}" dy="67">stays yours</tspan></text>`
    : `<text class="title" x="${x}" y="${y}">Your traffic stays yours</text>`
  const bodyY = split ? y + 126 : y + 66
  return `${title}
    <text class="body-copy" x="${x}" y="${bodyY}">
      <tspan x="${x}">Spatium hides your IP, keeps DNS inside</tspan>
      <tspan x="${x}" dy="29">the tunnel, and retains no activity history.</tspan>
    </text>`
}

function proofLine(x, y, width, title, copy) {
  return `<path class="hairline" d="M${x} ${y}H${x + width}" />
    <text class="proof-title" x="${x}" y="${y + 31}">${title}</text>
    <text class="proof-copy" x="${x}" y="${y + 55}">${copy}</text>`
}

function node(x, y, width, height, label, value, strong = false) {
  return `<g>
    <rect class="${strong ? 'node-strong' : 'node'}" x="${x}" y="${y}" width="${width}" height="${height}" rx="12" />
    <text class="mono-small" x="${x + 18}" y="${y + 28}">${label}</text>
    <text class="mono-value" x="${x + 18}" y="${y + 56}">${value}</text>
  </g>`
}

function base(inner, ariaLabel) {
  return `<svg class="concept-frame" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}">
    ${defs()}
    <rect width="${W}" height="${H}" fill="#000" />
    ${inner}
  </svg>`
}

function routeDualPlane() {
  return base(`
    ${copyBlock(86, 220)}
    ${proofLine(86, 526, 382, 'No activity logs', 'Connection history is never written to storage.')}
    ${proofLine(86, 641, 382, 'No email required', 'A random account number is enough to connect.')}

    <rect x="536" y="92" width="818" height="816" rx="24" fill="url(#privacy-dots)" />
    <path class="hairline" d="M572 130H1318" />
    <text class="mono-small" x="572" y="158">LIVE CONNECTION</text>
    <text class="mono-small" x="1318" y="158" text-anchor="end">ROUTE PRIVACY</text>

    <rect class="panel" x="572" y="184" width="746" height="318" rx="18" />
    ${node(602, 236, 146, 86, 'DEVICE', 'REAL IP')}
    ${node(802, 236, 166, 86, 'SPATIUM', 'PRIVATE DNS', true)}
    ${node(1022, 236, 150, 86, 'EXIT', 'SHARED IP', true)}
    ${node(1214, 236, 74, 86, 'SITE', 'WEB')}
    <path class="ice-line" d="M748 279H802" marker-end="url(#arrow)" />
    <path class="ice-line" d="M968 279H1022" marker-end="url(#arrow)" />
    <path class="route" d="M1172 279H1214" marker-end="url(#arrow)" />
    <text class="mono-dim" x="775" y="258" text-anchor="middle">ENCRYPTED</text>
    <text class="mono-dim" x="995" y="258" text-anchor="middle">RESOLVED</text>

    <path class="hairline" d="M602 360H1288" />
    <text class="mono-small" x="602" y="391">ISP OBSERVES</text>
    <text class="mono-bright" x="748" y="391">VPN ENDPOINT</text>
    <text class="mono-dim" x="896" y="391">DESTINATION HIDDEN</text>
    <text class="mono-small" x="602" y="438">SITE OBSERVES</text>
    <text class="mono-bright" x="748" y="438">SHARED EXIT IP</text>
    <text class="mono-dim" x="896" y="438">REAL IP HIDDEN</text>

    <text class="mono-small" x="572" y="557">AFTER THE SESSION</text>
    <text class="mono-small" x="1318" y="557" text-anchor="end">RETENTION PRIVACY</text>
    <rect class="panel-soft" x="572" y="584" width="214" height="250" rx="18" />
    <text class="mono-small" x="598" y="620">ACCOUNT RECORD</text>
    <path class="hairline" d="M598 640H760" />
    <text class="mono-dim" x="598" y="678">ACCOUNT_ID</text>
    <text class="mono-value" x="760" y="678" text-anchor="end">RANDOM</text>
    <text class="mono-dim" x="598" y="718">EXPIRES_AT</text>
    <text class="mono-value" x="760" y="718" text-anchor="end">RETAINED</text>
    <text class="mono-dim" x="598" y="758">EMAIL</text>
    <text class="mono-bright" x="760" y="758" text-anchor="end">NOT ASKED</text>
    <text class="mono-dim" x="598" y="798">PASSWORD</text>
    <text class="mono-bright" x="760" y="798" text-anchor="end">NOT ASKED</text>

    <rect class="panel" x="814" y="584" width="504" height="250" rx="18" />
    <text class="mono-small" x="842" y="620">SESSION STATE</text>
    ${node(842, 654, 154, 92, 'VOLATILE', 'RAM ONLY', true)}
    ${node(1136, 654, 154, 92, 'PERSISTENT', 'NO HISTORY')}
    <path class="route" d="M996 700H1064" />
    <path class="route-dashed" d="M1064 700H1136" />
    <path d="M1056 688L1072 712M1072 688L1056 712" stroke="#8b8b8b" stroke-width="1" />
    <text class="mono-small" x="1064" y="786" text-anchor="middle">ACTIVITY RECORDS NOT WRITTEN</text>
  `, 'Route and Record concept with text left and dual technical plane right')
}

function diagramLeft() {
  return base(`
    <rect x="62" y="88" width="842" height="824" rx="24" fill="url(#privacy-dots)" />
    <text class="mono-small" x="94" y="132">LIVE ROUTE / RETAINED STATE</text>
    <path class="hairline" d="M94 155H872" />

    ${node(96, 208, 190, 92, 'DEVICE', 'REAL IP')}
    <rect class="panel" x="350" y="184" width="236" height="358" rx="18" />
    <text class="mono-small" x="378" y="220">SPATIUM PRIVACY PLANE</text>
    <path class="hairline" d="M378 244H558" />
    <text class="mono-dim" x="378" y="284">TRAFFIC</text>
    <text class="mono-bright" x="558" y="284" text-anchor="end">ENCRYPTED</text>
    <text class="mono-dim" x="378" y="330">DNS</text>
    <text class="mono-bright" x="558" y="330" text-anchor="end">IN TUNNEL</text>
    <text class="mono-dim" x="378" y="376">SOURCE IP</text>
    <text class="mono-bright" x="558" y="376" text-anchor="end">REPLACED</text>
    <path class="ice-line" d="M378 432H558" />
    <text class="mono-small" x="468" y="466" text-anchor="middle">ACTIVE SESSION</text>
    <text class="mono-dim" x="468" y="495" text-anchor="middle">TRANSIENT MEMORY</text>

    ${node(650, 208, 190, 92, 'DESTINATION', 'SHARED IP', true)}
    <path class="ice-line" d="M286 254H350" marker-end="url(#arrow)" />
    <path class="ice-line" d="M586 254H650" marker-end="url(#arrow)" />
    <text class="mono-dim" x="318" y="233" text-anchor="middle">TUNNEL</text>
    <text class="mono-dim" x="618" y="233" text-anchor="middle">EXIT</text>

    <path class="route" d="M468 542V610" marker-end="url(#arrow)" />
    <rect class="panel-soft" x="174" y="632" width="294" height="210" rx="18" />
    <text class="mono-small" x="202" y="668">ACCOUNT SCHEMA</text>
    <text class="mono-dim" x="202" y="712">ID</text>
    <text class="mono-value" x="438" y="712" text-anchor="end">RANDOM NUMBER</text>
    <text class="mono-dim" x="202" y="756">EMAIL</text>
    <text class="mono-bright" x="438" y="756" text-anchor="end">NOT REQUESTED</text>
    <text class="mono-dim" x="202" y="800">EXPIRY</text>
    <text class="mono-value" x="438" y="800" text-anchor="end">ONLY</text>

    <rect class="panel-soft" x="492" y="632" width="348" height="210" rx="18" />
    <rect x="508" y="648" width="316" height="178" rx="12" fill="url(#privacy-hatch)" />
    <text class="mono-small" x="522" y="668">PERSISTENT STORAGE</text>
    <circle cx="666" cy="744" r="42" fill="#0b0b0b" stroke="#fff" stroke-opacity="0.15" />
    <path class="route-dim" d="M640 744H692" />
    <path class="route-dim" d="M666 718V770" />
    <text class="mono-bright" x="666" y="812" text-anchor="middle">NO ACTIVITY HISTORY</text>

    ${copyBlock(986, 224, 380)}
    ${proofLine(986, 532, 356, 'No activity logs', 'Live state ends with the session.')}
    ${proofLine(986, 642, 356, 'No email required', 'The account record contains no identity fields.')}
    ${proofLine(986, 752, 356, 'Private DNS', 'Name resolution stays inside the tunnel.')}
  `, 'Route and Record concept with diagram left and evidence rail right')
}

function offsetSpine() {
  return base(`
    ${copyBlock(84, 158, 420, false)}
    <text class="mono-small" x="84" y="328">NO ACTIVITY LOGS</text>
    <text class="mono-small" x="280" y="328">NO EMAIL REQUIRED</text>
    <path class="hairline" d="M84 350H486" />

    <rect x="488" y="74" width="884" height="488" rx="24" fill="url(#privacy-dots)" />
    <text class="mono-small" x="530" y="120">LIVE CONNECTION</text>
    <text class="mono-small" x="1330" y="120" text-anchor="end">NOT A BROWSING HISTORY</text>
    <path class="hairline" d="M530 144H1330" />

    ${node(530, 208, 156, 88, 'SOURCE', 'REAL IP')}
    ${node(756, 208, 172, 88, 'RESOLVER', 'PRIVATE DNS', true)}
    ${node(998, 208, 172, 88, 'EXIT', 'SHARED IP', true)}
    ${node(1240, 208, 90, 88, 'SITE', 'WEB')}
    <path class="ice-line" d="M686 252H756" marker-end="url(#arrow)" />
    <path class="ice-line" d="M928 252H998" marker-end="url(#arrow)" />
    <path class="route" d="M1170 252H1240" marker-end="url(#arrow)" />
    <path class="route-dashed" d="M842 296V486" />
    <circle class="dot" cx="842" cy="486" r="4" fill-opacity="0.76" />

    <text class="mono-small" x="530" y="378">VISIBLE TO ISP</text>
    <text class="mono-value" x="690" y="378">VPN ENDPOINT</text>
    <text class="mono-dim" x="830" y="378">DNS + DESTINATION HIDDEN</text>
    <text class="mono-small" x="530" y="430">VISIBLE TO SITE</text>
    <text class="mono-value" x="690" y="430">SHARED EXIT IP</text>
    <text class="mono-dim" x="830" y="430">REAL IP HIDDEN</text>

    <path class="route" d="M842 486V604" marker-end="url(#arrow)" />
    <rect class="panel" x="286" y="626" width="766" height="248" rx="20" />
    <text class="mono-small" x="322" y="666">RETENTION SPINE</text>
    <path class="hairline" d="M322 690H1016" />
    ${node(322, 728, 170, 94, 'SESSION', 'RAM ONLY', true)}
    ${node(576, 728, 180, 94, 'ACTIVITY LOG', 'NOT WRITTEN')}
    ${node(840, 728, 176, 94, 'ACCOUNT', 'ID + EXPIRY')}
    <path class="route" d="M492 775H576" marker-end="url(#arrow)" />
    <path class="route-dim" d="M756 775H840" marker-end="url(#arrow)" />
    <path d="M790 763L814 787M814 763L790 787" stroke="#858585" stroke-width="1" />

    <rect class="panel-soft" x="1082" y="650" width="260" height="200" rx="18" />
    <text class="mono-small" x="1112" y="688">MINIMUM ACCOUNT</text>
    <text class="mono-dim" x="1112" y="734">EMAIL</text>
    <text class="mono-bright" x="1312" y="734" text-anchor="end">NONE</text>
    <text class="mono-dim" x="1112" y="780">PASSWORD</text>
    <text class="mono-bright" x="1312" y="780" text-anchor="end">NONE</text>
    <text class="mono-dim" x="1112" y="826">ACCOUNT ID</text>
    <text class="mono-value" x="1312" y="826" text-anchor="end">RANDOM</text>
  `, 'Route and Record concept with offset route and retention spine')
}

function observerLedger() {
  const column = (x, heading, rows) => `
    <text class="mono-bright" x="${x}" y="208">${heading}</text>
    <path class="hairline" d="M${x} 232H${x + 212}" />
    ${rows.map((row, index) => {
      const y = 282 + index * 105
      return `<text class="mono-small" x="${x}" y="${y}">${row[0]}</text>
        <text class="mono-value ${row[2] === 'hidden' ? 'status-hidden' : 'status-visible'}" x="${x}" y="${y + 34}">${row[1]}</text>`
    }).join('')}`

  return base(`
    ${copyBlock(82, 216)}
    ${proofLine(82, 548, 390, 'A precise privacy model', 'Each observer receives only the data it needs.')}
    ${proofLine(82, 664, 390, 'No absolute anonymity claim', 'Cookies and site accounts remain outside the VPN.')}

    <rect x="528" y="86" width="844" height="826" rx="24" fill="url(#privacy-dots)" />
    <text class="mono-small" x="568" y="132">OBSERVER LEDGER</text>
    <text class="mono-small" x="1332" y="132" text-anchor="end">WHAT EACH PARTY CAN KNOW</text>
    <path class="hairline" d="M568 156H1332" />
    <path class="hairline" d="M814 184V850M1060 184V850" />
    ${column(568, 'ISP', [
      ['SOURCE', 'YOUR IP', 'visible'],
      ['ROUTE', 'VPN ENDPOINT', 'visible'],
      ['DESTINATION', 'HIDDEN', 'hidden'],
      ['DNS QUERIES', 'HIDDEN', 'hidden'],
      ['PAYLOAD', 'ENCRYPTED', 'hidden'],
    ])}
    ${column(840, 'SPATIUM', [
      ['SOURCE', 'LIVE SESSION', 'visible'],
      ['ACCOUNT', 'RANDOM ID', 'visible'],
      ['DNS QUERIES', 'TRANSIENT', 'visible'],
      ['ACTIVITY LOG', 'NOT STORED', 'hidden'],
      ['EMAIL', 'NOT REQUESTED', 'hidden'],
    ])}
    ${column(1086, 'DESTINATION', [
      ['SOURCE', 'SHARED IP', 'visible'],
      ['REAL IP', 'HIDDEN', 'hidden'],
      ['SITE ACCOUNT', 'STILL VISIBLE', 'visible'],
      ['COOKIES', 'STILL VISIBLE', 'visible'],
      ['OTHER SITES', 'UNKNOWN', 'hidden'],
    ])}
  `, 'Observer Ledger concept showing what ISP Spatium and destination can know')
}

function ephemeralInfrastructure() {
  return base(`
    ${copyBlock(84, 218)}
    ${proofLine(84, 544, 380, 'Nothing durable to inspect', 'Session state exists only while the server is running.')}
    ${proofLine(84, 658, 380, 'Minimal account surface', 'A random number replaces email and password.')}

    <rect x="530" y="78" width="832" height="840" rx="24" fill="url(#privacy-dots)" />
    <text class="mono-small" x="570" y="128">EPHEMERAL SERVER CUTAWAY</text>
    <text class="mono-small" x="1322" y="128" text-anchor="end">RAM-ONLY INFRASTRUCTURE</text>
    <path class="hairline" d="M570 152H1322" />

    <rect class="panel-soft" x="650" y="186" width="590" height="92" rx="16" />
    <text class="mono-small" x="680" y="220">READ-ONLY BOOT IMAGE</text>
    <text class="mono-value" x="680" y="252">SIGNED CONFIGURATION / KNOWN STATE</text>
    <path class="route" d="M945 278V326" marker-end="url(#arrow)" />

    <rect class="panel" x="592" y="338" width="706" height="314" rx="22" />
    <text class="mono-small" x="626" y="378">VOLATILE MEMORY</text>
    <text class="mono-small" x="1264" y="378" text-anchor="end">CLEARED ON RESTART</text>
    <path class="hairline" d="M626 402H1264" />
    ${node(626, 446, 170, 100, 'INBOUND', 'ENCRYPTED')}
    ${node(860, 446, 170, 100, 'DNS + ROUTE', 'TRANSIENT', true)}
    ${node(1094, 446, 170, 100, 'OUTBOUND', 'SHARED IP')}
    <path class="ice-line" d="M796 496H860" marker-end="url(#arrow)" />
    <path class="ice-line" d="M1030 496H1094" marker-end="url(#arrow)" />
    <path class="route-dashed" d="M945 546V616" />
    <text class="mono-dim" x="945" y="626" text-anchor="middle">SESSION ENDS HERE</text>

    <rect class="panel-soft" x="650" y="700" width="590" height="130" rx="18" />
    <rect x="666" y="716" width="558" height="98" rx="12" fill="url(#privacy-hatch)" />
    <text class="mono-small" x="686" y="750">PERSISTENT DISK</text>
    <text class="mono-bright" x="686" y="792">ACTIVITY HISTORY NOT WRITTEN</text>
    <path d="M1122 744L1178 800M1178 744L1122 800" stroke="#777" stroke-width="1.1" />

    <path class="route" d="M592 610C548 610 548 760 592 760" />
    <text class="mono-small clip-label" x="564" y="690" text-anchor="middle" transform="rotate(-90 564 690)">REBOOT CLEARS LIVE STATE</text>
  `, 'Ephemeral Infrastructure concept showing RAM-only VPN server lifecycle')
}

const concepts = {
  'route-dual-plane': routeDualPlane,
  'diagram-left': diagramLeft,
  'offset-spine': offsetSpine,
  'observer-ledger': observerLedger,
  'ephemeral-infrastructure': ephemeralInfrastructure,
}

document.getElementById('concept-root').innerHTML = (concepts[variant] || routeDualPlane)()
