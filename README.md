![SpatiumVPN preview](.github/assets/macbook-preview.png)

<h1>SpatiumVPN</h1>

<p>
  A cinematic product concept for a private, censorship-resistant VPN — explored across a landing page, 
  account dashboard, and mobile client.
</p>

<p>
  <img src="https://img.shields.io/badge/React-191919.svg?logo=react&logoColor=77C4DB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-191919?logo=typescript&logoColor=3178c6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-191919?logo=vite&logoColor=#8C58EE" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-191919?logo=tailwindcss&logoColor=5FB5EB" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Framer_Motion-191919?logo=framer&logoColor=FDF45B" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/WebGL-191919?logo=webgl&logoColor=8C1A11" alt="WebGL" />
</p>

> [!IMPORTANT]
> SpatiumVPN is a **front-end portfolio project**, not a working VPN service. Authentication, traffic, billing, 
devices, servers, and connection states are simulated locally, there is no production backend or VPN tunnel.

## About the project

SpatiumVPN is a high-fidelity exploration of what a modern privacy product could feel like. Near black monochrome color
palette with no accent color. The accent in the design is achieved not through color, but through light.

### Included experiences

- **Marketing landing page** — animated hero, censorship-resistance story, technical diagrams, smooth scrolling, and responsive layouts.
- **Customer dashboard** — overview, traffic chart, device management, setup flow, subscription controls, server status, and account settings.
- **Mobile client prototype** — an interactive connection state machine, server selection, live session timer, traffic estimate.

## Design and engineering highlights

- Custom OGL fragment shaders for the hero strands, connection core, ice ridge, and privacy light.
- Motion orchestration with entrance sequences, layout transitions, glass reveals, and a reduced-motion path.
- Technical SVG/DOM diagrams that explain product ideas separately from decorative shader effects.
- Lazy-loaded visual effects and render loops that pause when content is off-screen or the document is hidden.
- Responsive navigation with a collapsible desktop sidebar and mobile drawer.
- Deterministic mock data and URL-controlled mobile states for reproducible visual testing.
- A compact token system where color appears primarily through light rather than solid accent fills.

## Tech stack

| Layer    | Tools                                      |
| -------- | ------------------------------------------ |
| UI       | React 19, TypeScript 6, React Router 8     |
| Styling  | Tailwind CSS 4, custom CSS, Geist Variable |
| Motion   | Motion for React, Locomotive Scroll        |
| Graphics | WebGL via OGL, SVG                         |
| Tooling  | Vite 8, Oxlint, Prettier, Puppeteer Core   |

## Getting started

### Requirements

- Node.js `20.19+` or `22.12+`
- npm

### Run locally

```bash
git clone https://github.com/p0wered/spatium-vpn.git
cd spatium-vpn
npm install
npm run dev
```

Vite will print the local development URL, usually `http://localhost:5173`.

The login screen is intentionally mocked: any email and password will open the dashboard.

## Routes

| Route             | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `/`               | Marketing landing page                      |
| `/login`          | Mock sign-in flow                           |
| `/dashboard`      | Account overview and nested dashboard pages |
| `/app`            | Fixed-size mobile client prototype          |
| `/dev`            | Internal design-system sandbox              |
| `/export/strands` | Deterministic WebGL export surface          |

### Reproducing mobile states

The mobile prototype accepts query parameters so a state can be opened directly without clicking through the UI:

```text
/app?state=connected&t=41:12&server=ams-1&sheet=open&tab=home
```

Supported controls include `state`, `t`, `server`, `sheet`, `tab`, and `live=1`. Forced states remain frozen by default,
which keeps generated screenshots consistent.