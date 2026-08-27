import { useEffect } from 'react'
import LocomotiveScroll from 'locomotive-scroll'
import 'locomotive-scroll/locomotive-scroll.css'

/**
 * Инертный скролл лендинга — Locomotive Scroll v5.
 *
 * Почему v5, а не v4: v4 оборачивает страницу в transform-контейнер и
 * подменяет скролл своим — это ломает `fixed`-хедер с GradualBlur,
 * позиционирование WebGL-слоя в Hero и весь `whileInView` у motion
 * (IntersectionObserver считает вьюпорт по нетронутому нативному скроллу).
 * v5 построен на Lenis: он анимирует нативный `scrollTop`, поэтому
 * скроллбар, `position: fixed`, якоря и IntersectionObserver продолжают
 * работать как есть — инерция без побочного ущерба.
 *
 * Инстанс один на страницу и живёт в модуле, а не в контексте: до него
 * нужно дотянуться из обычных функций (`lib/scroll.ts`), а не только из
 * дерева React.
 */

let instance: LocomotiveScroll | null = null

/** Активный инстанс или null (reduced-motion / не лендинг) */
export const getSmoothScroll = () => instance

/**
 * Монтирует инертный скролл на время жизни страницы.
 * Вызывать один раз, на верхнем уровне страницы.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')

    const destroy = () => {
      instance?.destroy()
      instance = null
    }

    // Пересобираем по смене системной настройки, а не только при монтировании:
    // отключать инерцию нужно сразу, а не до следующей навигации
    const sync = () => {
      if (query.matches) {
        destroy()
        return
      }
      if (!instance) {
        instance = new LocomotiveScroll({
          lenisOptions: {
            // Сила инерции: чем меньше lerp, тем длиннее докатывание.
            // 0.1 ≈ 0.4 с — «отполированность», а не заметный эффект.
            lerp: 0.1,
            smoothWheel: true,
            // Тач не трогаем: у нативного скролла мобильных своя, привычная
            // физика, и подменять её инерцией Lenis — только вредить
            syncTouch: false,
          },
        })
      }
    }

    sync()
    query.addEventListener('change', sync)

    return () => {
      query.removeEventListener('change', sync)
      destroy()
    }
  }, [])
}

/**
 * Замок скролла для overlay-меню. Одного `overflow: hidden` на body мало:
 * Lenis крутит `scrollTop` у html и под замком продолжает накапливать
 * колесо — инстанс нужно останавливать явно (его `stop()` вешает на html
 * `.lenis-stopped` с `overflow: clip`).
 */
export function setScrollLocked(locked: boolean) {
  document.body.style.overflow = locked ? 'hidden' : ''
  if (locked) instance?.stop()
  else instance?.start()
}
