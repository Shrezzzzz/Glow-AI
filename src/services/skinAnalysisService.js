/**
 * skinAnalysisService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Client-side skin tone and undertone analysis using canvas pixel sampling
 * and CIELAB colour-space conversion.
 *
 * No external models required — all math runs in the browser.
 *
 * Key export:
 *   analyzeSkin(imgEl, landmarks) → { tone, undertone, confidence, reason }
 *
 * Skin tone depth (from CIELAB L* channel):
 *   Fair   : L ≥ 75
 *   Light  : L 62–74
 *   Medium : L 48–61
 *   Tan    : L 35–47
 *   Deep   : L < 35
 *
 * Undertone (from CIELAB a* and b* channels):
 *   Warm    : high yellow (b+) and slight red (a+)  →  warmScore  > 8
 *   Cool    : blue-dominant, low yellow              →  warmScore < -4
 *   Neutral : balanced channels                      →  between -4 and 8
 */

// ─────────────────────────────────────────────────────────────────────────────
// Colour-space helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * sRGB [0,255] → CIELAB (D65 illuminant).
 * Returns { L, a, b } where:
 *   L ∈ [0,100]   (lightness)
 *   a ∈ [-128,127] (green ↔ red)
 *   b ∈ [-128,127] (blue ↔ yellow)
 */
function rgbToLab(r, g, b) {
  // 1. Linearise sRGB
  const linearise = (c) => {
    const v = c / 255
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  }
  const R = linearise(r)
  const G = linearise(g)
  const B = linearise(b)

  // 2. Linear sRGB → XYZ (D65)
  let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  let Y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.00000
  let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883

  // 3. XYZ → Lab
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  X = f(X); Y = f(Y); Z = f(Z)

  return {
    L: 116 * Y - 16,
    a: 500 * (X - Y),
    b: 200 * (Y - Z),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pixel sampling
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sample average RGB from a square region of a canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx   - Canvas context containing the image.
 * @param {number} nx   - Normalised [0,1] x-centre of region.
 * @param {number} ny   - Normalised [0,1] y-centre of region.
 * @param {number} imgW - Image width in pixels.
 * @param {number} imgH - Image height in pixels.
 * @param {number} size - Half-width of the sampling square (px).
 * @returns {{ r: number, g: number, b: number } | null}
 */
function sampleRegion(ctx, nx, ny, imgW, imgH, size = 14) {
  const px = Math.round(nx * imgW)
  const py = Math.round(ny * imgH)
  const x0 = Math.max(0, px - size)
  const y0 = Math.max(0, py - size)
  const sw = Math.min(imgW, px + size) - x0
  const sh = Math.min(imgH, py + size) - y0
  if (sw <= 0 || sh <= 0) return null

  const { data } = ctx.getImageData(x0, y0, sw, sh)
  let rSum = 0, gSum = 0, bSum = 0, count = 0
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2]
    count++
  }
  return count > 0
    ? { r: rSum / count, g: gSum / count, b: bSum / count }
    : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyse skin tone and undertone from a captured selfie image and
 * MediaPipe facial landmarks.
 *
 * Samples three skin regions:
 *   1. Forehead centre  (landmark 10)
 *   2. Left cheek       (landmark 116)
 *   3. Right cheek      (landmark 345)
 *
 * @param {HTMLImageElement} imgEl      - Fully loaded image element.
 * @param {Array<{x,y,z}>}  landmarks  - 478 normalised MediaPipe landmarks.
 * @returns {{ tone: string|null, undertone: string|null, confidence: number, reason: string }}
 */
export function analyzeSkin(imgEl, landmarks) {
  if (!imgEl || !landmarks || landmarks.length < 346) {
    return {
      technicalClassification: null,
      confidence: 0,
      plainEnglishMeaning: '',
      whyItWasDetected: 'Insufficient data for skin analysis.',
    }
  }

  const imgW = imgEl.naturalWidth  || imgEl.width  || 640
  const imgH = imgEl.naturalHeight || imgEl.height || 640

  // Draw image to an offscreen canvas once
  const canvas = document.createElement('canvas')
  canvas.width  = imgW
  canvas.height = imgH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(imgEl, 0, 0, imgW, imgH)

  // Sample points: forehead (lm 10), left cheek (lm 116), right cheek (lm 345)
  const samplePoints = [
    { lmIdx: 10,  label: 'forehead'    },
    { lmIdx: 116, label: 'left cheek'  },
    { lmIdx: 345, label: 'right cheek' },
  ]

  const samples = samplePoints
    .map(({ lmIdx }) => {
      const lm = landmarks[lmIdx]
      return sampleRegion(ctx, lm.x, lm.y, imgW, imgH, 14)
    })
    .filter(Boolean)

  if (samples.length === 0) {
    return {
      technicalClassification: null,
      confidence: 0,
      plainEnglishMeaning: '',
      whyItWasDetected: 'Could not sample skin pixels from the image. Please retake your selfie in better lighting.',
    }
  }

  // Average the samples
  const avgR = samples.reduce((s, p) => s + p.r, 0) / samples.length
  const avgG = samples.reduce((s, p) => s + p.g, 0) / samples.length
  const avgB = samples.reduce((s, p) => s + p.b, 0) / samples.length

  const { L, a, b } = rgbToLab(avgR, avgG, avgB)

  // ── Skin Tone Depth (from L* lightness) ────────────────────────────────────
  let tone
  if      (L >= 75) tone = 'Fair'
  else if (L >= 62) tone = 'Light'
  else if (L >= 48) tone = 'Medium'
  else if (L >= 35) tone = 'Tan'
  else              tone = 'Deep'

  // ── Undertone (from a* and b* channels) ─────────────────────────────────────
  // warmScore: positive = warm (yellow/golden), negative = cool (pink/blue)
  // Weighted: b* (yellow-blue axis) carries more undertone signal than a* (red-green)
  const warmScore = b * 0.60 + a * 0.40

  let undertone
  if      (warmScore >  8) undertone = 'Warm'
  else if (warmScore < -4) undertone = 'Cool'
  else                     undertone = 'Neutral'

  // ── Confidence ────────────────────────────────────────────────────────────
  // Higher signal strength → higher confidence. Range: 55–91.
  const signal     = Math.abs(warmScore)
  const confidence = Math.min(Math.max(Math.round(55 + signal * 2.2), 55), 91)

  // ── Human-readable explanation ────────────────────────────────────────────
  const undertoneDesc = {
    Warm:    `elevated yellow (b*=${b.toFixed(1)}) and slight red (a*=${a.toFixed(1)}) values`,
    Cool:    `suppressed yellow and elevated blue-green tones (b*=${b.toFixed(1)}, a*=${a.toFixed(1)})`,
    Neutral: `near-balanced yellow and red values (b*=${b.toFixed(1)}, a*=${a.toFixed(1)})`,
  }[undertone]

  const plainEnglishMeaning = `You have a ${tone.toLowerCase()} skin tone with ${undertone.toLowerCase()} undertones.`

  const whyItWasDetected =
    `Skin sampled from ${samples.length} regions (forehead, cheeks) averaged ` +
    `RGB(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)}), ` +
    `with CIELAB lightness L*=${L.toFixed(1)} — placing your skin in the ` +
    `${tone.toLowerCase()} tone range. The ${undertone.toLowerCase()} undertone is ` +
    `indicated by ${undertoneDesc}.`

  return {
    technicalClassification: `${tone} ${undertone}`,
    tone,
    undertone,
    confidence,
    plainEnglishMeaning,
    whyItWasDetected,
  }
}
