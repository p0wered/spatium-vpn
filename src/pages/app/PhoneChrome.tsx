import { useId } from 'react'
import { BarChart3, Globe, Shield, User } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

export type AppTab = 'home' | 'servers' | 'stats' | 'account'

/**
 * Отбивка под динамический остров. Своей системной строки (время, сигнал,
 * wi-fi, батарея, бейдж VPN) экран больше не рисует, но остров впечён в PNG
 * рамки и стоит по центру — контент обязан начинаться ниже него, иначе шапка
 * уезжает под вырез. Высота та же, что была у статус-строки: остальная
 * вертикальная раскладка экрана от неё отсчитана.
 */
export function StatusBarSpacer() {
  return <div aria-hidden className="h-[54px] shrink-0" />
}

const TABS: { id: AppTab; label: string; icon: typeof Shield; enabled: boolean }[] = [
  { id: 'home', label: 'Home', icon: Shield, enabled: true },
  { id: 'servers', label: 'Servers', icon: Globe, enabled: true },
  { id: 'stats', label: 'Stats', icon: BarChart3, enabled: false },
  { id: 'account', label: 'Account', icon: User, enabled: false },
]

/**
 * Таб-бар — плавающая стеклянная пилюля: полосы во всю ширину нет, контент
 * уезжает под неё.
 *
 * Механика подложки взята у PillTabs (layoutId + spring 450/38), чтобы
 * движение совпадало с остальными переключателями проекта, но сам компонент
 * не переиспользован: у него нет disabled-опций (Stats и Account обязаны
 * оставаться некликабельными), метки стоят в строку, а контейнер жёстко залит
 * bg-surface-2 — в стеклянной панели его пришлось бы перебивать конфликтующей
 * утилитой того же веса.
 *
 * Живые вкладки — только Home и Servers. Остальные именно disabled, а не
 * «мёртвые» на вид: иначе с клавиатуры на них можно уйти в никуда.
 */
export function TabBar({ value, onChange }: { value: AppTab; onChange: (t: AppTab) => void }) {
  const layoutId = useId()
  const reduced = useReducedMotion()

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-stretch">
      {/*
        Подложка под пилюлей. Сплошная полоса раньше перекрывала список сама;
        плавающая пилюля этого не делает, и в состоянии «выглядывает» шторка
        уходит ниже экрана — строки торчали из-под пилюли, срезанные нижним
        краем. Гасим градиентом, а не панелью: у панели есть верхняя кромка,
        и она читалась бы линией.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[150px] bg-gradient-to-t from-black from-45% via-black/85 to-transparent"
      />

      <div
        role="tablist"
        aria-label="Sections"
        className="relative mx-4 flex gap-0.5 rounded-full border border-white/10 bg-surface-1/25 p-1.5 backdrop-blur-2xl"
      >
        {TABS.map(({ id, label, icon: Icon, enabled }) => {
          const active = value === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!enabled}
              onClick={() => onChange(id)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-full py-2 transition-colors ${
                enabled ? 'cursor-pointer' : 'cursor-default'
              } ${active ? 'text-fg' : enabled ? 'text-fg-muted' : 'text-fg-muted/35'}`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  aria-hidden
                  className="absolute inset-0 bg-white/12"
                  style={{ borderRadius: 9999 }}
                  transition={
                    reduced ? { duration: 0 } : { type: 'spring', stiffness: 450, damping: 38 }
                  }
                />
              )}
              <Icon
                size={19}
                strokeWidth={active ? 2.1 : 1.7}
                className="relative"
                style={active ? { filter: 'drop-shadow(0 0 7px rgb(255 255 255/.45))' } : undefined}
              />
              <span className="relative text-[10px] leading-none font-medium tracking-tight">
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Home indicator */}
      <span
        aria-hidden
        className="relative mx-auto mt-2.5 mb-2 h-[5px] w-[136px] rounded-full bg-fg/85"
      />
    </div>
  )
}
