import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GrainOverlay } from '../../components/GrainOverlay'
import { exitIp } from '../../data/mock'
import { formatDuration, formatTrafficMB } from '../../lib/format'
import { ConnectButton } from './ConnectButton'
import { StatusBarSpacer, TabBar, type AppTab } from './PhoneChrome'
import { ServerSheet, type SheetState } from './ServerSheet'
import { ServersTab } from './ServersTab'
import { useAppParams, useConnection } from './useConnection'

/** Логический размер экрана iPhone 17 в CSS-пикселях */
const SCREEN_W = 402
const SCREEN_H = 874

const STATUS_LABEL: Record<string, string> = {
  off: 'Not protected',
  connecting: 'Connecting',
  on: 'Protected',
  disconnecting: 'Disconnecting',
}

const STATUS_HINT: Record<string, string> = {
  off: 'Your traffic is going out unencrypted',
  connecting: 'Negotiating a tunnel…',
  disconnecting: 'Closing the tunnel…',
}

/**
 * Мок главного экрана мобильного приложения SpatiumVPN (PROJECT.md → «Мок
 * мобильного приложения»). Приложения не существует — страница нужна ради
 * скриншотов в рамку iphone-17-mock.png, поэтому:
 *
 *  - экран всегда ровно 402×874 логических px, независимо от окна: скриншот
 *    обязан быть попиксельно одинаковым от запуска к запуску;
 *  - любое состояние ставится query-строкой (см. useAppParams), кликать по
 *    экрану ради нужного кадра не приходится;
 *  - роут живёт только в dev-сборке.
 *
 * Это единственное место во всей системе, где есть подключение: на лендинге и
 * в dashboard кнопки Connect нет по решению из PROJECT.md.
 */
export function AppPage() {
  const params = useAppParams()
  const { phase, toggle, waveKey, seconds, trafficMB, server, setServer } = useConnection(params)
  const [tab, setTab] = useState<AppTab>(params.tab ?? 'home')
  const [sheet, setSheet] = useState<SheetState>(params.sheet ?? 'peek')

  const connected = phase === 'on'

  const selectServer = (s: typeof server) => {
    setServer(s)
    setSheet('peek')
  }

  return (
    /*
     * Паддинг только на широких экранах. В окне ровно 402×874 (так снимает
     * скриншотер) любой отступ сдвигает экран и срезает его справа и снизу.
     */
    <div className="grid min-h-dvh place-items-center bg-black md:p-4">
      <div
        style={{ width: SCREEN_W, height: SCREEN_H }}
        className="relative flex shrink-0 flex-col overflow-hidden bg-bg text-fg select-none"
      >
        <StatusBarSpacer />

        {tab === 'home' ? (
          <>
            {/* Шапки (логотип + аватар) на этом экране нет: ядро остаётся
                единственным объектом сверху. Её высота не отдана вверх, а
                оставлена отбивкой — иначе кнопка уезжает к вырезу и вся
                композиция сползает от шторки. */}
            <div aria-hidden className="h-[44px] shrink-0" />

            <ConnectButton phase={phase} waveKey={waveKey} onToggle={toggle} />

            {/* Блок статуса. Высота фиксирована: иначе кнопка над ним
                подпрыгивает при смене состояния — на скринах это видно как
                разное положение центра от кадра к кадру. */}
            <div className="relative z-10 h-[108px] shrink-0 px-6 text-center">
              <div className="flex items-center justify-center gap-2">
                <motion.span
                  aria-hidden
                  animate={{
                    opacity: connected ? 1 : 0.4,
                    boxShadow: connected
                      ? '0 0 10px 1px var(--color-ice)'
                      : '0 0 0 0 rgb(255 255 255/0)',
                  }}
                  transition={{ duration: 0.5 }}
                  className="size-[5px] rounded-full bg-fg"
                />
                <span className="text-[11px] font-medium tracking-[0.14em] text-fg-muted uppercase">
                  {STATUS_LABEL[phase]}
                </span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {connected ? (
                  <motion.div
                    key="session"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="mt-2 font-mono text-[40px] leading-none font-medium tracking-tight tabular-nums">
                      {formatDuration(seconds)}
                    </div>
                    <div className="mt-2.5 font-mono text-[11px] text-fg-muted tabular-nums">
                      {exitIp(server)} · {formatTrafficMB(trafficMB)}
                    </div>
                  </motion.div>
                ) : (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 text-[13px] text-fg-muted"
                  >
                    {STATUS_HINT[phase]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <ServerSheet
              state={sheet}
              onStateChange={setSheet}
              current={server}
              onSelect={selectServer}
            />
          </>
        ) : (
          <ServersTab current={server} onSelect={setServer} />
        )}

        <TabBar value={tab} onChange={setTab} />

        <GrainOverlay opacity={0.035} className="z-40" />
      </div>
    </div>
  )
}
