import { useCallback, useSyncExternalStore } from 'react'

/** Подписка на media query: компонент перерисовывается только при смене ответа. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

/** Порог `lg` из Tailwind — тот же, по которому переключаются макеты секций. */
export const DESKTOP_QUERY = '(min-width: 64rem)'
