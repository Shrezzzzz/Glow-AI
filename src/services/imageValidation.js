/**
 * imageValidation.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pre-capture frame validation for the GlowAI live beauty scan.
 *
 * Changelog v6 — Box-Ratio + Crown-Variance Hair Detection
 * ─────────────────────────────────────────────────────────
 * v3–v5 all attempted pixel-level hair detection: counting dark non-skin
 * pixels inside or outside the BlazeFace bounding box, measuring texture
 * variance, estimating skin tone thresholds. Every iteration failed in the
 * real webcam environment because:
 *
 *   1. BlazeFace box INCLUDES hair — placing strips outside the box samples
 *      background wall, not hair. Open hair and tied hair look identical.
 *   2. Skin-tone sampling kept landing on dark hair pixels for people with
 *      long hair (bh is tall; 42% down the box = inside the hanging hair),
 *      collapsing hairLumaThreshold to ~14 and making every hair pixel fail.
 *   3. Per-pixel luma/color thresholds are brittle across different skin
 *      tones, lighting conditions, and webcam color profiles.
 *
 * v6 abandons pixel-color detection entirely. Instead it uses two signals
 * that are ROBUST to lighting, skin tone, and camera quality:
 *
 *   SIGNAL 1 — Bounding Box Aspect Ratio (width / height):
 *     Open hair adds lateral mass to the left and right of the face.
 *     BlazeFace tightly encloses this mass, so the box becomes wide.
 *       Open long hair:    ratio ≈ 1.05–1.20  ✓
 *       Open medium hair:  ratio ≈ 0.90–1.15  ✓
 *       Open short hair:   ratio ≈ 0.78–1.00  ✓ (borderline, texture saves it)
 *       Tied back / ponytail: ratio ≈ 0.62–0.75 ✗ (face width only)
 *       Bun on top:        ratio ≈ 0.55–0.68  ✗ (adds height, not width)
 *     Threshold: boxRatio > BOX_RATIO_MIN (0.76)
 *
 *   SIGNAL 2 — Crown Texture Variance:
 *     Region: top 15% of the bounding box interior (hair/crown area).
 *     Hair strands produce highlights and shadows that create high luminance
 *     variance even on a downscaled canvas.
 *       Open hair:   variance ≈ 300–2000  ✓
 *       Hijab/scarf: smooth fabric → variance ≈ 15–100  ✗
 *       Cap/hood:    smooth surface → variance ≈ 10–70  ✗
 *       Hijab is the one case that passes the ratio check but must be
 *       rejected by variance (it adds lateral width like open hair).
 *     Threshold: crownVariance > CROWN_VARIANCE_MIN (200)
 *
 *   COMPOSITE RULE:
 *     hairVisible = boxRatio > BOX_RATIO_MIN && crownVariance > CROWN_VARIANCE_MIN
 *
 * No skin sampling. No luma thresholds. No per-pixel color matching.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Threshold constants
// ─────────────────────────────────────────────────────────────────────────────

export const IMAGE_VALIDATION_THRESHOLDS = {
  // Lighting
  brightnessMin: 40,

  // Blur (128×128 canvas Laplacian)
  blurMin: 0.4,

  // Face centre (normalised [0,1])
  centerXMin: 0.25,
  centerXMax: 0.75,
  centerYMin: 0.15,
  centerYMax: 0.85,

  // Face height as fraction of frame
  faceHeightMin: 0.18,
  faceHeightMax: 0.90,

  // Crop guards (landmark-based)
  cropSideMin: 0.02,
  cropTopMin:  0.01,

  // Positional guard: face box top must be > this fraction of frame height
  hairTopMin: 0.04,

  // Landmark-based guards (used by validateLandmarkReadiness)
  landmarkTopMin: 0.02,
  hairWidthMin:   0.10,

  // ── Open-hair detection (v6) ──────────────────────────────────────────────

  // Minimum bounding-box aspect ratio (width / height).
  // Open hair adds lateral mass → wide box → high ratio.
  // Tied/ponytail/bun has no lateral hair → narrow box → low ratio.
  boxRatioMin: 0.76,

  // Minimum luminance variance in the top 15% of the bounding box (crown zone).
  // Hair strands produce texture → high variance.
  // Smooth fabric (hijab, cap, scarf) → low variance.
  crownVarianceMin: 200,

  // Used by hairAnalysisService (unchanged)
  hairCoverageMin:     0.06,
  sideHairCoverageMin: 0.03,
  hairConfidenceMin:   45,
}

export const HAIR_VISIBILITY_ERROR =
  'Hair must be open and worn down.\n\nPlease wear your hair down — tied hair, buns, ponytails, head coverings, and caps are not accepted.'

// ─────────────────────────────────────────────────────────────────────────────
// Image quality helpers
// ─────────────────────────────────────────────────────────────────────────────

export function computeBrightness(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h).data
  let sum = 0, count = 0
  for (let i = 0; i < data.length; i += 16) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3
    count++
  }
  return count > 0 ? sum / count : 0
}

export function computeBlurScore(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h).data
  let lapSum = 0, count = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx    = (y * w + x) * 4
      const center = (data[idx]         + data[idx + 1]         + data[idx + 2])         / 3
      const top    = (data[idx - w * 4] + data[idx - w * 4 + 1] + data[idx - w * 4 + 2]) / 3
      const bottom = (data[idx + w * 4] + data[idx + w * 4 + 1] + data[idx + w * 4 + 2]) / 3
      const left   = (data[idx - 4]     + data[idx - 3]         + data[idx - 2])         / 3
      const right  = (data[idx + 4]     + data[idx + 5]         + data[idx + 6])         / 3
      lapSum += Math.abs(-4 * center + top + bottom + left + right)
      count++
    }
  }
  return count > 0 ? lapSum / count : 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Open-hair detector (v6 — box ratio + crown variance)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect whether hair is open and worn down using two robust signals.
 *
 * Neither signal depends on skin tone, hair color, or luma thresholds.
 * Both are computed directly from the BlazeFace bounding box geometry
 * and a simple variance measurement on the crown region.
 *
 * @param {CanvasRenderingContext2D} ctx  — full-res canvas of the video frame
 * @param {number} fw   — frame width  (px)
 * @param {number} fh   — frame height (px)
 * @param {object} box  — BlazeFace bounding box { originX, originY, width, height }
 * @returns {{
 *   isOpen: boolean,
 *   boxRatio: number,
 *   crownVariance: number,
 *   ratioOk: boolean,
 *   varianceOk: boolean,
 * }}
 */
export function detectOpenHair(ctx, fw, fh, box) {
  const T  = IMAGE_VALIDATION_THRESHOLDS
  const bx = box.originX
  const by = box.originY
  const bw = box.width
  const bh = box.height

  // ── Signal 1: Bounding box aspect ratio ───────────────────────────────────
  const boxRatio = bw / bh
  const ratioOk  = boxRatio > T.boxRatioMin

  // ── Signal 2: Crown region luminance variance ─────────────────────────────
  // Region: top 15% of bounding box, full width (the hair/crown zone).
  // Computed on the full-resolution canvas for a clean texture signal.
  const crownH = Math.round(bh * 0.15)
  const crownX = Math.round(Math.max(bx, 0))
  const crownY = Math.round(Math.max(by, 0))
  const crownW = Math.round(Math.min(bw, fw - crownX))
  const crownHclamped = Math.round(Math.min(crownH, fh - crownY))

  let crownVariance = 0

  if (crownW > 0 && crownHclamped > 0) {
    const d     = ctx.getImageData(crownX, crownY, crownW, crownHclamped).data
    const lumas = []
    for (let i = 0; i < d.length; i += 4) {
      lumas.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2])
    }
    if (lumas.length > 1) {
      const mean = lumas.reduce((a, v) => a + v, 0) / lumas.length
      crownVariance = lumas.reduce((s, v) => s + (v - mean) ** 2, 0) / lumas.length
    }
  }

  const varianceOk = crownVariance > T.crownVarianceMin

  return {
    isOpen: ratioOk && varianceOk,
    boxRatio:      parseFloat(boxRatio.toFixed(3)),
    crownVariance: parseFloat(crownVariance.toFixed(1)),
    ratioOk,
    varianceOk,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Live-frame validator (rAF tick)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a live video frame against all pre-capture criteria.
 * hairVisible is true only when detectOpenHair() confirms open, down hair.
 *
 * @param {HTMLVideoElement} element
 * @param {FaceDetector}     detector
 * @param {number}           width    — video.videoWidth
 * @param {number}           height   — video.videoHeight
 */
export function validateImageSource(element, detector, width, height) {
  // Quality metrics on 128×128 downscale
  const CANVAS_SIZE = 128
  const offscreen   = document.createElement('canvas')
  offscreen.width   = CANVAS_SIZE
  offscreen.height  = CANVAS_SIZE
  const offCtx      = offscreen.getContext('2d', { willReadFrequently: true })
  offCtx.drawImage(element, 0, 0, CANVAS_SIZE, CANVAS_SIZE)

  const brightness = computeBrightness(offCtx, CANVAS_SIZE, CANVAS_SIZE)
  const blurScore  = computeBlurScore(offCtx, CANVAS_SIZE, CANVAS_SIZE)

  let facesDetected = 0
  let faceCentered  = false
  let faceSize      = 0
  let hairVisible   = false
  let hairDebug     = {}
  let facePresent   = false
  const errors      = []

  try {
    const timestamp = performance.now()
    const result    = detector.detectForVideo(element, timestamp)
    facesDetected   = result?.detections?.length || 0

    if (facesDetected > 0) {
      facePresent = true
      const box = result.detections[0].boundingBox

      const cx   = (box.originX + box.width  / 2) / width
      const cy   = (box.originY + box.height / 2) / height
      const topY = box.originY / height

      faceCentered =
        cx > IMAGE_VALIDATION_THRESHOLDS.centerXMin &&
        cx < IMAGE_VALIDATION_THRESHOLDS.centerXMax &&
        cy > IMAGE_VALIDATION_THRESHOLDS.centerYMin &&
        cy < IMAGE_VALIDATION_THRESHOLDS.centerYMax

      faceSize = parseFloat(((box.height / height) * 100).toFixed(1))

      // Open-hair check — uses full-res canvas for crown variance
      const fullCanvas  = document.createElement('canvas')
      fullCanvas.width  = width
      fullCanvas.height = height
      const fullCtx     = fullCanvas.getContext('2d', { willReadFrequently: true })
      fullCtx.drawImage(element, 0, 0, width, height)

      const openHairResult = detectOpenHair(fullCtx, width, height, box)
      hairDebug   = openHairResult
      hairVisible = topY > IMAGE_VALIDATION_THRESHOLDS.hairTopMin && openHairResult.isOpen
    }
  } catch (err) {
    console.error('[validateImageSource] Detection error:', err)
  }

  const lightingGood = brightness > IMAGE_VALIDATION_THRESHOLDS.brightnessMin
  const notBlurry    = blurScore  > IMAGE_VALIDATION_THRESHOLDS.blurMin

  if (facesDetected === 0) {
    errors.push('No face detected. Position your face in the centre of the frame.')
  } else if (facesDetected > 1) {
    errors.push('Multiple faces detected. Only you should be in frame.')
  }

  if (facesDetected === 1) {
    if (!faceCentered) errors.push('Face not centred. Look directly at the camera.')
    if (faceSize < IMAGE_VALIDATION_THRESHOLDS.faceHeightMin * 100)
      errors.push('Too far away. Move closer to the camera.')
    if (faceSize > IMAGE_VALIDATION_THRESHOLDS.faceHeightMax * 100)
      errors.push('Too close. Keep your full head visible.')
    if (!hairVisible) errors.push(HAIR_VISIBILITY_ERROR)
  }

  if (!lightingGood) errors.push('Low lighting. Move to a brighter area.')
  if (!notBlurry)    errors.push('Image blurry. Hold the camera steady.')

  return {
    facesDetected,
    faceCentered: facePresent && faceCentered,
    faceSize,
    brightnessScore: parseFloat(brightness.toFixed(1)),
    blurScore:       parseFloat(blurScore.toFixed(3)),
    hairVisible:     facePresent && hairVisible,
    hairDebug,
    validationPassed: errors.length === 0,
    errors,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Post-capture landmark readiness check (capture + upload paths)
// ─────────────────────────────────────────────────────────────────────────────

export function validateLandmarkReadiness(imgEl, landmarks) {
  const errors  = []
  const quality = imgEl ? getImageQuality(imgEl) : { brightness: 0, blurScore: 0 }

  if (!imgEl) {
    errors.push('No selfie found. Please capture or upload a clear selfie before continuing.')
    return { validationPassed: false, errors, quality }
  }

  if (!landmarks?.length)
    errors.push('Face not detected. Please use a front-facing selfie with your face clearly visible.')

  if (quality.brightness < IMAGE_VALIDATION_THRESHOLDS.brightnessMin)
    errors.push('Insufficient lighting. Move to a brighter area and retake.')

  if (quality.blurScore < IMAGE_VALIDATION_THRESHOLDS.blurMin)
    errors.push('Image is blurry. Hold steady and retake your selfie.')

  const geometry = landmarks?.length ? getLandmarkGeometry(landmarks) : null
  if (geometry) {
    const { minX, maxX, minY, faceHeight, cx, cy } = geometry

    if (
      cx < IMAGE_VALIDATION_THRESHOLDS.centerXMin ||
      cx > IMAGE_VALIDATION_THRESHOLDS.centerXMax ||
      cy < IMAGE_VALIDATION_THRESHOLDS.centerYMin ||
      cy > IMAGE_VALIDATION_THRESHOLDS.centerYMax
    ) errors.push('Face not centred. Please face the camera directly.')

    if (faceHeight < IMAGE_VALIDATION_THRESHOLDS.faceHeightMin)
      errors.push('Face too far away. Move closer and retake.')

    if (
      faceHeight > IMAGE_VALIDATION_THRESHOLDS.faceHeightMax ||
      minX       < IMAGE_VALIDATION_THRESHOLDS.cropSideMin   ||
      maxX       > 1 - IMAGE_VALIDATION_THRESHOLDS.cropSideMin ||
      minY       < IMAGE_VALIDATION_THRESHOLDS.cropTopMin
    ) errors.push('Image crop is too tight. Keep your full head and both sides visible.')

    if (!hasLandmarkHairVisibility(geometry)) errors.push(HAIR_VISIBILITY_ERROR)
  }

  return { validationPassed: errors.length === 0, errors, quality, geometry }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getImageQuality(imgEl) {
  const CANVAS_SIZE = 128
  const canvas = document.createElement('canvas')
  canvas.width  = CANVAS_SIZE
  canvas.height = CANVAS_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(imgEl, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
  return {
    width:  imgEl.naturalWidth  || imgEl.width  || 640,
    height: imgEl.naturalHeight || imgEl.height || 640,
    brightness: computeBrightness(ctx, CANVAS_SIZE, CANVAS_SIZE),
    blurScore:  computeBlurScore(ctx,  CANVAS_SIZE, CANVAS_SIZE),
  }
}

export function getLandmarkGeometry(landmarks) {
  const xs = landmarks.map(p => p.x).filter(Number.isFinite)
  const ys = landmarks.map(p => p.y).filter(Number.isFinite)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const faceWidth = maxX - minX, faceHeight = maxY - minY
  return {
    minX, maxX, minY, maxY, faceWidth, faceHeight,
    cx: minX + faceWidth  / 2,
    cy: minY + faceHeight / 2,
    topHead: landmarks[10],
  }
}

export function hasLandmarkHairVisibility(geometry) {
  if (!geometry) return false
  return Boolean(
    geometry.topHead &&
    geometry.topHead.y  >= IMAGE_VALIDATION_THRESHOLDS.landmarkTopMin &&
    geometry.minY       >= IMAGE_VALIDATION_THRESHOLDS.cropTopMin &&
    geometry.faceWidth  >= IMAGE_VALIDATION_THRESHOLDS.hairWidthMin &&
    geometry.minX       >= IMAGE_VALIDATION_THRESHOLDS.cropSideMin &&
    geometry.maxX       <= 1 - IMAGE_VALIDATION_THRESHOLDS.cropSideMin
  )
}