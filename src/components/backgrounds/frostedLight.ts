import { Mesh, Program, RenderTarget, type OGLRenderingContext, type Renderer } from 'ogl'

/**
 * Матовое стекло, запечённое в канвас света.
 *
 * Панели Bypass и Privacy лежат поверх светового канваса, и раньше свет под
 * ними размывал backdrop-filter самой панели. Свет после вступления не
 * меняется, но backdrop-filter об этом не знает: браузер заново захватывал
 * подложку и размывал её на каждом кадре скролла — в Firefox это 3–4 мс из
 * кадра, пока панель на экране.
 *
 * Здесь то же размытие делает сам канвас: кадр света рисуется во внеэкранную
 * текстуру, а в области стекла вместо него выводится его гауссова копия. Цикл
 * отрисовки останавливается вместе с вступлением, так что после него блюр не
 * стоит ничего.
 *
 * Картинка повторяет backdrop-filter: blur():
 * - сигма гаусса равна радиусу из CSS;
 * - размывается только то, что попало в прямоугольник стекла, а у его краёв
 *   изображение отражается внутрь (edgeMode = mirror — так backdrop-filter
 *   определён в Filter Effects 2);
 * - результат обрезан по скруглению панели.
 *
 * Блюр считается на копии, уменьшенной вчетверо: при сигме в десятки пикселей
 * разницы не видно, а выборок нужно в шестнадцать раз меньше.
 */

const DOWNSCALE = 4
/** Потолок радиуса ядра в текселях уменьшенной копии (3σ при σ ≈ 21). */
const MAX_RADIUS = 64

const VERT = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const DOWN_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform vec2 uSourceTexel;
uniform vec2 uResolution;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  // Четыре билинейные выборки со сдвигом на пиксель покрывают блок 4×4
  // целиком. Одной выборки мало: ядро гребня тоньше трёх пикселей и между
  // отсчётами просто пропало бы.
  fragColor = 0.25 * (
      texture(uSource, uv + uSourceTexel * vec2(-1.0, -1.0))
    + texture(uSource, uv + uSourceTexel * vec2( 1.0, -1.0))
    + texture(uSource, uv + uSourceTexel * vec2(-1.0,  1.0))
    + texture(uSource, uv + uSourceTexel * vec2( 1.0,  1.0))
  );
}
`

const BLUR_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uSource;
uniform vec2 uResolution;
uniform vec2 uAxis;
// Сигма в текселях уменьшенной копии
uniform float uSigma;
// Стекло в uv канваса: x0, y0, x1, y1 (y снизу)
uniform vec4 uRegion;

out vec4 fragColor;

float mirror(float t) {
  return 1.0 - abs(1.0 - mod(t, 2.0));
}

void main() {
  vec2 texel = 1.0 / uResolution;
  vec2 uv = gl_FragCoord.xy * texel;

  // Вне стекла размытая копия не выводится. Запас в тексель нужен билинейной
  // выборке у самой кромки.
  if (any(lessThan(uv, uRegion.xy - texel)) || any(greaterThan(uv, uRegion.zw + texel))) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 size = uRegion.zw - uRegion.xy;
  int radius = int(min(ceil(uSigma * 3.0), ${MAX_RADIUS}.0));
  float falloff = -0.5 / (uSigma * uSigma);

  vec4 sum = vec4(0.0);
  float total = 0.0;
  for (int i = -radius; i <= radius; i++) {
    float offset = float(i);
    float weight = exp(falloff * offset * offset);
    vec2 t = (uv + uAxis * texel * offset - uRegion.xy) / size;
    t = vec2(mirror(t.x), mirror(t.y));
    sum += texture(uSource, uRegion.xy + t * size) * weight;
    total += weight;
  }
  fragColor = sum / total;
}
`

const COMPOSITE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uScene;
uniform sampler2D uFrost;
uniform vec2 uResolution;
// Стекло в пикселях канваса: центр (y снизу) и полуразмер
uniform vec4 uGlass;
uniform float uRadius;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 sharp = texture(uScene, uv);

  // Скруглённый прямоугольник панели со сглаженной в пиксель кромкой
  vec2 q = abs(gl_FragCoord.xy - uGlass.xy) - (uGlass.zw - uRadius);
  float edge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
  float inside = clamp(0.5 - edge, 0.0, 1.0);
  if (inside <= 0.0) {
    fragColor = sharp;
    return;
  }

  fragColor = mix(sharp, texture(uFrost, uv), inside);
}
`

/** Прямоугольник стекла в пикселях канваса, от его левого верхнего угла. */
export interface GlassRect {
  left: number
  top: number
  width: number
  height: number
}

export interface FrostedLight {
  /** Размер drawing buffer канваса. */
  setSize: (width: number, height: number) => void
  /**
   * Где лежит стекло и как сильно оно размывает. Радиус скругления и сигма —
   * в пикселях канваса. null — стекла нет, свет рисуется как есть.
   */
  setGlass: (rect: GlassRect | null, cornerRadius?: number, sigma?: number) => void
  render: () => void
}

/**
 * @param scene Меш, рисующий сам свет — тот же, что раньше уходил прямо на экран.
 */
export function createFrostedLight(
  gl: OGLRenderingContext,
  renderer: Renderer,
  scene: Mesh,
): FrostedLight {
  const gl2 = gl as OGLRenderingContext & WebGL2RenderingContext
  const geometry = scene.geometry

  // Промежуточные шаги блюра — в half-float, если его можно рендерить: три
  // прохода с округлением до восьми бит дали бы полосы на пологом спаде света.
  const floatTarget = gl2.getExtension('EXT_color_buffer_float')
    ? { type: gl2.HALF_FLOAT, internalFormat: gl2.RGBA16F }
    : {}

  const sceneTarget = new RenderTarget(gl, { width: 1, height: 1, depth: false })
  const downTarget = new RenderTarget(gl, { width: 1, height: 1, depth: false, ...floatTarget })
  const blurXTarget = new RenderTarget(gl, { width: 1, height: 1, depth: false, ...floatTarget })
  const blurYTarget = new RenderTarget(gl, { width: 1, height: 1, depth: false, ...floatTarget })

  const pass = (fragment: string, uniforms: Record<string, { value: unknown }>) =>
    new Mesh(gl, {
      geometry,
      program: new Program(gl, {
        vertex: VERT,
        fragment,
        uniforms,
        depthTest: false,
        depthWrite: false,
      }),
    })

  const down = pass(DOWN_FRAG, {
    uSource: { value: sceneTarget.texture },
    uSourceTexel: { value: [1, 1] },
    uResolution: { value: [1, 1] },
  })
  const blur = pass(BLUR_FRAG, {
    uSource: { value: downTarget.texture },
    uResolution: { value: [1, 1] },
    uAxis: { value: [1, 0] },
    uSigma: { value: 1 },
    uRegion: { value: [0, 0, 1, 1] },
  })
  const composite = pass(COMPOSITE_FRAG, {
    uScene: { value: sceneTarget.texture },
    uFrost: { value: blurYTarget.texture },
    uResolution: { value: [1, 1] },
    uGlass: { value: [0, 0, 0, 0] },
    uRadius: { value: 0 },
  })

  let width = 1
  let height = 1
  let glass: GlassRect | null = null
  let sigma = 0

  return {
    setSize(nextWidth, nextHeight) {
      width = Math.max(1, nextWidth)
      height = Math.max(1, nextHeight)
      const smallWidth = Math.ceil(width / DOWNSCALE)
      const smallHeight = Math.ceil(height / DOWNSCALE)

      sceneTarget.setSize(width, height)
      downTarget.setSize(smallWidth, smallHeight)
      blurXTarget.setSize(smallWidth, smallHeight)
      blurYTarget.setSize(smallWidth, smallHeight)

      down.program.uniforms.uSourceTexel.value = [1 / width, 1 / height]
      down.program.uniforms.uResolution.value = [smallWidth, smallHeight]
      blur.program.uniforms.uResolution.value = [smallWidth, smallHeight]
      composite.program.uniforms.uResolution.value = [width, height]
    },

    setGlass(rect, cornerRadius = 0, nextSigma = 0) {
      glass = rect && rect.width > 0 && rect.height > 0 && nextSigma > 0 ? rect : null
      sigma = nextSigma
      if (!glass) return

      // gl_FragCoord отсчитывает снизу, DOM — сверху
      const bottom = height - (glass.top + glass.height)
      blur.program.uniforms.uRegion.value = [
        glass.left / width,
        bottom / height,
        (glass.left + glass.width) / width,
        (bottom + glass.height) / height,
      ]
      composite.program.uniforms.uGlass.value = [
        glass.left + glass.width / 2,
        bottom + glass.height / 2,
        glass.width / 2,
        glass.height / 2,
      ]
      composite.program.uniforms.uRadius.value = Math.min(
        cornerRadius,
        glass.width / 2,
        glass.height / 2,
      )
    },

    render() {
      if (!glass) {
        renderer.render({ scene })
        return
      }

      renderer.render({ scene, target: sceneTarget })
      renderer.render({ scene: down, target: downTarget })

      const uniforms = blur.program.uniforms
      uniforms.uSigma.value = Math.max(sigma / DOWNSCALE, 0.001)
      uniforms.uSource.value = downTarget.texture
      uniforms.uAxis.value = [1, 0]
      renderer.render({ scene: blur, target: blurXTarget })
      uniforms.uSource.value = blurXTarget.texture
      uniforms.uAxis.value = [0, 1]
      renderer.render({ scene: blur, target: blurYTarget })

      renderer.render({ scene: composite })
    },
  }
}
