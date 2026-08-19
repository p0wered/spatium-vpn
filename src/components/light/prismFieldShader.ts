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

float dotField(vec2 p, vec2 center, vec2 halfSize, vec2 spacing) {
  vec2 local = p - center;
  float inside = step(abs(local.x), halfSize.x) * step(abs(local.y), halfSize.y);
  vec2 cell = mod(local + spacing * 0.5, spacing) - spacing * 0.5;
  return inside * (1.0 - smoothstep(0.72, 1.52, length(cell)));
}

float moduleHalfWidth(float index) {
  float desktop = 0.032;
  if (index > 0.5) desktop = 0.036;
  if (index > 1.5) desktop = 0.031;
  if (index > 2.5) desktop = 0.035;
  if (index > 3.5) desktop = 0.033;
  return mix(desktop, 0.052, uMobile);
}

float moduleHalfHeight(float index) {
  float desktop = 0.165;
  if (index > 0.5) desktop = 0.180;
  if (index > 1.5) desktop = 0.170;
  if (index > 2.5) desktop = 0.175;
  if (index > 3.5) desktop = 0.168;
  return mix(desktop, 0.122, uMobile);
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
    vec2(-halfSize.x * 0.68, -halfSize.y * 0.47),
    vec2( halfSize.x * 0.68, -halfSize.y * 0.47), 0.46);

  float tickBand = step(abs(local.y + halfSize.y * 0.08), 1.25)
                 * step(abs(local.x), halfSize.x * 0.68);
  float ticks = step(0.57, fract((local.x + halfSize.x) / 7.0));
  detail += tickBand * ticks * 0.72;

  if (index < 0.5) {
    // SNI — две выборки сигнатуры и короткий слот результата.
    detail += dotField(local, vec2(0.0, halfSize.y * 0.24),
                       vec2(halfSize.x * 0.66, halfSize.y * 0.10), vec2(8.0, 7.0));
    detail += dotField(local, vec2(0.0, -halfSize.y * 0.27),
                       vec2(halfSize.x * 0.66, halfSize.y * 0.10), vec2(8.0, 7.0));
    detail += boxStroke(local, vec2(-halfSize.x * 0.30, -halfSize.y * 0.06),
                        vec2(halfSize.x * 0.22, 4.0), 0.42);
  } else if (index < 1.5) {
    // TLS fingerprint — три заголовочных поля и более плотная матрица.
    detail += boxStroke(local, vec2(0.0, halfSize.y * 0.34),
                        vec2(halfSize.x * 0.60, 5.0), 0.42);
    detail += boxStroke(local, vec2(0.0, halfSize.y * 0.22),
                        vec2(halfSize.x * 0.60, 5.0), 0.42);
    detail += boxStroke(local, vec2(0.0, halfSize.y * 0.10),
                        vec2(halfSize.x * 0.60, 5.0), 0.42);
    detail += dotField(local, vec2(0.0, -halfSize.y * 0.25),
                       vec2(halfSize.x * 0.65, halfSize.y * 0.13), vec2(7.0, 7.0));
  } else if (index < 2.5) {
    // L7 — несколько вертикальных каналов разной плотности.
    detail += boxStroke(local, vec2(-halfSize.x * 0.38, halfSize.y * 0.10),
                        vec2(3.2, halfSize.y * 0.27), 0.42);
    detail += boxStroke(local, vec2(-halfSize.x * 0.08, halfSize.y * 0.10),
                        vec2(4.5, halfSize.y * 0.27), 0.42);
    detail += boxStroke(local, vec2( halfSize.x * 0.26, halfSize.y * 0.10),
                        vec2(2.4, halfSize.y * 0.27), 0.42);
    detail += dotField(local, vec2(halfSize.x * 0.54, halfSize.y * 0.10),
                       vec2(1.8, halfSize.y * 0.26), vec2(6.0, 7.0));
    detail += dotField(local, vec2(0.0, -halfSize.y * 0.30),
                       vec2(halfSize.x * 0.66, halfSize.y * 0.07), vec2(7.0, 7.0));
  } else if (index < 3.5) {
    // Policy — строгая матрица правил и два поля результата.
    detail += dotField(local, vec2(0.0, halfSize.y * 0.23),
                       vec2(halfSize.x * 0.64, halfSize.y * 0.17), vec2(10.0, 10.0));
    detail += boxStroke(local, vec2(0.0, -halfSize.y * 0.18),
                        vec2(halfSize.x * 0.59, 6.0), 0.42);
    detail += boxStroke(local, vec2(0.0, -halfSize.y * 0.33),
                        vec2(halfSize.x * 0.42, 4.0), 0.42);
  } else {
    // Rate — спектр коротких столбцов и семплы трафика.
    float waveMask = step(abs(local.x), halfSize.x * 0.68)
                   * step(abs(local.y - halfSize.y * 0.25), halfSize.y * 0.13);
    float wave = sin(local.x * 0.31) * 7.0 + sin(local.x * 0.73 + 1.4) * 3.0;
    detail += waveMask * (1.0 - smoothstep(0.65, 1.55,
      abs(local.y - halfSize.y * 0.25 - wave))) * 0.78;
    detail += dotField(local, vec2(0.0, -halfSize.y * 0.14),
                       vec2(halfSize.x * 0.65, halfSize.y * 0.12), vec2(7.0, 7.0));
    detail += boxStroke(local, vec2(0.0, -halfSize.y * 0.34),
                        vec2(halfSize.x * 0.56, 6.0), 0.42);
  }

  return min(detail, 1.55);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 px = gl_FragCoord.xy;
  float aspect = uResolution.x / uResolution.y;

  float firstHalfW = moduleHalfWidth(0.0);
  float lastHalfW = moduleHalfWidth(4.0);
  // Первая внешняя кромка совпадает с контентным inset; на mobile оставляем
  // небольшой безопасный край, достаточный для самой широкой схемы.
  float left = mix(uContentLeft + firstHalfW, 0.055 + firstHalfW, uMobile);
  float right = mix(min(uContentLeft + uDesktopGateSpan, 0.94),
                    0.945 - lastHalfW, uMobile);
  float gateBaseY = mix(0.389, 0.385, uMobile);
  float beamBaseY = mix(0.370, 0.385, uMobile);

  float gateFade = smoothstep(0.0, 0.22, uProgress);
  float revealX = mix(-0.08, 1.08, smoothstep(0.03, 0.96, uProgress));
  float revealMask = 1.0 - smoothstep(revealX, revealX + 0.030, uv.x);

  vec3 col = vec3(0.0);

  // Пять плоских модулей DPI. Их собственный контраст низкий; фронт света и
  // редкий idle-сигнал лишь проявляют ближайшую конструкцию, не зажигая кромки.
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

    float outline = boxStroke(px, centerPx, halfSizePx, 0.58);
    float details = moduleDetails(local, halfSizePx, fi);
    float proximity = exp(-pow((x - revealX) / mix(0.105, 0.145, uMobile), 2.0));
    float idleReveal = idleSignalAtX(x, uIdleTime);
    float settled = smoothstep(0.78, 1.0, uProgress);
    float baseGain = mix(0.025, 0.105, settled);
    float localGain = proximity * 0.20 + idleReveal * 0.10;

    col += uGlassEdgeColor * outline * (baseGain + localGain) * gateFade;
    col += uGlassEdgeColor * details * (baseGain * 0.58 + localGain * 0.88) * gateFade;
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
  col += uGlassEdgeColor * boundary * 0.050 * gateFade;

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
    float halfW = moduleHalfWidth(fi) * 0.94;
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
    float halfW = moduleHalfWidth(fi) * 0.94;
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
