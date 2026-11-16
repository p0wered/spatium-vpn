import type { CSSProperties } from 'react'

/**
 * Прогрессивный блюр у кромки (по мотивам React Bits GradualBlur).
 * От исходника взято ядро приёма: стопка слоёв, у каждого свой
 * backdrop-filter и градиентная маска. На чистом чёрном фоне слой
 * невидим — «стекло» проявляется, только когда под него заезжает контент.
 *
 * Всё остальное переделано — у исходника (и у промежуточной версии
 * с геометрической прогрессией ×2) были видны стыки слоёв:
 *
 * 1. Маска слоя — не полоса, а ступень: слой включается на своём участке
 *    и держится до самой кромки. У полосы есть «конец», на котором блюр
 *    проседает до подхвата следующей, — это и читалось линиями. Ступени
 *    же складываются монотонно: backdrop-filter каждого слоя видит уже
 *    размытый результат предыдущих.
 * 2. Разгон альфы — smoothstep, а не линейный: у линейной рампы на каждом
 *    стопе излом производной, глаз ловит его как границу.
 * 3. Сила слоёв считается из целевого профиля σ(t) = maxBlur·t², а не
 *    удвоением. При удвоении вся видимая часть перехода ужималась
 *    в верхнюю четверть зоны, и кромка зоны читалась как граница;
 *    квадратичный профиль растягивает переход на всю высоту и стартует
 *    с нулевой производной — вход в блюр незаметен.
 *
 * Цена слоя не зависит от его площади: каждый backdrop-filter — отдельный
 * захват подложки и отдельные проходы блюра, которые браузер повторяет на
 * каждом кадре скролла. В Firefox это ~0.7 мс на слой, и стопка из восьми
 * съедала две трети бюджета кадра. Поэтому слоёв четыре, а не восемь.
 *
 * Вдвое меньше слоёв — вдвое шире рампы, и в середине зоны резкая картинка
 * дольше просвечивает сквозь размытую. RAMP_SPAN = 1.5 возвращает профиль
 * на место: численная модель стопки (свёртка + смешивание по маске) даёт
 * расхождение с восьмислойным вариантом почти вдвое меньше, чем при
 * перекрытии ×2, а соседние рампы всё ещё перекрываются — стыков нет.
 */

/** Промежуточных стопов в smoothstep-разгоне маски одного слоя */
const RAMP_STOPS = 5

/** Длина разгона маски в долях шага слоя: > 1 — рампы соседей перекрываются */
const RAMP_SPAN = 1.5

/**
 * Маска слоя: альфа по smoothstep разгоняется от 0 на `start`% до 1 на `end`%
 * и дальше держится до кромки (100%).
 */
function stepMask(direction: string, start: number, end: number) {
  const stops: string[] = []
  if (start > 0) stops.push('rgba(0,0,0,0) 0%')
  for (let s = 0; s <= RAMP_STOPS; s++) {
    const t = s / RAMP_STOPS
    const alpha = t * t * (3 - 2 * t)
    const pos = start + (end - start) * t
    stops.push(`rgba(0,0,0,${alpha.toFixed(3)}) ${pos.toFixed(2)}%`)
  }
  if (end < 100) stops.push('rgb(0,0,0) 100%')
  return `linear-gradient(${direction}, ${stops.join(', ')})`
}

export function GradualBlur({
  position = 'top',
  height = '7rem',
  maxBlur = 1.75,
  divCount = 4,
  className = '',
}: {
  position?: 'top' | 'bottom'
  height?: string
  /** Суммарная сила блюра у самой кромки, rem */
  maxBlur?: number
  divCount?: number
  className?: string
}) {
  const direction = position === 'top' ? 'to top' : 'to bottom'

  // Целевой профиль силы: σ(t) = maxBlur·t², где t — доля пути до кромки
  const sigma = (n: number) => maxBlur * (n / divCount) ** 2

  const layers: CSSProperties[] = []
  for (let i = 1; i <= divCount; i++) {
    // Блюры складываются квадратично (σ² = Σσᵢ²), поэтому слою достаётся
    // ровно то, чего не хватает до профиля
    const blur = Math.sqrt(sigma(i) ** 2 - sigma(i - 1) ** 2)

    // Рампы соседних слоёв перекрываются — ступени сливаются в градиент
    const start = ((i - 1) / divCount) * 100
    const end = Math.min(((i - 1 + RAMP_SPAN) / divCount) * 100, 100)

    const mask = stepMask(direction, start, end)
    layers.push({
      maskImage: mask,
      WebkitMaskImage: mask,
      backdropFilter: `blur(${blur.toFixed(3)}rem)`,
    })
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${position === 'top' ? 'top-0' : 'bottom-0'} ${className}`}
      style={{ height }}
    >
      {layers.map((style, i) => (
        <div key={i} className="absolute inset-0" style={style} />
      ))}
    </div>
  )
}
