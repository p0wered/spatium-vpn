const W = 1600
const H = 960

const variant = new URLSearchParams(window.location.search).get('variant') || 'route-record-v2'

function defs() {
  return `<defs>
    <linearGradient id="title-gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" />
      <stop offset="1" stop-color="#bcbcbc" />
    </linearGradient>
    <linearGradient id="panel-fill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#12151a" stop-opacity=".88" />
      <stop offset=".55" stop-color="#090a0c" stop-opacity=".91" />
      <stop offset="1" stop-color="#050506" stop-opacity=".96" />
    </linearGradient>
    <linearGradient id="ridge-line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#b8c8ea" stop-opacity="0" />
      <stop offset=".62" stop-color="#dce7ff" stop-opacity=".55" />
      <stop offset="1" stop-color="#fff" stop-opacity="1" />
    </linearGradient>
    <radialGradient id="ridge-core" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff" stop-opacity=".95" />
      <stop offset=".18" stop-color="#dce7ff" stop-opacity=".7" />
      <stop offset="1" stop-color="#a9bde7" stop-opacity="0" />
    </radialGradient>
    <pattern id="dots" width="19" height="19" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r=".7" fill="#dce7ff" fill-opacity=".075" />
    </pattern>
    <pattern id="hatch" width="11" height="11" patternUnits="userSpaceOnUse">
      <path d="M-1 1L1 -1M0 11L11 0M10 12L12 10" stroke="#dce7ff" stroke-opacity=".065" stroke-width=".8" />
    </pattern>
    <filter id="ridge-blur" x="-50%" y="-500%" width="200%" height="1100%"><feGaussianBlur stdDeviation="22" /></filter>
    <filter id="line-glow" x="-60%" y="-300%" width="220%" height="700%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="dot-glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1L8 5L1 9" fill="none" stroke="#aaa" stroke-opacity=".72" stroke-width="1.2" /></marker>
    <clipPath id="panel-clip"><rect x="600" y="156" width="910" height="692" rx="26" /></clipPath>
  </defs>`
}

function frame(content, ariaLabel) {
  return `<svg class="concept" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}">
    ${defs()}
    <rect width="1600" height="960" fill="#000" />
    <path d="M0 492H598" stroke="url(#ridge-line)" stroke-width="2" />
    <path d="M0 492H598" stroke="#c9d8f8" stroke-opacity=".42" stroke-width="18" filter="url(#ridge-blur)" />
    <path d="M598 286V692" stroke="#dce7ff" stroke-opacity=".18" stroke-width="22" filter="url(#ridge-blur)" />
    <ellipse cx="598" cy="492" rx="88" ry="70" fill="url(#ridge-core)" opacity=".5" filter="url(#ridge-blur)" />

    <text class="title" x="122" y="286"><tspan x="122">Your traffic</tspan><tspan x="122" dy="75">stays yours</tspan></text>
    <text class="body" x="122" y="640"><tspan x="122">Spatium hides your IP and keeps DNS inside</tspan><tspan x="122" dy="32">the tunnel, without retaining activity history.</tspan></text>

    <rect x="600" y="156" width="910" height="692" rx="26" fill="url(#panel-fill)" stroke="rgb(255 255 255 / .16)" />
    <rect x="618" y="174" width="874" height="656" rx="20" fill="url(#dots)" stroke="rgb(255 255 255 / .075)" />
    <path d="M600 194V810" stroke="#d9e5ff" stroke-opacity=".18" />
    <g clip-path="url(#panel-clip)">${content}</g>
  </svg>`
}

function block(x, y, w, h, label, value, strong = false) {
  return `<rect class="${strong ? 'card-strong' : 'card'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="13" />
    <text class="label" x="${x + 18}" y="${y + 27}">${label}</text>
    <text class="value ${strong ? 'value-strong' : ''}" x="${x + 18}" y="${y + 57}">${value}</text>`
}

function routeRecordV2() {
  return frame(`
    <text class="eyebrow" x="646" y="210">PRIVACY SYSTEM</text>
    <text class="eyebrow" x="1464" y="210" text-anchor="end">TWO MOMENTS</text>
    <path class="hairline" d="M646 230H1464" />

    <rect class="glass-inner" x="646" y="252" width="818" height="282" rx="18" />
    <text class="section-title" x="672" y="286">01 · While you are connected</text>
    <text class="dim" x="1438" y="286" text-anchor="end">IDENTITY + ROUTE</text>
    ${block(672, 316, 152, 84, 'YOUR DEVICE', 'REAL IP')}
    ${block(892, 316, 212, 84, 'SPATIUM TUNNEL', 'PRIVATE DNS', true)}
    ${block(1172, 316, 166, 84, 'VPN EXIT', 'SHARED IP', true)}
    ${block(1402, 316, 42, 84, 'SITE', 'WEB')}
    <path class="accent-line" d="M824 358H892" marker-end="url(#arrow)" />
    <path class="accent-line" d="M1104 358H1172" marker-end="url(#arrow)" />
    <path class="route" d="M1338 358H1402" marker-end="url(#arrow)" />
    <text class="tiny" x="858" y="340" text-anchor="middle">ENCRYPTED</text>
    <text class="tiny" x="1138" y="340" text-anchor="middle">REPLACED</text>
    <path class="hairline" d="M672 430H1438" />
    <text class="label" x="672" y="462">YOUR ISP CAN SEE</text>
    <text class="value" x="820" y="462">A VPN CONNECTION</text>
    <text class="dim" x="1030" y="462">DESTINATION + DNS HIDDEN</text>
    <text class="label" x="672" y="500">THE WEBSITE CAN SEE</text>
    <text class="value" x="860" y="500">A SHARED EXIT IP</text>
    <text class="dim" x="1060" y="500">REAL IP HIDDEN</text>

    <rect class="glass-inner" x="646" y="558" width="818" height="238" rx="18" />
    <text class="section-title" x="672" y="592">02 · After you disconnect</text>
    <text class="dim" x="1438" y="592" text-anchor="end">RETENTION</text>
    ${block(672, 626, 190, 104, 'LIVE SESSION', 'RAM STATE', true)}
    ${block(948, 626, 202, 104, 'ACTIVITY HISTORY', 'NOT WRITTEN')}
    ${block(1236, 626, 202, 104, 'ACCOUNT RECORD', 'ID + EXPIRY')}
    <path class="route" d="M862 678H916" />
    <path class="route-dashed" d="M916 678H948" />
    <path class="strike" d="M902 666L926 690M926 666L902 690" />
    <path class="hairline" d="M1192 626V730" />
    <text class="outcome" x="672" y="766">SESSION DATA ENDS · NO EMAIL OR BROWSING HISTORY ADDED</text>
  `, 'Route and Record version two, explaining privacy during and after a connection')
}

function privacyControls() {
  const control = (x, y, number, title, body, diagram, outcome) => `<rect class="glass-inner" x="${x}" y="${y}" width="390" height="250" rx="18" />
    <text class="eyebrow" x="${x + 24}" y="${y + 34}">${number}</text>
    <text class="section-title" x="${x + 62}" y="${y + 35}">${title}</text>
    <text class="dim" x="${x + 24}" y="${y + 66}">${body}</text>
    ${diagram}
    <path class="hairline" d="M${x + 24} ${y + 196}H${x + 366}" />
    <text class="outcome" x="${x + 24}" y="${y + 224}">${outcome}</text>`

  return frame(`
    <text class="eyebrow" x="646" y="210">FOUR PRIVACY CONTROLS</text>
    <text class="eyebrow" x="1464" y="210" text-anchor="end">ONE SYSTEM</text>
    <path class="hairline" d="M646 230H1464" />
    ${control(646, 252, '01', 'IP address', 'The site receives the exit address.', `
      ${block(670, 348, 112, 72, 'INPUT', 'REAL IP')}
      ${block(880, 348, 132, 72, 'OUTPUT', 'SHARED IP', true)}
      <path class="accent-line" d="M782 384H880" marker-end="url(#arrow)" />
      <text class="tiny" x="831" y="367" text-anchor="middle">REPLACED</text>`, 'REAL IP HIDDEN FROM THE SITE')}
    ${control(1074, 252, '02', 'DNS resolution', 'Queries travel inside the tunnel.', `
      ${block(1098, 348, 112, 72, 'QUERY', 'DOMAIN')}
      ${block(1308, 348, 132, 72, 'RESOLVER', 'PRIVATE DNS', true)}
      <path class="accent-line" d="M1210 384H1308" marker-end="url(#arrow)" />
      <text class="tiny" x="1259" y="367" text-anchor="middle">IN TUNNEL</text>`, 'DNS QUERIES HIDDEN FROM THE ISP')}
    ${control(646, 532, '03', 'Session history', 'Live state is not an activity archive.', `
      ${block(670, 628, 134, 72, 'CONNECTED', 'RAM STATE', true)}
      ${block(878, 628, 134, 72, 'DISCONNECT', 'CLEARED')}
      <path class="route" d="M804 664H878" />
      <path class="strike" d="M830 652L854 676M854 652L830 676" />`, 'NO BROWSING HISTORY WRITTEN')}
    ${control(1074, 532, '04', 'Account identity', 'Access does not need a profile.', `
      <rect class="card" x="1098" y="626" width="342" height="76" rx="13" />
      <text class="label" x="1118" y="654">RANDOM ID</text><text class="value" x="1420" y="654" text-anchor="end">REQUIRED</text>
      <text class="label" x="1118" y="684">EMAIL / PASSWORD</text><text class="value hidden-value" x="1420" y="684" text-anchor="end">NOT ASKED</text>`, 'MINIMUM ACCOUNT RECORD')}
  `, 'Four independent privacy controls shown as a coherent system')
}

function observerCards() {
  const row = (x, y, label, value, visible = true) => `<circle class="${visible ? 'good-dot' : 'muted-dot'}" cx="${x}" cy="${y - 4}" r="3" />
    <text class="label" x="${x + 14}" y="${y}">${label}</text>
    <text class="value ${visible ? '' : 'hidden-value'}" x="${x + 14}" y="${y + 27}">${value}</text>`
  const card = (x, title, subtitle, visibleRows, hiddenRows) => `<rect class="glass-inner" x="${x}" y="262" width="252" height="514" rx="18" />
    <text class="section-title" x="${x + 22}" y="300">${title}</text>
    <text class="dim" x="${x + 22}" y="326">${subtitle}</text>
    <path class="hairline" d="M${x + 22} 348H${x + 230}" />
    <text class="eyebrow" x="${x + 22}" y="378">VISIBLE</text>
    ${visibleRows.map((r, i) => row(x + 26, 414 + i * 68, r[0], r[1], true)).join('')}
    <path class="hairline" d="M${x + 22} 566H${x + 230}" />
    <text class="eyebrow" x="${x + 22}" y="596">HIDDEN OR NOT KEPT</text>
    ${hiddenRows.map((r, i) => row(x + 26, 632 + i * 62, r[0], r[1], false)).join('')}`

  return frame(`
    <text class="eyebrow" x="646" y="210">THREE OBSERVERS</text>
    <text class="eyebrow" x="1464" y="210" text-anchor="end">DIFFERENT VIEWS</text>
    <path class="hairline" d="M646 230H1464" />
    ${card(646, 'Your ISP', 'Sees the outer connection', [['SOURCE', 'YOUR IP'], ['ROUTE', 'VPN ENDPOINT']], [['DESTINATION', 'HIDDEN'], ['DNS + PAYLOAD', 'ENCRYPTED']])}
    ${card(929, 'Spatium', 'Handles the live session', [['SESSION', 'CONNECTED'], ['DNS', 'TRANSIENT']], [['ACTIVITY LOG', 'NOT STORED'], ['EMAIL', 'NOT REQUESTED']])}
    ${card(1212, 'The website', 'Sees only this visit', [['SOURCE', 'SHARED EXIT IP'], ['SITE ACCOUNT', 'STILL VISIBLE']], [['REAL IP', 'HIDDEN'], ['OTHER SITES', 'UNKNOWN']])}
  `, 'Observer cards showing what ISP Spatium and the website can see or retain')
}

function dataLifecycle() {
  return frame(`
    <text class="eyebrow" x="646" y="210">SESSION LIFECYCLE</text>
    <text class="eyebrow" x="1464" y="210" text-anchor="end">WHAT EXISTS · WHEN</text>
    <path class="hairline" d="M646 230H1464" />

    <path class="route-dim" d="M690 290H1418" />
    <circle class="good-dot" cx="700" cy="290" r="4" />
    <circle class="good-dot" cx="1055" cy="290" r="4" />
    <circle class="muted-dot" cx="1408" cy="290" r="4" />
    <text class="eyebrow" x="700" y="270" text-anchor="middle">CONNECT</text>
    <text class="eyebrow" x="1055" y="270" text-anchor="middle">LIVE SESSION</text>
    <text class="eyebrow" x="1408" y="270" text-anchor="middle">DISCONNECT</text>

    <rect class="glass-inner" x="646" y="324" width="818" height="278" rx="18" />
    <text class="section-title" x="672" y="360">While the tunnel is active</text>
    ${block(672, 398, 170, 92, 'INPUT', 'REAL IP')}
    ${block(928, 398, 252, 92, 'VOLATILE SESSION', 'PRIVATE DNS + ROUTE', true)}
    ${block(1266, 398, 172, 92, 'OUTPUT', 'SHARED IP')}
    <path class="accent-line" d="M842 444H928" marker-end="url(#arrow)" />
    <path class="accent-line" d="M1180 444H1266" marker-end="url(#arrow)" />
    <text class="tiny" x="885" y="424" text-anchor="middle">ENCRYPTED</text>
    <text class="tiny" x="1223" y="424" text-anchor="middle">REPLACED</text>
    <path class="hairline" d="M672 522H1438" />
    <text class="label" x="672" y="556">EXISTS IN MEMORY</text>
    <text class="value" x="835" y="556">ONLY FOR THE ACTIVE SESSION</text>

    <path class="route" d="M1055 602V650" marker-end="url(#arrow)" />
    <rect class="glass-inner" x="646" y="666" width="818" height="130" rx="18" />
    <text class="section-title" x="672" y="702">When the session ends</text>
    <rect x="672" y="728" width="218" height="44" rx="10" fill="url(#hatch)" stroke="rgb(255 255 255 / .12)" />
    <text class="outcome" x="690" y="755">RAM STATE CLEARED</text>
    <rect class="card" x="914" y="728" width="238" height="44" rx="10" />
    <text class="outcome" x="932" y="755">ACTIVITY LOG · NONE</text>
    <rect class="card" x="1176" y="728" width="262" height="44" rx="10" />
    <text class="outcome" x="1194" y="755">ACCOUNT · ID + EXPIRY</text>
  `, 'Data lifecycle showing what exists during a connection and what remains afterward')
}

const concepts = {
  'route-record-v2': routeRecordV2,
  'privacy-controls': privacyControls,
  'observer-cards': observerCards,
  'data-lifecycle': dataLifecycle,
}

document.getElementById('concept-root').innerHTML = (concepts[variant] || routeRecordV2)()
