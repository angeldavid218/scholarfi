/**
 * Makes near-white pixels transparent (removes flat white PNG backgrounds).
 * Run from repo root: node scripts/transparentize-logo-pngs.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

/** How close to #fff each channel must be to treat as background (0–255). */
const FUZZ = 26

async function transparentize(relativePath) {
  const inputPath = path.join(publicDir, relativePath)
  const tmpPath = `${inputPath}.tmp.png`

  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  if (info.channels !== 4) {
    throw new Error(`Expected RGBA, got ${info.channels} channels: ${relativePath}`)
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r >= 255 - FUZZ && g >= 255 - FUZZ && b >= 255 - FUZZ) {
      data[i + 3] = 0
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmpPath)

  fs.renameSync(tmpPath, inputPath)
  console.log(`OK ${relativePath}`)
}

await transparentize('scholarfi-logo-1.png')
await transparentize('scholardi-logo.png')
