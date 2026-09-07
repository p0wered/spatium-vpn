/** Testimonials is the color reference: blue falloff, icy body, white hot core. */
const lightPalette = {
  paleBlue: [0.58, 0.72, 1.0],
  electricBlue: [0.19, 0.35, 0.94],
  iceWhite: [0.82, 0.9, 1.0],
  haloShadow: [0.17, 0.28, 0.58],
  haloBlue: [0.49, 0.64, 1.0],
  coreWhite: [1.0, 1.0, 1.0],
} as const

export const LIGHT_PALETTE_GLSL = Object.entries(lightPalette)
  .map(([name, rgb]) => `const vec3 ${name} = vec3(${rgb.map((v) => v.toFixed(2)).join(', ')});`)
  .join('\n')

// Strands accepts hex colors. Its exposure curve brings overlapping strands
// to white; keeping white out of the source palette preserves the cool falloff.
export const LANDING_STRAND_COLORS = [
  lightPalette.paleBlue,
  lightPalette.electricBlue,
  lightPalette.iceWhite,
].map(
  (rgb) =>
    `#${rgb
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')}`,
)
