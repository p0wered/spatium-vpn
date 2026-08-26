/**
 * Экспортирует детерминированный кадр Strands в прозрачный PNG для Figma.
 *   npm run export:strands
 *   npm run export:strands -- --width 4096 --height 2304 --time 4.5
 *   npm run export:strands -- --base http://localhost:5173
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = resolve(ROOT, 'exports')

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].filter(Boolean)

function parseNumber(flag, value) {
  const number = Number(value)
  if (!Number.isFinite(number)) throw new Error(`${flag}: ожидалось число, получено «${value}»`)
  return number
}

function parseArgs(argv) {
  const args = {
    width: 3840,
    height: 2160,
    time: 3.2,
    name: 'strands-4k.png',
    base: null,
  }

  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i]
    const value = argv[++i]
    if (value === undefined) throw new Error(`Не указано значение для ${flag}`)

    if (flag === '--width') args.width = parseNumber(flag, value)
    else if (flag === '--height') args.height = parseNumber(flag, value)
    else if (flag === '--time') args.time = parseNumber(flag, value)
    else if (flag === '--name') args.name = value
    else if (flag === '--base') args.base = value
    else throw new Error(`Неизвестный аргумент: ${flag}`)
  }

  args.width = Math.round(args.width)
  args.height = Math.round(args.height)
  if (args.width < 1 || args.height < 1) throw new Error('Размеры PNG должны быть больше нуля')
  if (args.width > 4096 || args.height > 4096) {
    throw new Error('Для импорта в Figma ни одна сторона не должна превышать 4096 px')
  }
  if (!args.name.toLowerCase().endsWith('.png')) args.name += '.png'
  if (args.name.includes('/') || args.name.includes('\\')) {
    throw new Error('--name должен быть только именем файла, без пути')
  }

  return args
}

async function main() {
  const args = parseArgs(process.argv)
  const chrome = CHROME_CANDIDATES.find((path) => existsSync(path))
  if (!chrome) {
    throw new Error('Chrome не найден. Укажи путь через CHROME_PATH=/path/to/chrome')
  }

  mkdirSync(OUT_DIR, { recursive: true })

  let viteServer
  let base = args.base
  if (!base) {
    const { createServer } = await import('vite')
    viteServer = await createServer({
      root: ROOT,
      logLevel: 'error',
      server: { host: '127.0.0.1', port: 0 },
    })
    await viteServer.listen()

    const address = viteServer.httpServer?.address()
    if (!address || typeof address === 'string') {
      await viteServer.close()
      throw new Error('Не удалось определить порт временного Vite-сервера')
    }
    base = `http://127.0.0.1:${address.port}`
  }

  let browser

  try {
    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: true,
      args: ['--enable-unsafe-swiftshader', '--hide-scrollbars'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: args.width, height: args.height, deviceScaleFactor: 1 })

    const url = `${base}/export/strands?time=${encodeURIComponent(args.time)}`
    const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 20000 })
    if (!response || !response.ok()) {
      throw new Error(`${url} → ${response ? response.status() : 'нет ответа'}`)
    }

    await page.waitForSelector('canvas[data-strands-ready="true"]', { timeout: 20000 })
    const png = await page.$eval('canvas[data-strands-ready="true"]', (canvas) => {
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error('canvas не найден')
      return {
        width: canvas.width,
        height: canvas.height,
        base64: canvas.toDataURL('image/png').split(',')[1],
      }
    })

    if (png.width !== args.width || png.height !== args.height) {
      throw new Error(
        `ожидалось ${args.width}×${args.height}, canvas вернул ${png.width}×${png.height}`,
      )
    }

    const outPath = resolve(OUT_DIR, args.name)
    writeFileSync(outPath, Buffer.from(png.base64, 'base64'))
    console.log(`✓ ${args.name} — ${png.width}×${png.height}, прозрачный PNG, t=${args.time}s`)
    console.log(`Готово: ${outPath}`)
  } finally {
    await browser?.close()
    await viteServer?.close()
  }
}

main().catch((error) => {
  console.error(`Ошибка: ${error.message}`)
  process.exitCode = 1
})
