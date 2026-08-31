import { motion } from 'motion/react'

interface PrivacyDiagramProps {
  active: boolean
  reducedMotion: boolean
}

const diagramTransition = {
  duration: 0.76,
  delay: 0.72,
  ease: [0.22, 1, 0.36, 1] as const,
}

const desktopTx = [
  10, 22, 15, 34, 18, 27, 12, 39, 26, 18, 31, 14, 24, 36, 19, 28, 12, 32, 20, 16, 27, 11, 23, 18,
]
const desktopRx = [
  8, 14, 20, 12, 26, 17, 9, 24, 15, 28, 16, 11, 22, 18, 30, 13, 20, 15, 25, 10, 19, 14, 21, 9,
]
const desktopDns = [10, 18, 12, 22, 14, 8, 20, 15, 24, 11, 17, 9, 21, 13, 19, 10, 16, 8, 14, 7]

const mobileTx = [8, 18, 12, 27, 15, 22, 10, 30, 20, 13, 24, 11]
const mobileRx = [7, 11, 16, 9, 20, 13, 8, 18, 12, 22, 14, 9]
const mobileDns = [8, 15, 10, 19, 12, 7, 17, 11, 20, 9]

function DesktopTrafficBars() {
  return desktopTx.map((height, index) => {
    const x = 182 + index * 20

    return (
      <g key={x}>
        <rect x={x} y={172 - height} width="7" height={height} fill="white" fillOpacity="0.48" />
        <rect
          x={x + 8}
          y="176"
          width="7"
          height={desktopRx[index]}
          fill="white"
          fillOpacity="0.22"
        />
      </g>
    )
  })
}

function DesktopDnsBars() {
  return desktopDns.map((height, index) => (
    <rect
      key={index}
      x={204 + index * 22}
      y={328 - height}
      width="6"
      height={height}
      fill="white"
      fillOpacity="0.38"
    />
  ))
}

function DesktopDiagram() {
  return (
    <svg
      viewBox="0 0 696 576"
      className="hidden h-full w-full lg:block"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="privacy-dots-desktop" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.65" fill="white" fillOpacity="0.055" />
        </pattern>
      </defs>

      <rect width="696" height="576" fill="url(#privacy-dots-desktop)" />

      <g style={{ fontFamily: 'var(--font-mono)' }}>
        <text x="24" y="36" fill="#777777" fontSize="9" fontWeight="520" letterSpacing="1.35">
          SESSION PRIVACY TELEMETRY
        </text>
        <text
          x="672"
          y="36"
          fill="#777777"
          fontSize="9"
          fontWeight="520"
          letterSpacing="1.35"
          textAnchor="end"
        >
          TRAFFIC / DNS / MEMORY
        </text>
        <path d="M24 56H672" stroke="white" strokeOpacity="0.095" />

        <path d="M172 92H672" stroke="white" strokeOpacity="0.16" />
        <path d="M198 84V100M422 84V100M648 84V100" stroke="white" strokeOpacity="0.16" />
        <g fill="#777777" fontSize="9" fontWeight="520" letterSpacing="1.35" textAnchor="middle">
          <text x="198" y="76">
            CONNECT
          </text>
          <text x="422" y="76">
            LIVE SESSION
          </text>
          <text x="648" y="76">
            DISCONNECT
          </text>
        </g>

        <g fill="#747474" fontSize="9" fontWeight="500" letterSpacing="1">
          <text x="24" y="136">
            ENCRYPTED TRAFFIC
          </text>
          <text x="24" y="232">
            SITE SOURCE
          </text>
          <text x="24" y="290">
            DNS ROUTE
          </text>
          <text x="24" y="412">
            SESSION MEMORY
          </text>
        </g>

        <g fill="#575757" fontSize="8" fontWeight="470" letterSpacing="0.72">
          <text x="130" y="154">
            TX
          </text>
          <text x="130" y="194">
            RX
          </text>
          <text x="130" y="316">
            VPN TUNNEL
          </text>
          <text x="130" y="364">
            OUTSIDE VPN
          </text>
          <text x="172" y="488">
            RAM ONLY SERVERS · NO DATA AFTER DISCONNECT
          </text>
        </g>

        <g fill="#606060" fontSize="9" fontWeight="460" letterSpacing="0.68" textAnchor="end">
          <text x="674" y="136">
            BYTES / INTERVAL
          </text>
          <text x="674" y="232">
            REAL IP ABSENT
          </text>
        </g>

        <path d="M172 174H674" stroke="white" strokeOpacity="0.095" />
        <DesktopTrafficBars />

        <path d="M172 242H674" stroke="white" strokeOpacity="0.095" />
        <path
          d="M172 242H198V224H648V242H674"
          fill="none"
          stroke="#dcdcdc"
          strokeOpacity="0.43"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="222" y="220" fill="#c7c7c7" fontSize="11" fontWeight="520" letterSpacing="0.5">
          SHARED EXIT IP
        </text>

        <path d="M172 328H674" stroke="white" strokeOpacity="0.095" />
        <DesktopDnsBars />
        <path d="M172 370H674" stroke="white" strokeOpacity="0.095" />
        <path d="M172 370H674" stroke="white" strokeOpacity="0.19" strokeDasharray="4 6" />
        <text
          x="648"
          y="362"
          fill="#c7c7c7"
          fontSize="11"
          fontWeight="520"
          letterSpacing="0.5"
          textAnchor="end"
        >
          0 LEAKED QUERIES
        </text>

        <path
          d="M172 426H674M172 448H674M172 470H674"
          stroke="white"
          strokeOpacity="0.05"
          strokeDasharray="2 7"
        />
        <path
          d="M172 470H198L212 468L226 465L240 466L256 460L272 459L288 456L304 457L320 450L336 449L352 444L368 446L384 438L400 439L416 432L432 434L448 426L464 428L480 420L496 422L512 416L528 418L544 412L560 414L576 408L592 410L608 404L624 406L640 398L648 398V470H674V470Z"
          fill="white"
          fillOpacity="0.075"
        />
        <path
          d="M172 470H198L212 468L226 465L240 466L256 460L272 459L288 456L304 457L320 450L336 449L352 444L368 446L384 438L400 439L416 432L432 434L448 426L464 428L480 420L496 422L512 416L528 418L544 412L560 414L576 408L592 410L608 404L624 406L640 398H648V470H674"
          fill="none"
          stroke="white"
          strokeOpacity="0.48"
          strokeWidth="1.1"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />

        <path d="M24 512H672" stroke="white" strokeOpacity="0.095" />
        <text
          x="24"
          y="548"
          fill="#8f8f8f"
          fontSize="14"
          fontWeight="390"
          fontFamily="var(--font-sans)"
        >
          A shared identity leaves the tunnel while DNS stays inside and memory is released.
        </text>
      </g>
    </svg>
  )
}

function MobileTrafficBars() {
  return mobileTx.map((height, index) => {
    const x = 104 + index * 18

    return (
      <g key={x}>
        <rect x={x} y={139 - height} width="6" height={height} fill="white" fillOpacity="0.48" />
        <rect
          x={x + 7}
          y="143"
          width="6"
          height={mobileRx[index]}
          fill="white"
          fillOpacity="0.22"
        />
      </g>
    )
  })
}

function MobileDnsBars() {
  return mobileDns.map((height, index) => (
    <rect
      key={index}
      x={118 + index * 21}
      y={261 - height}
      width="6"
      height={height}
      fill="white"
      fillOpacity="0.38"
    />
  ))
}

function MobileDiagram() {
  return (
    <svg
      viewBox="0 0 360 430"
      className="h-full w-full lg:hidden"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="privacy-dots-mobile" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.65" fill="white" fillOpacity="0.055" />
        </pattern>
      </defs>

      <rect width="360" height="430" fill="url(#privacy-dots-mobile)" />

      <g style={{ fontFamily: 'var(--font-mono)' }}>
        <text x="18" y="28" fill="#777777" fontSize="8" fontWeight="520" letterSpacing="1.05">
          SESSION PRIVACY
        </text>
        <text
          x="342"
          y="28"
          fill="#777777"
          fontSize="8"
          fontWeight="520"
          letterSpacing="1.05"
          textAnchor="end"
        >
          LIVE ROUTE
        </text>
        <path d="M18 44H342" stroke="white" strokeOpacity="0.095" />

        <path d="M94 72H342" stroke="white" strokeOpacity="0.16" />
        <path d="M112 65V79M222 65V79M326 65V79" stroke="white" strokeOpacity="0.16" />
        <g fill="#777777" fontSize="7" fontWeight="520" letterSpacing="0.8" textAnchor="middle">
          <text x="112" y="59">
            CONNECT
          </text>
          <text x="222" y="59">
            LIVE
          </text>
          <text x="326" y="59">
            OFF
          </text>
        </g>

        <g fill="#747474" fontSize="8" fontWeight="500" letterSpacing="0.85">
          <text x="18" y="104">
            ENCRYPTED
          </text>
          <text x="18" y="113">
            TRAFFIC
          </text>
          <text x="18" y="190">
            SITE SOURCE
          </text>
          <text x="18" y="230">
            DNS ROUTE
          </text>
          <text x="18" y="316">
            MEMORY
          </text>
        </g>

        <g fill="#575757" fontSize="7" fontWeight="470" letterSpacing="0.58">
          <text x="78" y="125">
            TX
          </text>
          <text x="78" y="158">
            RX
          </text>
          <text x="84" y="253">
            TUNNEL
          </text>
          <text x="84" y="286">
            OUTSIDE
          </text>
        </g>

        <path d="M94 141H342" stroke="white" strokeOpacity="0.095" />
        <MobileTrafficBars />
        <text x="342" y="104" fill="#606060" fontSize="7" letterSpacing="0.55" textAnchor="end">
          BYTES / INTERVAL
        </text>

        <path d="M94 200H342" stroke="white" strokeOpacity="0.095" />
        <path
          d="M94 200H112V184H326V200H342"
          fill="none"
          stroke="#dcdcdc"
          strokeOpacity="0.43"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="134" y="180" fill="#c7c7c7" fontSize="9" fontWeight="520" letterSpacing="0.38">
          SHARED EXIT IP
        </text>

        <path d="M94 261H342" stroke="white" strokeOpacity="0.095" />
        <MobileDnsBars />
        <text x="342" y="247" fill="#606060" fontSize="6.5" letterSpacing="0.45" textAnchor="end">
          IPv4 + IPv6 ROUTED
        </text>
        <path d="M94 292H342" stroke="white" strokeOpacity="0.095" />
        <path d="M94 292H342" stroke="white" strokeOpacity="0.19" strokeDasharray="4 6" />
        <text x="326" y="285" fill="#c7c7c7" fontSize="8" letterSpacing="0.4" textAnchor="end">
          0 LEAKED
        </text>

        <path
          d="M94 332H342M94 352H342M94 372H342"
          stroke="white"
          strokeOpacity="0.05"
          strokeDasharray="2 7"
        />
        <path
          d="M94 372H112L126 370L140 366L154 367L168 360L182 362L196 354L210 355L224 348L238 350L252 342L266 344L280 336L294 339L308 330L320 332L326 326V372H342Z"
          fill="white"
          fillOpacity="0.075"
        />
        <path
          d="M94 372H112L126 370L140 366L154 367L168 360L182 362L196 354L210 355L224 348L238 350L252 342L266 344L280 336L294 339L308 330L320 332L326 326V372H342"
          fill="none"
          stroke="white"
          strokeOpacity="0.48"
          strokeWidth="1.05"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        <text x="342" y="316" fill="#606060" fontSize="6.5" letterSpacing="0.4" textAnchor="end">
          0 AT DISCONNECT
        </text>

        <path d="M18 392H342" stroke="white" strokeOpacity="0.095" />
        <text
          x="18"
          y="410"
          fill="#8f8f8f"
          fontSize="9.5"
          fontWeight="390"
          fontFamily="var(--font-sans)"
        >
          A shared identity leaves the tunnel.
        </text>
        <text
          x="18"
          y="423"
          fill="#8f8f8f"
          fontSize="9.5"
          fontWeight="390"
          fontFamily="var(--font-sans)"
        >
          DNS stays inside; memory is released.
        </text>
      </g>
    </svg>
  )
}

export function PrivacyDiagram({ active, reducedMotion }: PrivacyDiagramProps) {
  return (
    <motion.div
      className="privacy-diagram-fade absolute inset-0"
      initial={reducedMotion ? false : { opacity: 0, transform: 'translateY(10px)' }}
      animate={
        reducedMotion || active
          ? { opacity: 1, transform: 'translateY(0px)' }
          : { opacity: 0, transform: 'translateY(10px)' }
      }
      transition={reducedMotion ? { duration: 0 } : diagramTransition}
    >
      <DesktopDiagram />
      <MobileDiagram />
    </motion.div>
  )
}
