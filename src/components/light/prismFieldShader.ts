/**
 * Световое поле секции Bypass.
 *
 * Геометрия намеренно аналитическая: один fullscreen-triangle рисует кромки
 * оптических рамок, сегментный луч и вспышки контакта. Это даёт точный
 * антиалиасинг на любом DPR и позволяет перестраивать путь без пересборки
 * мешей. Цвет не наносится поверх объектов — холод появляется только из-за
 * разной ширины профиля у RGB-каналов.
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

const int MAX_GATES = 12;
const float PI = 3.14159265;

float saturate(float v) {
  return clamp(v, 0.0, 1.0);
}

float easeOutCubic(float v) {
  v = saturate(v);
  return 1.0 - pow(1.0 - v, 3.0);
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

float tri(float x, float center, float radius) {
  return max(1.0 - abs(x - center) / radius, 0.0);
}

/*
 * В покое движется только одна локальная группа рамок. Большую часть цикла
 * поле неподвижно: иначе адаптация превращается в эквалайзер.
 */
float idleEnvelope(float t) {
  float phase = fract(t / 7.2);
  float enter = smoothstep(0.10, 0.22, phase);
  float leave = 1.0 - smoothstep(0.48, 0.66, phase);
  return enter * leave;
}

float activeIdleCenter(float t) {
  return mod(floor(t / 7.2), 2.0) < 1.0 ? 0.31 : 0.70;
}

float gateShift(float t, float gateT) {
  if (t <= 0.0) return 0.0;
  float direction = mod(floor(t / 7.2), 2.0) < 1.0 ? 1.0 : -1.0;
  return tri(gateT, activeIdleCenter(t), 0.095) * idleEnvelope(t) * direction * 0.013;
}

float pathY(float gateT) {
  // На широком экране луч проходит чуть ниже геометрического центра рамок,
  // как в выбранном кадре. На мобильном возвращаем его к центру: там иначе
  // теряется полезная высота между текстом и чипами.
  float base = mix(0.370, 0.385, uMobile);
  float settled = easeOutCubic((uProgress - 0.20) / 0.58);

  // Два осмысленных обхода из утверждённого кадра.
  float route = tri(gateT, 0.31, 0.105) * 0.038
              + tri(gateT, 0.70, 0.105) * 0.033;

  return base + route * settled + gateShift(uIdleTime, gateT);
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

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 px = gl_FragCoord.xy;
  float aspect = uResolution.x / uResolution.y;

  float gateHalfW = mix(0.0115, 0.020, uMobile);
  float gateHalfH = mix(0.175, 0.135, uMobile);
  // uContentLeft — левая кромка контента. Координата рамки задаёт её центр,
  // поэтому добавляем половину ширины: совпадает именно внешний край призмы.
  float left = mix(uContentLeft + gateHalfW, 0.075, uMobile);
  float right = mix(min(uContentLeft + uDesktopGateSpan, 0.94), 0.925, uMobile);
  float gateBaseY = mix(0.389, 0.385, uMobile);
  float beamBaseY = mix(0.370, 0.385, uMobile);

  float gateFade = smoothstep(0.0, 0.22, uProgress);
  float revealX = mix(-0.08, 1.08, smoothstep(0.03, 0.96, uProgress));
  float revealMask = 1.0 - smoothstep(revealX, revealX + 0.030, uv.x);

  vec3 col = vec3(0.0);

  // Призмы: основная кромка + сдвинутая задняя кромка дают минимальную
  // толщину без перспективного тоннеля.
  for (int i = 0; i < MAX_GATES; i++) {
    float fi = float(i);
    if (fi >= uGateCount) break;

    float gateT = fi / max(uGateCount - 1.0, 1.0);
    float x = mix(left, right, gateT);
    float shift = gateShift(uIdleTime, gateT);
    vec2 center = vec2(x, gateBaseY + shift);

    vec2 metric = vec2(aspect, 1.0);
    float front = abs(sdBox((uv - center) * metric, vec2(gateHalfW * aspect, gateHalfH)));
    float back = abs(sdBox((uv - center - vec2(0.0018, 0.0022)) * metric,
                           vec2(gateHalfW * aspect, gateHalfH)));

    float aa = max(fwidth(front), 0.00035);
    float frontLine = 1.0 - smoothstep(0.00055, 0.00055 + aa * 1.4, front);
    float backLine = 1.0 - smoothstep(0.00045, 0.00045 + aa * 1.4, back);

    float proximity = exp(-pow((uv.x - revealX) / 0.14, 2.0));
    float edgeGain = 0.190 + proximity * 0.075;
    col += uGlassEdgeColor * frontLine * edgeGain * gateFade;
    col += uGlassEdgeColor * backLine * 0.050 * gateFade;

    // Почти невидимое тело стекла проявляется только рядом с лучом.
    float body = 1.0 - smoothstep(-0.001, 0.002, sdBox((uv - center) * metric,
                                                       vec2(gateHalfW * aspect, gateHalfH)));
    float beamBand = exp(-pow((uv.y - pathY(gateT)) / 0.052, 2.0));
    col += vec3(0.12, 0.13, 0.15) * body * beamBand * 0.018 * gateFade;
  }

  // Сегментный луч в пиксельной метрике. Каждый следующий участок виден
  // только после того, как фронт дошёл до соответствующей призмы.
  float beamDistance = 10000.0;
  vec2 previous = vec2(-0.06, beamBaseY);

  for (int i = 0; i < MAX_GATES; i++) {
    float fi = float(i);
    if (fi >= uGateCount) break;
    float gateT = fi / max(uGateCount - 1.0, 1.0);
    vec2 current = vec2(mix(left, right, gateT), pathY(gateT));
    beamDistance = min(beamDistance,
      sdSegment(px, previous * uResolution, current * uResolution));
    previous = current;
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

  vec3 beamCol = strandProfile(beamDistance, longitudinal,
                               mix(1.40, 0.90, uMobile)) * beamGain;

  // Контакты загораются один за другим. После прохождения остаётся тихое
  // холодное ядро, а пик живёт около 170 мс.
  for (int i = 0; i < MAX_GATES; i++) {
    float fi = float(i);
    if (fi >= uGateCount) break;
    float gateT = fi / max(uGateCount - 1.0, 1.0);
    float hitAt = mix(0.15, 0.88, gateT);
    float passed = smoothstep(hitAt, hitAt + 0.035, uProgress);
    float flash = exp(-pow((uProgress - hitAt) / 0.032, 2.0));
    float idlePulse = 0.0;
    if (uIdleTime > 0.0) {
      idlePulse = tri(gateT, activeIdleCenter(uIdleTime), 0.095)
                * idleEnvelope(uIdleTime) * 0.32;
    }

    vec2 contact = vec2(mix(left, right, gateT), pathY(gateT)) * uResolution;
    col += contactLight(px, contact, passed * 0.56 + flash * 1.08 + idlePulse);
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

  // Детали стекла и контакты компрессируем отдельно, а готовый Strands-профиль
  // композим screen-blend. Иначе второй tone-map снова сделал бы луч плоским.
  col = 1.0 - exp(-col * 1.18);
  col = 1.0 - (1.0 - col) * (1.0 - beamCol);
  float alpha = saturate(max(max(col.r, col.g), col.b));
  fragColor = vec4(col, alpha);
}
`
