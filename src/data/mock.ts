/**
 * Мок-данные dashboard (см. PROJECT.md → «Dashboard»).
 * Реального бэкенда нет: всё генерируется здесь, даты — относительно сегодня,
 * чтобы данные не протухали. Случайность — только seeded (mulberry32),
 * иначе цифры меняются на каждый рендер/перезагрузку.
 */

export const DAY_MS = 24 * 60 * 60 * 1000

const now = Date.now()
const daysAgo = (n: number) => new Date(now - n * DAY_MS)

/** Seeded PRNG — один и тот же трафик при каждой загрузке */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// Тариф и пользователь
// ---------------------------------------------------------------------------

export const plan = {
  name: 'Spatium Plus',
  dailyRate: 0.15, // $/день, списывается ежедневно с баланса
  deviceLimit: 5,
}

export const initialUser = {
  nickname: 'astra',
  email: 'astra@example.com',
  /**
   * Баланс подобран так, чтобы подписки хватало на ~5 дней — на Overview
   * виден баннер «expires soon» (порог ≤ 7 дней).
   */
  balance: 0.75,
}

// ---------------------------------------------------------------------------
// Устройства
// ---------------------------------------------------------------------------

export type DeviceOS = 'macos' | 'ios' | 'windows' | 'android' | 'linux' | 'tv'

export type Device = {
  id: string
  name: string
  os: DeviceOS
  firstConnected: Date
  lastSeen: Date
  trafficGB: number
}

export const initialDevices: Device[] = [
  {
    id: 'dev-1',
    name: 'MacBook Pro 16″',
    os: 'macos',
    firstConnected: daysAgo(151),
    lastSeen: new Date(now - 2 * 60 * 1000),
    trafficGB: 142.4,
  },
  {
    id: 'dev-2',
    name: 'iPhone 17 Pro',
    os: 'ios',
    firstConnected: daysAgo(151),
    lastSeen: new Date(now - 68 * 60 * 1000),
    trafficGB: 38.2,
  },
  {
    id: 'dev-3',
    name: 'Home PC',
    os: 'windows',
    firstConnected: daysAgo(104),
    lastSeen: daysAgo(1),
    trafficGB: 61.7,
  },
]

// ---------------------------------------------------------------------------
// Трафик по дням (для графика Overview)
// ---------------------------------------------------------------------------

export type TrafficDay = { date: Date; gb: number }

/** 30 дней, ГБ/день: будни выше выходных + seeded-шум */
export const trafficDays: TrafficDay[] = (() => {
  const rand = mulberry32(20260731)
  return Array.from({ length: 30 }, (_, i) => {
    const date = daysAgo(29 - i)
    const weekday = date.getDay()
    const base = weekday === 0 || weekday === 6 ? 2.2 : 4.6
    const gb = Math.max(0.3, base + (rand() - 0.5) * 4.4)
    return { date, gb: Math.round(gb * 10) / 10 }
  })
})()

// ---------------------------------------------------------------------------
// Сервера
// ---------------------------------------------------------------------------

export type Server = {
  id: string
  country: string
  code: string // ISO 3166-1 alpha-2, нижний регистр — ключ флага в <Flag />

  city: string
  ping: number // ms, «оценка по геолокации» — панель не претендует на измерение
  load: number // 0–100 %
  type: 'standard' | 'gaming'
}

export const servers: Server[] = [
  { id: 'fra-1', country: 'Germany', code: 'de', city: 'Frankfurt', ping: 23, load: 42, type: 'standard' },
  { id: 'fra-g1', country: 'Germany', code: 'de', city: 'Frankfurt', ping: 26, load: 61, type: 'gaming' },
  { id: 'ams-1', country: 'Netherlands', code: 'nl', city: 'Amsterdam', ping: 31, load: 37, type: 'standard' },
  { id: 'ams-g1', country: 'Netherlands', code: 'nl', city: 'Amsterdam', ping: 34, load: 44, type: 'gaming' },
  { id: 'hel-1', country: 'Finland', code: 'fi', city: 'Helsinki', ping: 38, load: 21, type: 'standard' },
  { id: 'sto-1', country: 'Sweden', code: 'se', city: 'Stockholm', ping: 44, load: 55, type: 'standard' },
  { id: 'waw-g1', country: 'Poland', code: 'pl', city: 'Warsaw', ping: 48, load: 33, type: 'gaming' },
  { id: 'lon-1', country: 'United Kingdom', code: 'gb', city: 'London', ping: 52, load: 47, type: 'standard' },
  { id: 'par-1', country: 'France', code: 'fr', city: 'Paris', ping: 57, load: 39, type: 'standard' },
  { id: 'ist-1', country: 'Türkiye', code: 'tr', city: 'Istanbul', ping: 61, load: 78, type: 'standard' },
  { id: 'nyc-1', country: 'United States', code: 'us', city: 'New York', ping: 118, load: 58, type: 'standard' },
  { id: 'lax-1', country: 'United States', code: 'us', city: 'Los Angeles', ping: 162, load: 41, type: 'standard' },
  { id: 'tyo-g1', country: 'Japan', code: 'jp', city: 'Tokyo', ping: 191, load: 36, type: 'gaming' },
  { id: 'sin-1', country: 'Singapore', code: 'sg', city: 'Singapore', ping: 205, load: 63, type: 'standard' },
]

/**
 * Фейковый выходной IP сервера — показывается в приложении при подключении.
 * Детерминирован по id: один и тот же сервер всегда даёт один и тот же адрес,
 * иначе скриншоты экрана приложения не повторяются.
 */
export function exitIp(server: Server) {
  let h = 0
  for (const ch of server.id) h = (h * 31 + ch.charCodeAt(0)) | 0
  const rand = mulberry32(Math.abs(h))
  // 185.x.x.x — диапазон RIPE, выглядит правдоподобно для европейского хостинга
  return `185.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 254) + 1}`
}

/** Топ-N ближайших («recommended, nearest to you») */
export const recommendedServers = (n: number) =>
  [...servers].sort((a, b) => a.ping - b.ping).slice(0, n)

// ---------------------------------------------------------------------------
// Транзакции (Subscription → история)
// ---------------------------------------------------------------------------

export type Transaction = {
  id: string
  date: Date
  amount: number // + пополнение, − списание
  label: string
}

/**
 * Ежедневные списания + пополнение 8 дней назад: попадает в видимый топ-10
 * истории, чтобы список не был монотонным. Сортировка — новые сверху.
 */
export const initialTransactions: Transaction[] = (() => {
  const list: Transaction[] = []
  for (let i = 0; i <= 19; i++) {
    list.push({
      id: `tx-charge-${i}`,
      date: daysAgo(i),
      amount: -plan.dailyRate,
      label: 'Daily charge',
    })
  }
  list.push({ id: 'tx-topup-1', date: new Date(daysAgo(8).getTime() + 1), amount: 10, label: 'Top up' })
  return list.sort((a, b) => b.date.getTime() - a.date.getTime())
})()

// ---------------------------------------------------------------------------
// Ссылка-подписка
// ---------------------------------------------------------------------------

const TOKEN_ALPHABET = 'abcdef0123456789'

export function generateSubToken(seed = Date.now()) {
  const rand = mulberry32(seed)
  return Array.from({ length: 16 }, () => TOKEN_ALPHABET[Math.floor(rand() * TOKEN_ALPHABET.length)]).join('')
}

export const initialSubToken = generateSubToken(20260731)

export const subLink = (token: string) => `https://spatiumvpn.io/sub/${token}`
