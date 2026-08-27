/**
 * Скриншотер мока мобильного приложения. Снимает /app в логическом размере экрана iPhone 17 и вставляет
 * кадр в рамку src/assets/iphone-17-mock.png.
 *
 * Область экрана в рамке НЕ задана константами: она находится заливкой по
 * прозрачным пикселям от центра картинки. Поэтому скрипт переживёт замену
 * рамки на другую модель — и сама маска берётся из альфы, вместе со
 * сглаженными скруглениями углов.
 *
 * Требует запущенный dev-сервер (npm run dev) — роут /app существует только
 * в dev-сборке.
 *
 *   node scripts/shoot-app.mjs
 *   node scripts/shoot-app.mjs --name hero --query "state=connected&t=02:14"
 *   node scripts/shoot-app.mjs --raw          # без рамки, голый экран
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const FRAME = resolve(ROOT, 'src/assets/iphone-17-mock.png')
const OUT_DIR = resolve(ROOT, 'shots')

/** Логический размер экрана iPhone 17 — тот же, что зашит в AppPage */
const SCREEN = { width: 402, height: 874 }
/** 3× — родная плотность устройства, скрин можно класть в макет как @3x */
const SCALE = 3
/** Пауза после загрузки: доезжают пружины motion и разгон uOn в шейдере */
const SETTLE_MS = 1400

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].filter(Boolean)

const DEFAULT_SHOTS = [
  { name: 'connected', query: 'state=connected&t=41:12' },
  { name: 'disconnected', query: 'state=off' },
  { name: 'connecting', query: 'state=connecting' },
  { name: 'sheet-open', query: 'state=connected&t=41:12&sheet=open' },
  { name: 'servers', query: 'tab=servers&state=connected&t=41:12' },
]

function parseArgs(argv) {
  const args = { raw: false, base: 'http://localhost:5173' }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--raw') args.raw = true
    else if (a === '--name') args.name = argv[++i]
    else if (a === '--query') args.query = argv[++i]
    else if (a === '--base') args.base = argv[++i]
    else throw new Error(`Неизвестный аргумент: ${a}`)
  }
  return args
}

/**
 * Композит кадра в рамку. Считается в браузере на canvas: единственная
 * альтернатива — тянуть в проект sharp или node-canvas ради одной операции.
 */
const composite = async (page, frameDataUrl, shotDataUrl) =>
  page.evaluate(
    async (frameSrc, shotSrc) => {
      const load = (src) =>
        new Promise((ok, fail) => {
          const img = new Image()
          img.onload = () => ok(img)
          img.onerror = () => fail(new Error('image decode failed'))
          img.src = src
        })

      const [frame, shot] = await Promise.all([load(frameSrc), load(shotSrc)])
      const { width: W, height: H } = frame

      const probe = document.createElement('canvas')
      probe.width = W
      probe.height = H
      const pctx = probe.getContext('2d', { willReadFrequently: true })
      pctx.drawImage(frame, 0, 0)
      const alpha = pctx.getImageData(0, 0, W, H).data

      /*
       * Заливка от центра по прозрачным пикселям. Просто «все прозрачные
       * пиксели» брать нельзя: фон вокруг корпуса телефона тоже прозрачный,
       * и кадр вылез бы за рамку.
       */
      const TRANSPARENT = 8
      const inside = new Uint8Array(W * H)
      const start = (Math.floor(H / 2) * W + Math.floor(W / 2)) | 0
      if (alpha[start * 4 + 3] > TRANSPARENT) {
        throw new Error('центр рамки непрозрачен — область экрана не найдена')
      }

      const stack = [start]
      inside[start] = 1
      let minX = W
      let minY = H
      let maxX = 0
      let maxY = 0

      while (stack.length) {
        const p = stack.pop()
        const x = p % W
        const y = (p - x) / W
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y

        const push = (nx, ny) => {
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) return
          const n = ny * W + nx
          if (inside[n] || alpha[n * 4 + 3] > TRANSPARENT) return
          inside[n] = 1
          stack.push(n)
        }
        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)
      }

      const box = { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }

      /*
       * Маска экрана — инвертированная альфа рамки внутри залитой области.
       * Инвертированная, а не бинарная: так сохраняется сглаживание скруглённых
       * углов, и кадр не торчит из них ступенькой.
       */
      const mask = document.createElement('canvas')
      mask.width = W
      mask.height = H
      const mctx = mask.getContext('2d')
      const maskData = mctx.createImageData(W, H)
      for (let i = 0; i < inside.length; i++) {
        if (!inside[i]) continue
        const o = i * 4
        maskData.data[o] = 255
        maskData.data[o + 1] = 255
        maskData.data[o + 2] = 255
        maskData.data[o + 3] = 255 - alpha[o + 3]
      }
      mctx.putImageData(maskData, 0, 0)

      const out = document.createElement('canvas')
      out.width = W
      out.height = H
      const ctx = out.getContext('2d')
      ctx.drawImage(shot, box.x, box.y, box.w, box.h)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(mask, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      ctx.drawImage(frame, 0, 0)

      return {
        dataUrl: out.toDataURL('image/png'),
        box,
        frame: { width: W, height: H },
      }
    },
    frameDataUrl,
    shotDataUrl,
  )

async function main() {
  const args = parseArgs(process.argv)

  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (!chrome) {
    throw new Error(
      'Chrome не найден. Укажи путь через CHROME_PATH=/path/to/chrome node scripts/shoot-app.mjs',
    )
  }

  const shots =
    args.name || args.query
      ? [{ name: args.name ?? 'custom', query: args.query ?? '' }]
      : DEFAULT_SHOTS

  mkdirSync(OUT_DIR, { recursive: true })

  const frameDataUrl = args.raw
    ? null
    : `data:image/png;base64,${(await import('node:fs')).readFileSync(FRAME).toString('base64')}`

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    // SwiftShader — программный WebGL: в headless нет GPU, без него канвас
    // ядра остался бы пустым
    args: ['--enable-unsafe-swiftshader', '--hide-scrollbars'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ ...SCREEN, deviceScaleFactor: SCALE })

    for (const shot of shots) {
      const url = `${args.base}/app${shot.query ? `?${shot.query}` : ''}`
      const res = await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 })
      if (!res || !res.ok()) throw new Error(`${url} → ${res ? res.status() : 'нет ответа'}`)

      await page.evaluate(() => document.fonts.ready)
      await new Promise((r) => setTimeout(r, SETTLE_MS))

      const raw = await page.screenshot({ encoding: 'base64', type: 'png' })
      const outPath = resolve(OUT_DIR, `${shot.name}.png`)

      if (args.raw) {
        writeFileSync(outPath, Buffer.from(raw, 'base64'))
        console.log(`✓ ${shot.name}.png — ${SCREEN.width * SCALE}×${SCREEN.height * SCALE}, без рамки`)
        continue
      }

      const { dataUrl, box, frame } = await composite(
        page,
        frameDataUrl,
        `data:image/png;base64,${raw}`,
      )
      writeFileSync(outPath, Buffer.from(dataUrl.split(',')[1], 'base64'))

      const shotAspect = SCREEN.width / SCREEN.height
      const boxAspect = box.w / box.h
      const skew = Math.abs(1 - shotAspect / boxAspect) * 100
      console.log(
        `✓ ${shot.name}.png — ${frame.width}×${frame.height}, ` +
          `экран ${box.w}×${box.h} @ ${box.x},${box.y}` +
          (skew > 1 ? ` (растяжение ${skew.toFixed(1)}%)` : ''),
      )
    }
  } finally {
    await browser.close()
  }

  console.log(`\nГотово: ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(`Ошибка: ${err.message}`)
  process.exitCode = 1
})
