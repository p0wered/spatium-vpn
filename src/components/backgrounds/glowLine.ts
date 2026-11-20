import { LIGHT_PALETTE_GLSL } from './lightPalette'

/**
 * Общий профиль световой линии для вторичной графики лендинга: гребни Bypass
 * и Pricing, кромка и луч Privacy, горизонт Testimonials. Секции отличаются
 * только геометрией — расстоянием до линии и её огибающей, — а сама линия
 * светится одинаково.
 *
 * Профиль как у Strands: (s / (d + s))² — горячее ядро с хвостом 1/d², а не
 * экспонента. Экспонента обрывается и читается как градиент; 1/d² тянет
 * ореол далеко от линии. Три масштаба повторяют слои box-shadow у ореола
 * GlassCard: тонкая кромка, ближний холодный ореол, дальняя дымка.
 *
 * Белого в источниках нет: как и у Strands, он получается из экспозиции
 * (glowTonemap), когда синий канал уже насыщен, а красный с зелёным
 * догоняют. Поэтому ядро горит белым, а спад остаётся голубым.
 *
 * Строка включает LIGHT_PALETTE_GLSL — отдельно палитру подключать не нужно.
 */
export const GLOW_LINE_GLSL = `${LIGHT_PALETTE_GLSL}

const float GLOW_EXPOSURE = 1.9;

float glowFalloff(float d, float s) {
  float g = s / (d + s);
  return g * g;
}

// dCore — расстояние до линии для кромки, dGlow — для ореола и дымки, оба в
// CSS px. Обычно они равны; горизонт растягивает dGlow под дугой, чтобы свет
// уходил вверх, а не вниз.
// envelope — 0..1 вдоль линии, ноль на её концах.
// center — 0..1, где линия горит сильнее всего (у Bypass — середина гребня).
vec3 glowLine(float dCore, float dGlow, float envelope, float center) {
  float taper = 0.5 + envelope * 0.5;
  // К концам кромка гаснет быстрее ореола: там остаётся тонкий холодный свет
  // с собственным ореолом, а не белая полоска без него.
  float line = glowFalloff(dCore, mix(0.6, 1.3, center) * taper)
    * pow(envelope, 1.25) * (0.55 + center * 0.45);
  float halo = glowFalloff(dGlow, mix(4.5, 9.0, center) * taper)
    * pow(envelope, 0.45) * (0.78 + center * 0.22);
  float haze = glowFalloff(dGlow, mix(10.0, 26.0, center))
    * envelope * (0.16 + center * 0.84);
  return line * iceWhite * 5.0 + halo * paleBlue * 1.7 + haze * haloBlue * 0.95;
}

// Широкий купол над самой яркой частью линии; radius — CSS px.
vec3 glowBloom(float d, float radius, float strength) {
  return exp(-d / radius) * strength * haloBlue * 0.42;
}

vec3 glowTonemap(vec3 exposure) {
  return 1.0 - exp(-exposure * GLOW_EXPOSURE);
}
`
