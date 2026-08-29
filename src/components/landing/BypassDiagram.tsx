import { motion } from 'motion/react'

interface BypassDiagramProps {
  active: boolean
  reducedMotion: boolean
}

const diagramTransition = {
  duration: 0.72,
  delay: 0.9,
  ease: [0.22, 1, 0.36, 1] as const,
}

const lineProps = {
  fill: 'none',
  stroke: '#f5f5f7',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function DesktopDiagram() {
  return (
    <svg
      viewBox="0 0 1060 563"
      className="hidden h-full w-full lg:block"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="bypass-dots-desktop" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="white" fillOpacity="0.055" />
        </pattern>
      </defs>

      <rect width="1060" height="563" fill="url(#bypass-dots-desktop)" />

      <g style={{ fontFamily: 'var(--font-mono)' }}>
        <text x="56" y="65" fill="#92939a" fontSize="11" letterSpacing="1.7">
          ONE ENDPOINT · TWO OBSERVER STATES
        </text>
        <text x="1004" y="65" fill="#92939a" fontSize="11" letterSpacing="1.7" textAnchor="end">
          AUTHENTICATED CAMOUFLAGE
        </text>
        <path d="M56 88H1004" stroke="white" strokeOpacity="0.075" />

        <g>
          <rect
            x="56"
            y="168"
            width="190"
            height="82"
            rx="12"
            fill="#09090b"
            stroke="white"
            strokeOpacity="0.14"
          />
          <text x="74" y="197" fill="#777980" fontSize="11" letterSpacing="1.1">
            ACTIVE PROBE
          </text>
          <text x="74" y="232" fill="#a1a1a6" fontSize="13" letterSpacing="1.15">
            NO CLIENT PROOF
          </text>
          <circle cx="222" cy="194" r="6" fill="white" fillOpacity="0.42" />
        </g>

        <g>
          <rect
            x="56"
            y="350"
            width="190"
            height="82"
            rx="12"
            fill="#09090b"
            stroke="white"
            strokeOpacity="0.2"
          />
          <text x="74" y="379" fill="#777980" fontSize="11" letterSpacing="1.1">
            VALID CLIENT
          </text>
          <text x="74" y="414" fill="#a1a1a6" fontSize="13" letterSpacing="1.15">
            CLIENT PROOF
          </text>
          <circle cx="222" cy="376" r="6" fill="#f5f5f7" />
        </g>

        <g>
          <rect
            x="356"
            y="130"
            width="348"
            height="304"
            rx="14"
            fill="#070709"
            stroke="white"
            strokeOpacity="0.2"
          />

          <rect
            x="370"
            y="144"
            width="320"
            height="118"
            rx="8"
            fill="#0b0b0e"
            stroke="white"
            strokeOpacity="0.1"
          />
          <text x="382" y="171" fill="#a1a1a6" fontSize="13" letterSpacing="0.9">
            PUBLIC TLS SURFACE
          </text>
          <text x="678" y="171" fill="#777980" fontSize="10" letterSpacing="0.75" textAnchor="end">
            PUBLIC TO OBSERVER
          </text>

          <rect
            x="384"
            y="204"
            width="90"
            height="42"
            rx="4"
            fill="#111114"
            stroke="white"
            strokeOpacity="0.09"
          />
          <rect
            x="485"
            y="204"
            width="90"
            height="42"
            rx="4"
            fill="#111114"
            stroke="white"
            strokeOpacity="0.09"
          />
          <rect
            x="586"
            y="204"
            width="90"
            height="42"
            rx="4"
            fill="#111114"
            stroke="white"
            strokeOpacity="0.09"
          />
          <text
            x="429"
            y="229"
            fill="#777980"
            fontSize="9"
            letterSpacing="0.55"
            textAnchor="middle"
          >
            TLS HANDSHAKE
          </text>
          <text
            x="530"
            y="229"
            fill="#777980"
            fontSize="9"
            letterSpacing="0.55"
            textAnchor="middle"
          >
            TLS IDENTITY
          </text>
          <text
            x="631"
            y="229"
            fill="#777980"
            fontSize="9"
            letterSpacing="0.55"
            textAnchor="middle"
          >
            WEB RESPONSE
          </text>

          <rect
            x="370"
            y="278"
            width="320"
            height="142"
            rx="8"
            fill="#09090b"
            stroke="white"
            strokeOpacity="0.11"
          />
          <text x="382" y="306" fill="#a1a1a6" fontSize="13" letterSpacing="0.9">
            HIDDEN PROXY PATH
          </text>
          <text x="678" y="306" fill="#777980" fontSize="10" letterSpacing="0.75" textAnchor="end">
            AUTH GATED
          </text>

          <rect
            x="386"
            y="334"
            width="88"
            height="70"
            rx="4"
            fill="#0d0d10"
            stroke="white"
            strokeOpacity="0.1"
          />
          <text
            x="430"
            y="358"
            fill="#777980"
            fontSize="10.5"
            letterSpacing="0.95"
            textAnchor="middle"
          >
            VERIFY
          </text>
          <path d="M412 377H448" stroke="white" strokeOpacity="0.3" />
          <circle cx="430" cy="377" r="6" fill="#0d0d10" stroke="white" strokeOpacity="0.45" />

          <rect
            x="510"
            y="334"
            width="164"
            height="70"
            rx="4"
            fill="#0f0f12"
            stroke="white"
            strokeOpacity="0.14"
          />
          <text
            x="592"
            y="360"
            fill="#777980"
            fontSize="10.5"
            letterSpacing="0.95"
            textAnchor="middle"
          >
            VLESS / TROJAN
          </text>
          <text
            x="592"
            y="385"
            fill="#a1a1a6"
            fontSize="11"
            letterSpacing="1.05"
            textAnchor="middle"
          >
            ENCRYPTED TUNNEL
          </text>
        </g>

        <g>
          <rect
            x="812"
            y="168"
            width="192"
            height="82"
            rx="12"
            fill="#09090b"
            stroke="white"
            strokeOpacity="0.14"
          />
          <text x="830" y="197" fill="#777980" fontSize="11" letterSpacing="1.05">
            PLAUSIBLE OUTPUT
          </text>
          <text x="830" y="232" fill="#a1a1a6" fontSize="13" letterSpacing="1.15">
            ORDINARY SITE
          </text>
        </g>

        <g>
          <rect
            x="812"
            y="350"
            width="192"
            height="82"
            rx="12"
            fill="#0a0a0d"
            stroke="white"
            strokeOpacity="0.2"
          />
          <text x="830" y="379" fill="#777980" fontSize="11" letterSpacing="1.05">
            PRIVATE OUTPUT
          </text>
          <text x="830" y="414" fill="#a1a1a6" fontSize="13" letterSpacing="1.15">
            PROXY SESSION
          </text>
        </g>

        <g {...lineProps} strokeWidth="1" strokeOpacity="0.42">
          <path d="M246 209H356" />
          <path d="M346 204L356 209L346 214" />

          <path d="M246 391H286C326 391 320 242 356 242" />
          <path d="M346 237L356 242L346 247" />

          <path d="M430 262V328" />
          <path d="M425 318L430 328L435 318" />

          <path d="M474 363H510" />
          <path d="M500 358L510 363L500 368" />

          <path d="M704 209H812" />
          <path d="M802 204L812 209L802 214" />

          <path d="M704 391H812" />
          <path d="M802 386L812 391L802 396" />
        </g>

        <path d="M56 456H1004" stroke="white" strokeOpacity="0.075" />
        <text x="56" y="481" fill="#92939a" fontSize="11" letterSpacing="1.15">
          THE PROBE AND THE CLIENT REACH THE SAME ADDRESS · ONLY ONE CAN REVEAL THE TUNNEL
        </text>
        <text x="56" y="510" fill="#f5f5f7" fontSize="14" fontFamily="var(--font-sans)">
          The public surface remains plausible while authentication gates access to the proxy behind
          it.
        </text>
      </g>
    </svg>
  )
}

function MobileDiagram() {
  return (
    <svg
      viewBox="0 0 360 430"
      className="h-full w-full lg:hidden"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <pattern id="bypass-dots-mobile" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="white" fillOpacity="0.055" />
        </pattern>
      </defs>

      <rect width="360" height="430" fill="url(#bypass-dots-mobile)" />

      <g style={{ fontFamily: 'var(--font-mono)' }}>
        <text x="18" y="28" fill="#92939a" fontSize="9.5" letterSpacing="1.3">
          ONE ENDPOINT · TWO OBSERVERS
        </text>

        <rect
          x="18"
          y="50"
          width="148"
          height="62"
          rx="11"
          fill="#09090b"
          stroke="white"
          strokeOpacity="0.14"
        />
        <text x="32" y="74" fill="#777980" fontSize="10.5" letterSpacing="0.8">
          ACTIVE PROBE
        </text>
        <text x="32" y="96" fill="#a1a1a6" fontSize="14" letterSpacing="0.8">
          NO PROOF
        </text>

        <rect
          x="194"
          y="50"
          width="148"
          height="62"
          rx="11"
          fill="#09090b"
          stroke="white"
          strokeOpacity="0.2"
        />
        <text x="208" y="74" fill="#777980" fontSize="10.5" letterSpacing="0.8">
          VALID CLIENT
        </text>
        <text x="208" y="96" fill="#a1a1a6" fontSize="13" letterSpacing="0.75">
          CLIENT PROOF
        </text>

        <rect
          x="18"
          y="146"
          width="324"
          height="164"
          rx="14"
          fill="#070709"
          stroke="white"
          strokeOpacity="0.2"
        />
        <rect
          x="30"
          y="158"
          width="300"
          height="62"
          rx="10"
          fill="#0b0b0e"
          stroke="white"
          strokeOpacity="0.1"
        />
        <text x="44" y="182" fill="#a1a1a6" fontSize="13" letterSpacing="0.75">
          PUBLIC TLS SURFACE
        </text>
        <text x="316" y="182" fill="#777980" fontSize="8" letterSpacing="0.9" textAnchor="end">
          SHARED ENTRY
        </text>
        <text x="44" y="204" fill="#777980" fontSize="9.5" letterSpacing="0.65">
          TLS HANDSHAKE · PUBLIC RESPONSE
        </text>

        <rect
          x="30"
          y="232"
          width="300"
          height="66"
          rx="10"
          fill="#09090b"
          stroke="white"
          strokeOpacity="0.11"
        />
        <rect
          x="44"
          y="244"
          width="122"
          height="42"
          rx="8"
          fill="#0d0d10"
          stroke="white"
          strokeOpacity="0.1"
        />
        <rect
          x="178"
          y="244"
          width="138"
          height="42"
          rx="8"
          fill="#0f0f12"
          stroke="white"
          strokeOpacity="0.14"
        />
        <text
          x="105"
          y="269"
          fill="#a1a1a6"
          fontSize="11.5"
          letterSpacing="0.7"
          textAnchor="middle"
        >
          WEB RESPONSE
        </text>
        <text
          x="247"
          y="261"
          fill="#777980"
          fontSize="9.5"
          letterSpacing="0.65"
          textAnchor="middle"
        >
          VERIFIED CLIENT
        </text>
        <text x="247" y="278" fill="#a1a1a6" fontSize="12" letterSpacing="0.65" textAnchor="middle">
          PROXY TUNNEL
        </text>

        <rect
          x="18"
          y="342"
          width="148"
          height="58"
          rx="11"
          fill="#09090b"
          stroke="white"
          strokeOpacity="0.14"
        />
        <text x="32" y="366" fill="#777980" fontSize="10" letterSpacing="0.7">
          PUBLIC OUTPUT
        </text>
        <text x="32" y="387" fill="#a1a1a6" fontSize="13" letterSpacing="0.75">
          ORDINARY SITE
        </text>

        <rect
          x="194"
          y="342"
          width="148"
          height="58"
          rx="11"
          fill="#0a0a0d"
          stroke="white"
          strokeOpacity="0.2"
        />
        <text x="208" y="366" fill="#777980" fontSize="10" letterSpacing="0.7">
          PRIVATE OUTPUT
        </text>
        <text x="208" y="387" fill="#a1a1a6" fontSize="13" letterSpacing="0.75">
          PROXY SESSION
        </text>

        <g {...lineProps} strokeWidth="1" strokeOpacity="0.42">
          <path d="M92 112V146" />
          <path d="M87 136L92 146L97 136" />
          <path d="M268 112V146" />
          <path d="M263 136L268 146L273 136" />
          <path d="M105 220V244" />
          <path d="M100 234L105 244L110 234" />
          <path d="M247 220V244" />
          <path d="M242 234L247 244L252 234" />
          <path d="M105 298V342" />
          <path d="M100 332L105 342L110 332" />
          <path d="M247 298V342" />
          <path d="M242 332L247 342L252 332" />
        </g>
      </g>
    </svg>
  )
}

export function BypassDiagram({ active, reducedMotion }: BypassDiagramProps) {
  return (
    <motion.div
      className="absolute inset-0"
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
