/**
 * Световое поле секции Bypass.
 *
 * Геометрия намеренно аналитическая: один fullscreen-triangle рисует пять
 * плоских модулей DPI, их внутреннюю приборную разметку, сегментный луч и
 * вспышки контакта. Модули света не излучают: проходящий фронт лишь локально
 * повышает контраст схемы. Единственный сильный эффект секции — сам луч.
 */

export const PRISM_FIELD_VERT = `#version 300 es
in vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

export const PRISM_FIELD_FRAG = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uProgress;
uniform float uIdleTime;
uniform float uGateCount;
uniform float uMobile;
uniform float uContentLeft;
uniform float uDesktopGateSpan;
uniform float uMobileGateInset;
uniform vec3 uBeamCoreColor;
uniform vec3 uBeamGlowColor;
uniform vec3 uContactCoreColor;
uniform vec3 uContactGlowColor;
uniform vec3 uGlassEdgeColor;
uniform float uGlow;
uniform float uTaper;
uniform float uEdgeFade;

out vec4 fragColor;

const int MAX_GATES = 5;
const float PI = 3.14159265;

float saturate(float v) {
  return clamp(v, 0.0, 1.0);
}

float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = saturate(dot(pa, ba) / max(dot(ba, ba), 0.000001));
  return length(pa - ba * h);
}

float lineStroke(vec2 p, vec2 a, vec2 b, float widthPx) {
  float d = sdSegment(p, a, b);
  return 1.0 - smoothstep(widthPx, widthPx + 1.15, d);
}

float boxStroke(vec2 p, vec2 center, vec2 halfSize, float widthPx) {
  float d = abs(sdBox(p - center, halfSize));
  return 1.0 - smoothstep(widthPx, widthPx + 1.15, d);
}

float sdRoundedBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

float roundedBoxStroke(vec2 p, vec2 center, vec2 halfSize,
                       float radius, float widthPx) {
  float d = abs(sdRoundedBox(p - center, halfSize, radius));
  return 1.0 - smoothstep(widthPx, widthPx + 1.15, d);
}

float dotField(vec2 p, vec2 center, vec2 halfSize, vec2 spacing) {
  vec2 local = p - center;
  float inside = step(abs(local.x), halfSize.x) * step(abs(local.y), halfSize.y);
  vec2 cell = mod(local + spacing * 0.5, spacing) - spacing * 0.5;
  return inside * (1.0 - smoothstep(0.72, 1.52, length(cell)));
}

float moduleHalfWidth(float index) {
  return mix(0.034, 0.052, uMobile) + index * 0.0;
}

float moduleHalfHeight(float index) {
  return mix(0.170, 0.122, uMobile) + index * 0.0;
}

float innerGateMask(float gateT) {
  // Вход и выход остаются спокойными, три внутренних этапа формируют ломаную.
  return smoothstep(0.02, 0.24, gateT)
       * (1.0 - smoothstep(0.76, 0.98, gateT));
}

float staticPointOffset(float gateT) {
  float gateIndex = floor(gateT * max(uGateCount - 1.0, 1.0) + 0.5);
  // Две некратные волны дают устойчивую, но не механически чередующуюся
  // ломаную. На mobile амплитуда меньше из-за более низких модулей.
  float shape = sin(gateIndex * 2.5 + 0.4) * 0.75
              + sin(gateIndex * 3.7 + 1.2) * 0.25;
  return shape * mix(0.053, 0.047, uMobile) * innerGateMask(gateT);
}

float idlePointShift(float t, float gateT) {
  if (t <= 0.0) return 0.0;

  float gateIndex = floor(gateT * max(uGateCount - 1.0, 1.0) + 0.5);
  float slowDrift = sin(t * 0.39 + gateIndex * 1.71)
                  + sin(t * 0.23 + gateIndex * 2.83) * 0.36;
  float enter = smoothstep(0.0, 1.6, t);
  return slowDrift * 0.0105 * enter * innerGateMask(gateT);
}

float idleSignalAtX(float x, float t) {
  // Первый сигнал идёт с небольшой паузой после интро. Дальше он занимает
  // меньше половины цикла, чтобы между проходами было спокойное idle-состояние.
  if (t < 1.8) return 0.0;

  float phase = mod(t - 1.8, 4.55) / 4.55;
  float travel = saturate(phase / 0.45);
  float signalActive = 1.0 - smoothstep(0.42, 0.45, phase);
  float headX = mix(-0.12, 1.12, smoothstep(0.0, 1.0, travel));
  return exp(-pow((x - headX) / 0.105, 2.0)) * signalActive;
}

float pathY(float gateT) {
  // На широком экране луч проходит чуть ниже геометрического центра рамок,
  // как в выбранном кадре. На мобильном возвращаем его к центру: там иначе
  // теряется полезная высота между текстом и чипами.
  float base = mix(0.370, 0.385, uMobile);
  return base + staticPointOffset(gateT) + idlePointShift(uIdleTime, gateT);
}

float segmentContactEnvelope(float x, float startX, float endX) {
  float width = max(endX - startX, 0.000001);
  float t = saturate((x - startX) / width);
  float inside = step(startX, x) * step(x, endX);
  // Нулевая производная на контактах сохраняет гладкий стык сегментов:
  // 100% у точек, 70% точно посередине между ними.
  float envelope = 1.0 - 0.25 * pow(sin(t * PI), 2.0);
  return mix(1.0, envelope, inside);
}

float persistentSegmentEnvelope(float x, float left, float right) {
  float envelope = 1.0;

  for (int i = 0; i < MAX_GATES; i++) {
    float fi = float(i);
    if (fi >= uGateCount) break;

    float gateT = fi / max(uGateCount - 1.0, 1.0);
    float moduleX = mix(left, right, gateT);
    float halfW = moduleHalfWidth(fi);
    float entryX = moduleX - halfW;
    float exitX = moduleX + halfW;

    // Отрезок внутри модуля: entry → exit.
    envelope *= segmentContactEnvelope(x, entryX, exitX);

    if (fi + 1.0 < uGateCount) {
      float nextGateT = (fi + 1.0) / max(uGateCount - 1.0, 1.0);
      float nextModuleX = mix(left, right, nextGateT);
      float nextEntryX = nextModuleX - moduleHalfWidth(fi + 1.0);
      // Отрезок между модулями: текущий exit → следующий entry.
      envelope *= segmentContactEnvelope(x, exitX, nextEntryX);
    }
  }

  return envelope;
}

vec3 strandProfile(float distancePx, float env, float thickness) {
  // Это намеренно почти буквальная формула React Bits Strands. Толщина и
  // яркость растут из одной продольной env, а длинный хвост рождается из
  // рационального профиля — без отдельных gaussian bloom / box-shadow слоёв.
  float e = 0.53; // intensity = 0.5 в терминах Strands
  float d = distancePx / uResolution.y;
  float thick = (0.001 + 0.05 * e) * (0.35 + env) * thickness;
  float g = thick / (d + thick * 0.45);
  g *= g;

  // Белое ядро и отдельный холодный спад. В слабых участках виден
  // uBeamGlowColor, в плотном центре — uBeamCoreColor.
  vec3 tint = mix(uBeamGlowColor, uBeamCoreColor, smoothstep(0.45, 1.55, g));
  vec3 raw = tint * g * env;
  return 1.0 - exp(-raw * uGlow);
}

vec3 contactLight(vec2 px, vec2 centerPx, float intensity) {
  float r = length(px - centerPx);
  // Сначала читаемая «жемчужина» в 1–2 CSS px, затем компактная корона и
  // только потом bloom. Так точка не растворяется в собственном размытии.
  float dot = 1.0 - smoothstep(1.0, 4.0, r);
  float pearl = exp(-pow(r / 5.6, 4.0));
  vec3 nucleus = uContactCoreColor * (dot * 1.65 + pearl * 0.48);

  vec3 coronaRadii = vec3(8.5, 9.0, 9.5);
  vec3 corona = exp(-pow(vec3(r) / coronaRadii, vec3(2.0)))
              * uContactGlowColor * 0.50;
  vec3 halo = exp(-pow(vec3(r) / (coronaRadii * 3.2), vec3(2.0)))
            * uContactGlowColor * 0.098;
  return (nucleus + corona + halo) * intensity;
}

float moduleDetails(vec2 local, vec2 halfSize, float index) {
  float detail = 0.0;

  // Общая приборная грамматика: разделители сверху/снизу и ряд калибровки у
  // тракта. Вариативность рождается внутренностями, а не формой карточек.
  detail += lineStroke(local,
    vec2(-halfSize.x * 0.68, halfSize.y * 0.54),
    vec2( halfSize.x * 0.68, halfSize.y * 0.54), 0.46);
  detail += lineStroke(local,
    vec2(-halfSize.x * 0.68, -halfSize.y * 0.63),
    vec2( halfSize.x * 0.68, -halfSize.y * 0.63), 0.46);

  if (index < 0.5) {
    detail += dotField(local, vec2(0.0, halfSize.y * -0.045),
                       vec2(halfSize.x * 0.66, halfSize.y * 0.5), vec2(8.0, 7.0));
  } else if (index < 1.5) {
    detail += boxStroke(local, vec2(0.0, halfSize.y * 0.35),
                        vec2(halfSize.x * 0.68, 8.0), 0.42);
    detail += boxStroke(local, vec2(0.0, halfSize.y * 0.22),
                        vec2(halfSize.x * 0.68, 8.0), 0.42);
    detail += boxStroke(local, vec2(0.0, halfSize.y * 0.10),
                        vec2(halfSize.x * 0.68, 8.0), 0.42);
    detail += boxStroke(local, vec2(0.0, halfSize.y * -0.02),
                        vec2(halfSize.x * 0.68, 8.0), 0.42);
    detail += boxStroke(local, vec2(0.0, halfSize.y * -0.34),
                        vec2(halfSize.x * 0.68, 48.0), 0.42);
    detail += dotField(local, vec2(0.0, -halfSize.y * 0.36),
                       vec2(halfSize.x * 0.55, halfSize.y * 0.135), vec2(13.0, 13.0));
  } else if (index < 2.5) {
    detail += boxStroke(local, vec2(-halfSize.x * 0.62, halfSize.y * -0.045),
                        vec2(4, halfSize.y * 0.5), 0.42);
    detail += boxStroke(local, vec2(-halfSize.x * 0.30, halfSize.y * -0.045),
                        vec2(4, halfSize.y * 0.5), 0.42);
    detail += dotField(local, vec2(halfSize.x * 0.30, halfSize.y * 0.3),
                       vec2(halfSize.x * 0.38, halfSize.y * 0.16), vec2(8.0, 7.0));
    detail += boxStroke(local, vec2(-halfSize.x * 0.001, halfSize.y * -0.245),
                        vec2(4, halfSize.y * 0.3), 0.42);
    detail += boxStroke(local, vec2(-halfSize.x * -0.3, halfSize.y * -0.245),
                        vec2(4, halfSize.y * 0.3), 0.42);
    detail += boxStroke(local, vec2(-halfSize.x * -0.6, halfSize.y * -0.245),
                        vec2(4, halfSize.y * 0.3), 0.42);
  } else if (index < 3.5) {
    // POLICY — разреженные вертикальные выборки. Линии намеренно не связаны:
    // это поле измерений, а не разводка печатной платы.
    detail += lineStroke(local,
      vec2(-halfSize.x * 0.72,  halfSize.y * 0.12),
      vec2(-halfSize.x * 0.72, -halfSize.y * 0.18), 0.42);
    detail += lineStroke(local,
      vec2(-halfSize.x * 0.54,  halfSize.y * 0.31),
      vec2(-halfSize.x * 0.54, -halfSize.y * 0.06), 0.42);
    detail += lineStroke(local,
      vec2(-halfSize.x * 0.36,  halfSize.y * 0.48),
      vec2(-halfSize.x * 0.36, -halfSize.y * 0.32), 0.42);
    detail += lineStroke(local,
      vec2(-halfSize.x * 0.18,  halfSize.y * 0.24),
      vec2(-halfSize.x * 0.18, -halfSize.y * 0.10), 0.42);
    detail += lineStroke(local,
      vec2(0.0,                    halfSize.y * 0.44),
      vec2(0.0,                   -halfSize.y * 0.52), 0.42);
    detail += lineStroke(local,
      vec2( halfSize.x * 0.18,  halfSize.y * 0.18),
      vec2( halfSize.x * 0.18, -halfSize.y * 0.28), 0.42);
    detail += lineStroke(local,
      vec2( halfSize.x * 0.36,  halfSize.y * 0.38),
      vec2( halfSize.x * 0.36, -halfSize.y * 0.42), 0.42);
    detail += lineStroke(local,
      vec2( halfSize.x * 0.54,  halfSize.y * 0.16),
      vec2( halfSize.x * 0.54, -halfSize.y * 0.12), 0.42);
    detail += lineStroke(local,
      vec2( halfSize.x * 0.72,  halfSize.y * 0.27),
      vec2( halfSize.x * 0.72, -halfSize.y * 0.23), 0.42);
  } else {
    // RATE — один непрерывный сигнал, квантованный по вертикальным уровням.
    vec2 p0 = vec2(-halfSize.x * 0.72,  halfSize.y * 0.38);
    vec2 p1 = vec2(-halfSize.x * 0.43,  halfSize.y * 0.38);
    vec2 p2 = vec2(-halfSize.x * 0.43,  halfSize.y * 0.19);
    vec2 p3 = vec2(-halfSize.x * 0.10,  halfSize.y * 0.19);
    vec2 p4 = vec2(-halfSize.x * 0.10, -halfSize.y * 0.01);
    vec2 p5 = vec2( halfSize.x * 0.22, -halfSize.y * 0.01);
    vec2 p6 = vec2( halfSize.x * 0.22, -halfSize.y * 0.22);
    vec2 p7 = vec2( halfSize.x * 0.50, -halfSize.y * 0.22);
    vec2 p8 = vec2( halfSize.x * 0.50, -halfSize.y * 0.39);
    vec2 p9 = vec2( halfSize.x * 0.72, -halfSize.y * 0.39);

    detail += lineStroke(local, p0, p1, 0.46);
    detail += lineStroke(local, p1, p2, 0.46);
    detail += lineStroke(local, p2, p3, 0.46);
    detail += lineStroke(local, p3, p4, 0.46);
    detail += lineStroke(local, p4, p5, 0.46);
    detail += lineStroke(local, p5, p6, 0.46);
    detail += lineStroke(local, p6, p7, 0.46);
    detail += lineStroke(local, p7, p8, 0.46);
    detail += lineStroke(local, p8, p9, 0.46);

    // Короткое слабое эхо добавляет глубину, но не превращает декор в график
    // с осями или вторую самостоятельную кривую.
    detail += lineStroke(local,
      vec2(-halfSize.x * 0.16, -halfSize.y * 0.34),
      vec2( halfSize.x * 0.14, -halfSize.y * 0.34), 0.42) * 0.24;
    detail += lineStroke(local,
      vec2( halfSize.x * 0.14, -halfSize.y * 0.34),
      vec2( halfSize.x * 0.14, -halfSize.y * 0.48), 0.42) * 0.24;
    detail += lineStroke(local,
      vec2( halfSize.x * 0.14, -halfSize.y * 0.48),
      vec2( halfSize.x * 0.42, -halfSize.y * 0.48), 0.42) * 0.24;
  }

  return min(detail, 1.55);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 px = gl_FragCoord.xy;
  float aspect = uResolution.x / uResolution.y;

  float firstHalfW = moduleHalfWidth(0.0);
  float lastHalfW = moduleHalfWidth(4.0);
  // Первая внешняя кромка совпадает с контентным inset; на mobile более
  // компактную группу центрируют одинаковые безопасные края.
  float left = mix(uContentLeft + firstHalfW,
                   uMobileGateInset + firstHalfW, uMobile);
  float right = mix(min(uContentLeft + uDesktopGateSpan, 0.94),
                    1.0 - uMobileGateInset - lastHalfW, uMobile);
  float gateBaseY = mix(0.389, 0.385, uMobile);
  float beamBaseY = mix(0.370, 0.385, uMobile);

  float gateFade = smoothstep(0.0, 0.22, uProgress);
  float revealX = mix(-0.08, 1.08, smoothstep(0.03, 0.96, uProgress));
  float revealMask = 1.0 - smoothstep(revealX, revealX + 0.030, uv.x);

  vec3 col = vec3(0.0);

  // Пять плоских модулей DPI. Рамка и внутренняя геометрия получают один и тот
  // же локальный свет: радиальный от двух точек контакта и полосовой от участка
  // луча внутри модуля. Вдали от тракта остаётся только слабый матовый контур.
  for (int i = 0; i < MAX_GATES; i++) {
    float fi = float(i);
    if (fi >= uGateCount) break;

    float gateT = fi / max(uGateCount - 1.0, 1.0);
    float x = mix(left, right, gateT);
    vec2 center = vec2(x, gateBaseY);
    vec2 centerPx = center * uResolution;
    vec2 halfSizePx = vec2(moduleHalfWidth(fi) * uResolution.x,
                           moduleHalfHeight(fi) * uResolution.y);
    vec2 local = px - centerPx;

    float cornerRadiusPx = uResolution.y * 0.0055;
    float outline = roundedBoxStroke(px, centerPx, halfSizePx,
                                     cornerRadiusPx, 0.58);
    float details = moduleDetails(local, halfSizePx, fi);

    float halfW = moduleHalfWidth(fi);
    float path = pathY(gateT);
    vec2 entryPx = vec2(x - halfW, path) * uResolution;
    vec2 exitPx = vec2(x + halfW, path) * uResolution;
    float pointDistancePx = min(length(px - entryPx), length(px - exitPx));
    float lineDistancePx = sdSegment(px, entryPx, exitPx);

    // Интро и idle считаются в координате текущего пикселя, а не центра
    // модуля. Поэтому световое пятно непрерывно проходит по его геометрии.
    float proximity = exp(-pow((uv.x - revealX) / mix(0.105, 0.145, uMobile), 2.0));
    float idleReveal = idleSignalAtX(uv.x, uIdleTime);
    float settled = smoothstep(0.78, 1.0, uProgress);
    float passed = smoothstep(-0.055, 0.018, revealX - uv.x);

    // Idle не поднимает яркость всего модуля. Он только немного расширяет
    // физическую область света вокруг текущего участка луча и его контактов.
    float pointRadiusPx = uResolution.y * mix(0.058, 0.078, idleReveal);
    float lineRadiusPx = uResolution.y * mix(0.040, 0.054, idleReveal);
    float pointLight = 1.0 / (1.0 + pow(pointDistancePx / pointRadiusPx, 2.0));
    float lineLight = 1.0 / (1.0 + pow(lineDistancePx / lineRadiusPx, 2.0));
    float localLight = max(pointLight, lineLight * 0.76);

    float persistentEnergy = mix(0.125, 0.4, smoothstep(0.18, 0.96, uv.x));
    float lightEnergy = passed * mix(0.035, persistentEnergy, settled)
                      + proximity * 0.19
                      + idleReveal * 0.055;
    float baseGain = mix(0.025, 0.035, settled);
    float surfaceGain = (baseGain + localLight * lightEnergy) * gateFade;

    col += uGlassEdgeColor * outline * surfaceGain;
    col += uGlassEdgeColor * details * surfaceGain;
  }

  // Едва видимая граница зоны DPI — матовая пунктирная разметка, не панель.
  vec2 boundaryMin = vec2(left - firstHalfW - 0.016, gateBaseY - 0.205);
  vec2 boundaryMax = vec2(right + lastHalfW + 0.016, gateBaseY + 0.205);
  float nearHorizontal = min(abs(uv.y - boundaryMin.y), abs(uv.y - boundaryMax.y));
  float nearVertical = min(abs((uv.x - boundaryMin.x) * aspect),
                           abs((uv.x - boundaryMax.x) * aspect));
  float withinX = step(boundaryMin.x, uv.x) * step(uv.x, boundaryMax.x);
  float withinY = step(boundaryMin.y, uv.y) * step(uv.y, boundaryMax.y);
  float dashX = step(0.48, fract((uv.x - boundaryMin.x) * uResolution.x / 11.0));
  float dashY = step(0.48, fract((uv.y - boundaryMin.y) * uResolution.y / 11.0));
  float boundary = (1.0 - smoothstep(0.0, 1.15 / uResolution.y, nearHorizontal))
                 * withinX * dashX;
  boundary += (1.0 - smoothstep(0.0, 1.15 / uResolution.y, nearVertical))
            * withinY * dashY;
  col += uGlassEdgeColor * boundary * 0.01 * gateFade;

  // Сегментный луч: у каждого модуля две точки контакта, между ними тракт идёт
  // горизонтально. Так сохраняется богатая ломаная исходной графики при пяти
  // смысловых этапах вместо двенадцати пустых рамок.
  float beamDistance = 10000.0;
  vec2 previous = vec2(-0.06, beamBaseY);

  for (int i = 0; i < MAX_GATES; i++) {
    float fi = float(i);
    if (fi >= uGateCount) break;
    float gateT = fi / max(uGateCount - 1.0, 1.0);
    float moduleX = mix(left, right, gateT);
    // Use the exact frame half-width for the optical path. The previous 0.94
    // inset placed both contact pearls a few pixels inside each module instead
    // of on its vertical outline.
    float halfW = moduleHalfWidth(fi);
    vec2 entry = vec2(moduleX - halfW, pathY(gateT));
    vec2 exitPoint = vec2(moduleX + halfW, pathY(gateT));
    beamDistance = min(beamDistance, sdSegment(px, previous * uResolution,
                                               entry * uResolution));
    beamDistance = min(beamDistance, sdSegment(px, entry * uResolution,
                                               exitPoint * uResolution));
    previous = exitPoint;
  }

  beamDistance = min(beamDistance,
    sdSegment(px, previous * uResolution, vec2(1.06, beamBaseY) * uResolution));

  float beamGain = smoothstep(0.015, 0.09, uProgress) * revealMask;

  // Taper = 6, как в приложенном Strands. Во время прохода центр огибающей
  // совпадает с фронтом справа: слева остаётся тонкий хвост, справа возникает
  // широкая световая масса. После прохода она затухает до постоянного пола,
  // причём справа пол выше — луч не исчезает и не становится равномерным.
  float headCenter = min(revealX, 0.965);
  float envelopeRadius = mix(0.58, 0.72, uMobile);
  float envelopePhase = clamp((uv.x - headCenter) / envelopeRadius, -1.0, 1.0);
  float movingEnv = pow(max(cos(envelopePhase * PI * 0.5), 0.0), uTaper);
  float headLife = uProgress < 0.999 ? 1.0 : exp(-uIdleTime * 0.55);
  movingEnv *= headLife;

  float settled = smoothstep(0.78, 1.0, uProgress);
  float persistentEnv = mix(0.10, 0.26, smoothstep(0.18, 0.96, uv.x));
  persistentEnv *= persistentSegmentEnvelope(uv.x, left, right);
  float longitudinal = max(mix(0.035, persistentEnv, settled), movingEnv);
  longitudinal += idleSignalAtX(uv.x, uIdleTime) * 0.050;

  vec3 beamCol = strandProfile(beamDistance, longitudinal,
                               mix(1.40, 0.90, uMobile)) * beamGain;

  // Вход и выход каждого модуля получают собственную контактную точку.
  for (int i = 0; i < MAX_GATES; i++) {
    float fi = float(i);
    if (fi >= uGateCount) break;
    float gateT = fi / max(uGateCount - 1.0, 1.0);
    float moduleX = mix(left, right, gateT);
    float halfW = moduleHalfWidth(fi);
    for (int side = 0; side < 2; side++) {
      float sideSign = side == 0 ? -1.0 : 1.0;
      float contactX = moduleX + halfW * sideSign;
      float frontDistance = revealX - contactX;
      float passed = smoothstep(-0.080, -0.038, frontDistance);
      float flash = exp(-pow((frontDistance + 0.052) / 0.026, 2.0));
      float idleSignal = idleSignalAtX(contactX, uIdleTime) * 0.10;

      vec2 contact = vec2(contactX, pathY(gateT)) * uResolution;
      col += contactLight(px, contact, passed * 0.49 + flash * 1.00 + idleSignal);
    }
  }

  // Свет не должен выдавать прямоугольную кромку канваса или новый шов между
  // секциями. По горизонтали оставляем мягкий выход луча, по вертикали гасим.
  float verticalEdge = smoothstep(0.02, 0.15, uv.y)
                     * (1.0 - smoothstep(0.86, 0.98, uv.y));
  float horizontalEdge = smoothstep(0.0, uEdgeFade, uv.x)
                       * (1.0 - smoothstep(1.0 - uEdgeFade, 1.0, uv.x));
  float edgeMask = verticalEdge * horizontalEdge;
  col *= edgeMask;
  beamCol *= edgeMask;

  // Детали схемы и контакты компрессируем отдельно, а готовый Strands-профиль
  // композим screen-blend. Иначе второй tone-map снова сделал бы луч плоским.
  col = 1.0 - exp(-col * 1.18);
  col = 1.0 - (1.0 - col) * (1.0 - beamCol);
  float alpha = saturate(max(max(col.r, col.g), col.b));
  fragColor = vec4(col, alpha);
}
`
