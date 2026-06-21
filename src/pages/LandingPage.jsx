import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Play, ArrowRight, Star, MapPin, CheckCircle2,
  Sparkles, ChevronRight, Shield, Zap, Heart,
  Camera, Loader2, Check, AlertCircle, UploadCloud, Info, Bug,
  RefreshCw, MessageSquare
} from 'lucide-react'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import {
  initFaceLandmarker,
  resetFaceLandmarker,
  detectLandmarks,
  classifyFaceShape,
} from '../services/faceAnalysisService'
import { analyzeSkin } from '../services/skinAnalysisService'
import {
  validateImageSource,
  validateLandmarkReadiness,
  IMAGE_VALIDATION_THRESHOLDS,
  HAIR_VISIBILITY_ERROR,
} from '../services/imageValidation'
import beautyScanAvatar from '../assets/beauty-scan-avatar.png'
import MainLayout     from '../layouts/MainLayout'
import DemoVideoModal from '../components/DemoVideoModal'
import SalonCard      from '../components/SalonCard'
import ExperienceCard from '../components/ExperienceCard'
import TestimonialCard from '../components/TestimonialCard'
import SectionHeader  from '../components/SectionHeader'
import { salons }      from '../data/salons'
import { experiences } from '../data/experiences'
import { useBeautyProfile } from '../context/BeautyProfileContext'

// Debug disabled
const DEBUG_ENABLED = false
/* ---------- Animated Counter ---------- */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const step = target / 60
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, 24)
    return () => clearInterval(timer)
  }, [inView, target])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}


/* ---------- Validation Check Config ---------- */
// 6 face checks — hair NOT required. Smile handled separately.
const VALIDATION_CHECKS = [
  { key: 'facePresent',  passLabel: 'Face Detected',    failLabel: 'Position your face in the frame' },
  { key: 'oneFace',      passLabel: 'Single Face',       failLabel: 'Multiple faces detected — only you in frame' },
  { key: 'faceSize',     passLabel: 'Face Close Enough', failLabel: 'Move closer to the camera' },
  { key: 'faceCentered', passLabel: 'Face Centred',      failLabel: 'Look directly at the camera' },
  { key: 'lightingGood', passLabel: 'Good Lighting',     failLabel: 'Move to a brighter area' },
  { key: 'notBlurry',    passLabel: 'Image Sharp',       failLabel: 'Hold steady — image is blurry' },
]

// Smile threshold: score must reach this to unlock capture
const SMILE_THRESHOLD = 70

/* ---------- analyzeCapture -----------------------------------------------
 * Face + skin analysis. Hair analysis is OPTIONAL — never blocks results.
 * ---------------------------------------------------------------------- */
const MIN_CONFIDENCE = 55  // relaxed from 60 for better real-world pass rate
const ANALYSIS_TIMEOUT_MS = 15_000

function withAnalysisTimeout(promise, label, timeoutMs = ANALYSIS_TIMEOUT_MS) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function fallbackCaptureAnalysis(reason) {
  return {
    faceShape: 'Oval',
    faceShapeConfidence: 52,
    faceShapeReason: `Fallback analysis used because ${reason}.`,
    faceShapeMetrics: {},
    skinTone: 'Medium',
    skinUndertone: 'Neutral',
    skinConfidence: 52,
    skinReason: `Fallback skin estimate used because ${reason}.`,
    landmarksDetected: false,
    fallbackUsed: true,
    fallbackReason: reason,
  }
}

async function analyzeCapture(imageDataUrl) {
  console.log('[GlowAI][ScanAnalysis] start')
  if (!imageDataUrl) {
    console.warn('[GlowAI][ScanAnalysis] no image provided')
    return fallbackCaptureAnalysis('no image was captured')
  }
  console.log('[GlowAI][ScanAnalysis] load image: start')
  let imgEl
  try {
    imgEl = await withAnalysisTimeout(new Promise((resolve, reject) => {
      const el = new window.Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Captured image failed to load'))
      el.src = imageDataUrl
    }), 'Captured image load')
    console.log('[GlowAI][ScanAnalysis] load image: complete')
  } catch (err) {
    console.error('[GlowAI][ScanAnalysis] load image: failed', err)
    return fallbackCaptureAnalysis(err.message || 'the captured image could not be loaded')
  }

  let landmarks = null
  console.log('[GlowAI][ScanAnalysis] detect landmarks: start')
  try {
    landmarks = await withAnalysisTimeout(detectLandmarks(imgEl), 'Face landmark detection')
    console.log('[GlowAI][ScanAnalysis] detect landmarks: complete', { found: Boolean(landmarks) })
  } catch (err) {
    console.warn('[GlowAI][ScanAnalysis] detect landmarks: failed, using fallback', err)
    return fallbackCaptureAnalysis(err.message || 'landmark detection failed')
  }

  if (!landmarks) {
    console.warn('[GlowAI][ScanAnalysis] no landmarks found, using fallback')
    return fallbackCaptureAnalysis('no facial landmarks were detected')
  }

  console.log('[GlowAI][ScanAnalysis] classify face shape: start')
  const fsResult  = classifyFaceShape(landmarks)
  console.log('[GlowAI][ScanAnalysis] classify face shape: complete', fsResult)
  const faceShape = fsResult.confidence >= MIN_CONFIDENCE ? fsResult.technicalClassification : null

  let skinResult = { tone: null, undertone: null, confidence: 0, whyItWasDetected: 'Skin analysis unavailable.' }
  console.log('[GlowAI][ScanAnalysis] analyze skin: start')
  try {
    skinResult = await withAnalysisTimeout(Promise.resolve(analyzeSkin(imgEl, landmarks)), 'Skin tone analysis')
    console.log('[GlowAI][ScanAnalysis] analyze skin: complete', skinResult)
  } catch (err) {
    console.warn('[GlowAI][ScanAnalysis] analyze skin: failed, using fallback skin estimate', err)
    skinResult = {
      tone: 'Medium',
      undertone: 'Neutral',
      confidence: 52,
      whyItWasDetected: `Fallback skin estimate used because ${err.message || 'skin analysis failed'}.`,
    }
  }

  console.log('[GlowAI][ScanAnalysis] complete')
  return {
    faceShape, faceShapeConfidence: fsResult.confidence, faceShapeReason: fsResult.whyItWasDetected, faceShapeMetrics: fsResult.metrics,
    skinTone: skinResult.confidence >= MIN_CONFIDENCE ? skinResult.tone : null,
    skinUndertone: skinResult.confidence >= MIN_CONFIDENCE ? skinResult.undertone : null,
    skinConfidence: skinResult.confidence, skinReason: skinResult.whyItWasDetected, landmarksDetected: true,
  }
}

/* ---------- Smile detection from BlazeFace keypoints ----------------------
 * BlazeFace provides 6 keypoints per detection:
 *   0=right eye, 1=left eye, 2=nose tip, 3=mouth centre,
 *   4=right ear, 5=left ear
 *
 * We use the mouth keypoint width (distance between ear keypoints horizontally
 * as face width reference) plus a secondary geometry score.
 *
 * Since BlazeFace only gives mouth CENTRE (not corners), we use the
 * face bounding box width vs height ratio + mouth position to infer smile.
 *
 * For higher accuracy we also accept the MediaPipe 478-landmark geometry
 * when the full landmarker result is available.
 * -------------------------------------------------------------------- */
function smileScoreFromBlazeFace(detection) {
  if (!detection) return 0
  const kp = detection.keypoints
  if (!kp || kp.length < 6) return 0

  // Keypoints: [0]right_eye [1]left_eye [2]nose_tip [3]mouth [4]right_ear_tragion [5]left_ear_tragion
  const rightEye  = kp[0]
  const leftEye   = kp[1]
  const noseTip   = kp[2]
  const mouth     = kp[3]

  if (!rightEye || !leftEye || !noseTip || !mouth) return 0

  // Eye-to-eye width as face width reference (normalised [0,1])
  const eyeWidth = Math.abs(leftEye.x - rightEye.x)
  if (eyeWidth < 0.01) return 0

  // Mouth vertical position relative to nose — smile raises mouth corners
  // so mouth.y should be significantly below nose.y
  const noseMouthDist = mouth.y - noseTip.y   // positive = mouth below nose

  // Bounding box aspect: when smiling, cheeks widen the box
  const box = detection.boundingBox
  const boxRatio = box ? (box.width / box.height) : 0

  // Score components (each 0–33)
  const mouthLow   = Math.min(Math.max((noseMouthDist / eyeWidth) * 120, 0), 33)
  const boxWide    = Math.min(Math.max((boxRatio - 0.7) * 100, 0), 33)
  const eyeDist    = Math.min(Math.max((eyeWidth * 200), 0), 34)  // face close enough

  return Math.round(mouthLow + boxWide + eyeDist)
}

function smileScoreFromLandmarks(lm) {
  if (!lm || lm.length < 455) return 0
  const leftCorner  = lm[61],  rightCorner = lm[291]
  const upperLip    = lm[13],  lowerLip    = lm[14]
  const leftCheek   = lm[234], rightCheek  = lm[454]
  const leftMouth   = lm[57],  rightMouth  = lm[287]

  const faceWidth = Math.abs(rightCheek.x - leftCheek.x)
  if (faceWidth < 0.01) return 0

  // Mouth corner spread (wider = more smile)
  const cornerSpread  = Math.abs(rightCorner.x - leftCorner.x) / faceWidth
  // Mouth opening (open mouth = big smile)
  const mouthOpen     = Math.abs(lowerLip.y - upperLip.y) / faceWidth
  // Corner lift: smile pulls corners up (lower y value in normalised space)
  const cornerMidY    = (leftCorner.y + rightCorner.y) / 2
  const lipCentreY    = (upperLip.y + lowerLip.y) / 2
  const cornerLift    = Math.max(lipCentreY - cornerMidY, 0)
  // Outer mouth width
  const outerSpread   = Math.abs(rightMouth.x - leftMouth.x) / faceWidth

  const score = Math.round(
    cornerSpread  * 40 +   // 0–40: wide corners
    mouthOpen     * 50 +   // 0–50: open mouth
    cornerLift    * 140 +  // 0–50+: lifted corners
    outerSpread   * 20     // 0–20: outer lips
  )
  return Math.min(score, 100)
}

/* ---------- Interactive AI Beauty Analyzer -------------------------------- */
function InteractiveAIBeautyAnalyzer() {
  const navigate = useNavigate()
  const { saveAiScanSelfie, clearAiScanSelfie } = useBeautyProfile()

  // scanState: 'idle'|'model_loading'|'initializing'|'detecting'|'smile_check'|'capturing'|'analyzing'|'analysis_error'|'results'|'error'
  const [scanState, setScanState]         = useState('idle')
  const [errorMsg, setErrorMsg]           = useState('')
  const [modelError, setModelError]       = useState('')
  const [capturedImage, setCapturedImage]   = useState(null)
  const [analyzingStep, setAnalyzingStep]   = useState(0)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError]   = useState('')
  const [isAnalyzing, setIsAnalyzing]       = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [uploadErrors, setUploadErrors]     = useState([])

  // Per-check validation: null=pending true=pass false=fail
  const [validation, setValidation] = useState({
    facePresent: null, oneFace: null, faceSize: null,
    faceCentered: null, lightingGood: null, notBlurry: null,
  })

  // Smile state — driven by the single rAF validation loop
  const [smileScore, setSmileScore]     = useState(0)
  const [smileReady, setSmileReady]     = useState(false)   // true when score >= SMILE_THRESHOLD
  const [smilePhase, setSmilePhase]     = useState(false)   // true = face checks done, now checking smile
  const [smileError, setSmileError]     = useState('')      // timeout/failure message

  // Debug
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})

  const videoRef    = useRef(null)
  const streamRef   = useRef(null)
  const detectorRef = useRef(null)
  const requestRef  = useRef(null)
  const smileTimerRef = useRef(null)   // timeout to detect if smile never happens

  // ── FaceDetector (BlazeFace — single model for everything) ───────────────
  const initializeDetector = useCallback(async () => {
    if (detectorRef.current) return detectorRef.current
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
    )
    const detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
      },
      runningMode: 'VIDEO',
    })
    detectorRef.current = detector
    return detector
  }, [])

  const stopCamera = useCallback(() => {
    if (requestRef.current)  { cancelAnimationFrame(requestRef.current); requestRef.current = null }
    if (smileTimerRef.current) { clearTimeout(smileTimerRef.current); smileTimerRef.current = null }
    if (streamRef.current)   { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    if (videoRef.current)    { videoRef.current.srcObject = null }
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── Start scan ────────────────────────────────────────────────────────────
  const startScan = useCallback(async () => {
    setScanState('initializing')
    clearAiScanSelfie()
    setErrorMsg('')
    setModelError('')
    setCapturedImage(null)
    setAnalysisResult(null)
    setAnalysisError('')
    setIsAnalyzing(false)
    setAnalysisComplete(false)
    setUploadErrors([])
    setSmileScore(0)
    setSmileReady(false)
    setSmilePhase(false)
    setSmileError('')
    setValidation({ facePresent: null, oneFace: null, faceSize: null, faceCentered: null, lightingGood: null, notBlurry: null })

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      })
      streamRef.current = stream

      // Pre-warm IMAGE-mode landmarker in background for capture analysis
      initFaceLandmarker().catch(err => console.warn('[GlowAI] Landmarker preload:', err))

      setScanState('model_loading')
      let detector
      try {
        detector = await initializeDetector()
      } catch (modelErr) {
        console.error('[GlowAI] FaceDetector failed:', modelErr)
        stopCamera()
        setModelError('Could not load the face detection model. Please check your internet connection and try again.')
        setScanState('error')
        return
      }

      setScanState('detecting')
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(e => console.error('[GlowAI] Video play error:', e))
          startValidationLoop(detector)
        }
      }, 150)
    } catch (err) {
      console.error('[GlowAI] Camera error:', err)
      const isPerm = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
      setErrorMsg(isPerm
        ? 'Camera access denied. Please enable camera permissions in your browser settings, then try again.'
        : 'Could not access your camera. Please ensure it is connected and not in use by another app.')
      setScanState('error')
    }
  }, [clearAiScanSelfie, initializeDetector, stopCamera])

  // ── SINGLE unified rAF loop: validation → smile ───────────────────────────
  // Uses one BlazeFace detector for everything.
  // When face checks pass, automatically transitions to smile phase.
  // NO second model. NO dynamic import. No race conditions.
  const startValidationLoop = useCallback((detector) => {
    const BRIGHTNESS_MIN = 25
    const BLUR_MIN       = 0.15
    const T = IMAGE_VALIDATION_THRESHOLDS
    let localSmilePhase = false   // tracks phase inside the closure

    const tick = () => {
      const video = videoRef.current
      if (!video) return
      if (video.readyState < 2 || video.videoWidth === 0) {
        requestRef.current = requestAnimationFrame(tick)
        return
      }

      const vw = video.videoWidth  || 640
      const vh = video.videoHeight || 640

      // ── Image quality (128×128 canvas) ────────────────────────────────
      const SMALL = 128
      const offC  = document.createElement('canvas')
      offC.width = offC.height = SMALL
      const offCtx = offC.getContext('2d', { willReadFrequently: true })
      offCtx.drawImage(video, 0, 0, SMALL, SMALL)
      const px = offCtx.getImageData(0, 0, SMALL, SMALL).data

      let bSum = 0
      for (let i = 0; i < px.length; i += 16) bSum += (px[i] + px[i+1] + px[i+2]) / 3
      const brightness = bSum / (px.length / 16)

      let lapSum = 0, lapN = 0
      for (let y = 1; y < SMALL - 1; y++) {
        for (let x = 1; x < SMALL - 1; x++) {
          const i = (y * SMALL + x) * 4
          const ctr = (px[i] + px[i+1] + px[i+2]) / 3
          const top = (px[i-SMALL*4] + px[i-SMALL*4+1] + px[i-SMALL*4+2]) / 3
          const bot = (px[i+SMALL*4] + px[i+SMALL*4+1] + px[i+SMALL*4+2]) / 3
          const lft = (px[i-4] + px[i-3] + px[i-2]) / 3
          const rgt = (px[i+4] + px[i+5] + px[i+6]) / 3
          lapSum += Math.abs(-4*ctr + top + bot + lft + rgt); lapN++
        }
      }
      const blurScore = lapN > 0 ? lapSum / lapN : 0

      // ── BlazeFace detection ───────────────────────────────────────────
      let facesDetected = 0, faceCentered = false, faceSize = 0, faceSizeOk = false
      let detection = null
      try {
        const result  = detector.detectForVideo(video, performance.now())
        facesDetected = result?.detections?.length || 0
        if (facesDetected > 0) {
          detection = result.detections[0]
          const box = detection.boundingBox
          const cx  = (box.originX + box.width  / 2) / vw
          const cy  = (box.originY + box.height / 2) / vh
          faceSize  = parseFloat(((box.height / vh) * 100).toFixed(1))
          faceCentered = cx > T.centerXMin && cx < T.centerXMax && cy > T.centerYMin && cy < T.centerYMax
          faceSizeOk   = faceSize >= T.faceHeightMin * 100 && faceSize <= T.faceHeightMax * 100
        }
      } catch (_) { /* first frames can fail */ }

      const lightingGood = brightness > BRIGHTNESS_MIN
      const notBlurry    = blurScore  > BLUR_MIN
      const faceOk       = facesDetected === 1 && faceCentered && faceSizeOk && lightingGood && notBlurry

      const newValidation = {
        facePresent:  facesDetected >= 1,
        oneFace:      facesDetected === 1,
        faceSize:     faceSizeOk,
        faceCentered: facesDetected >= 1 && faceCentered,
        lightingGood,
        notBlurry,
      }
      setValidation(newValidation)

      // ── Smile phase ───────────────────────────────────────────────────
      if (faceOk && !localSmilePhase) {
        localSmilePhase = true
        setSmilePhase(true)
        setScanState('smile_check')
        // Set a 30-second timeout for smile detection
        smileTimerRef.current = setTimeout(() => {
          setSmileError('Unable to detect your smile. Make sure your face is well-lit and visible, then try again.')
        }, 30000)
      }

      if (localSmilePhase && detection) {
        // Score using BlazeFace keypoints (no second model needed)
        const score = smileScoreFromBlazeFace(detection)
        const clamped = Math.min(score, 100)
        setSmileScore(clamped)
        const ready = clamped >= SMILE_THRESHOLD
        setSmileReady(ready)
        if (ready && smileTimerRef.current) {
          clearTimeout(smileTimerRef.current)
          smileTimerRef.current = null
        }

        setDebugInfo({
          facesDetected, faceSize, brightness: Math.round(brightness),
          blurScore: parseFloat(blurScore.toFixed(3)), lightingGood, notBlurry,
          smilePhase: localSmilePhase, smileScore: clamped,
          kpCount: detection.keypoints?.length || 0,
        })
      } else {
        setDebugInfo({
          facesDetected, faceSize, brightness: Math.round(brightness),
          blurScore: parseFloat(blurScore.toFixed(3)), lightingGood, notBlurry, smilePhase: localSmilePhase,
        })
      }

      requestRef.current = requestAnimationFrame(tick)
    }
    requestRef.current = requestAnimationFrame(tick)
  }, [])

  // faceChecksPassed: all 6 base checks green
  const faceChecksPassed = VALIDATION_CHECKS.every(({ key }) => validation[key] === true)
  // allValid: face checks + smile threshold reached
  const allValid = faceChecksPassed && smileReady

  // ── Capture selfie ────────────────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    if (!allValid) return  // hard guard — no bypass
    const video = videoRef.current
    if (!video) return
    const c = document.createElement('canvas')
    c.width  = video.videoWidth  || 640
    c.height = video.videoHeight || 640
    const ctx = c.getContext('2d')
    ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0)
    setCapturedImage(c.toDataURL('image/jpeg', 0.90))
    stopCamera()
    setScanState('capturing')
    console.log('[GlowAI][ScanFlow] capture complete, moving to analysis')
    setTimeout(() => {
      console.log('[GlowAI][ScanFlow] scanState -> analyzing')
      setScanState('analyzing')
    }, 800)
  }, [allValid, stopCamera])

  // ── Analyzing ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scanState !== 'analyzing') return
    console.log('[GlowAI][ScanFlow] analyzing effect entered', { hasImage: Boolean(capturedImage) })
    setAnalyzingStep(0)
    setIsAnalyzing(true)
    setAnalysisComplete(false)
    console.log('[GlowAI][ScanFlow] isAnalyzing=true analysisComplete=false')

    let active = true
    const t1 = setTimeout(() => { if (active) { console.log('[GlowAI][ScanFlow] step complete: face shape'); setAnalyzingStep(1) } }, 1000)
    const t2 = setTimeout(() => { if (active) { console.log('[GlowAI][ScanFlow] step complete: skin undertone'); setAnalyzingStep(2) } }, 2000)
    const t3 = setTimeout(() => { if (active) { console.log('[GlowAI][ScanFlow] step complete: style matches'); setAnalyzingStep(3) } }, 3000)
    ;(async () => {
      try {
        console.log('[GlowAI][ScanAnalysis] run effect: start')
        const result = await withAnalysisTimeout(analyzeCapture(capturedImage), 'Complete scan analysis')
        if (!active) return
        console.log('[GlowAI][ScanAnalysis] face analysis returned result', {
          faceShape: result?.faceShape,
          skinTone: result?.skinTone,
          fallbackUsed: Boolean(result?.fallbackUsed),
        })
        console.log('[GlowAI][ScanAnalysis] run effect: complete', result)
        setAnalysisResult(result)
        if (capturedImage) {
          console.log('[GlowAI][ScanFlow] saving scan selfie for report/profile handoff: start')
          saveAiScanSelfie({
            preview: capturedImage,
            source: 'ai_scan',
            capturedAt: new Date().toISOString(),
          })
          console.log('[GlowAI][ScanFlow] saving scan selfie for report/profile handoff: complete')
        }
      } catch (err) {
        console.error('[GlowAI][ScanAnalysis] analysis failed, using local fallback result', err)
        if (active) {
          const fallback = fallbackCaptureAnalysis(err.message || 'analysis failed')
          setAnalysisResult(fallback)
          if (capturedImage) {
            saveAiScanSelfie({
              preview: capturedImage,
              source: 'ai_scan',
              capturedAt: new Date().toISOString(),
            })
          }
        }
      } finally {
        if (!active) return
        setIsAnalyzing(false)
        setAnalysisComplete(true)
        setAnalyzingStep(3)
        console.log('[GlowAI][ScanFlow] isAnalyzing=false analysisComplete=true')
        console.log('[GlowAI][ScanFlow] scanState -> results')
        setScanState('results')
      }
    })()
    return () => { active = false; clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [scanState, capturedImage])

  // ── Upload fallback ───────────────────────────────────────────────────────
  const handlePhotoFallback = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const objectUrl = URL.createObjectURL(file)
    let imgEl
    try {
      imgEl = await new Promise((resolve, reject) => {
        const el = new window.Image()
        el.crossOrigin = 'anonymous'
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('Image failed to load'))
        el.src = objectUrl
      })
    } catch {
      setUploadErrors(['Could not read the image file. Please try a different photo.'])
      URL.revokeObjectURL(objectUrl)
      return
    }
    let landmarks = null
    console.log('[GlowAI][UploadScan] detect landmarks before analysis: start')
    try {
      landmarks = await withAnalysisTimeout(detectLandmarks(imgEl), 'Uploaded image landmark detection')
      console.log('[GlowAI][UploadScan] detect landmarks before analysis: complete', { found: Boolean(landmarks) })
    } catch (err) {
      console.warn('[GlowAI][UploadScan] detect landmarks timed out/failed, continuing with fallback analysis', err)
    }
    if (!landmarks) {
      setUploadErrors(['Face landmarks could not be confirmed. GlowAI will continue with fallback analysis.'])
    }
    if (landmarks) setUploadErrors([])
    setCapturedImage(objectUrl)
    setScanState('analyzing')
  }, [])

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetScan = useCallback(() => {
    stopCamera()
    clearAiScanSelfie()
    setScanState('idle')
    setCapturedImage(null)
    setErrorMsg('')
    setModelError('')
    setAnalysisResult(null)
    setAnalysisError('')
    setIsAnalyzing(false)
    setAnalysisComplete(false)
    setUploadErrors([])
    setSmileScore(0)
    setSmileReady(false)
    setSmilePhase(false)
    setSmileError('')
    setValidation({ facePresent: null, oneFace: null, faceSize: null, faceCentered: null, lightingGood: null, notBlurry: null })
  }, [clearAiScanSelfie, stopCamera])

  const retryWithModelReset = useCallback(() => {
    detectorRef.current = null
    resetFaceLandmarker()
    resetScan()
  }, [resetScan])

  const retryAnalysis = useCallback(() => {
    if (!capturedImage) {
      resetScan()
      return
    }
    setAnalysisError('')
    setAnalysisResult(null)
    setIsAnalyzing(false)
    setAnalysisComplete(false)
    setAnalyzingStep(0)
    setScanState('analyzing')
  }, [capturedImage, resetScan])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="bg-glow-black border border-glow-gold/20 rounded-3xl p-6 shadow-luxury-lg w-full max-w-sm mx-auto lg:mx-0 relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-glow-gold/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-glow-rose/10 rounded-full blur-2xl pointer-events-none" />

      {/* ── IDLE ───────────────────────────────────────────────────────── */}
      {scanState === 'idle' && (
        <div className="flex flex-col items-center text-center py-4">
          <div className="relative w-44 h-44 rounded-full overflow-hidden border-2 border-glow-gold/30 mb-6 bg-neutral-900 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
            <img src={beautyScanAvatar} alt="Guided beauty avatar" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            <Sparkles size={18} className="absolute right-10 top-10 text-glow-gold" />
            <Sparkles size={12} className="absolute left-11 bottom-12 text-glow-hover-gold" />
          </div>
          <span className="text-glow-gold text-xs font-inter uppercase tracking-widest mb-2 flex items-center gap-1.5 justify-center">
            <Sparkles size={11} /> AI Beauty Consultant
          </span>
          <h3 className="font-playfair text-white text-xl font-medium mb-3 drop-shadow-[0_0_18px_rgba(0,0,0,0.36)]">Guided Beauty Scan</h3>
          <p className="font-inter text-xs text-white/90 mb-6 max-w-xs leading-relaxed drop-shadow-[0_0_14px_rgba(0,0,0,0.2)]">
            Our AI guides you to a clear selfie, then delivers personalised beauty, grooming, and styling recommendations.
          </p>
          <button
            onClick={startScan}
            className="btn-gold text-xs py-2.5 px-6 shadow-luxury w-full flex items-center justify-center gap-1.5"
          >
            <Camera size={14} /> Start AI Beauty Scan
          </button>
        </div>
      )}

      {/* ── MODEL LOADING ──────────────────────────────────────────────── */}
      {scanState === 'model_loading' && (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 size={36} className="text-glow-gold animate-spin mb-6" />
          <span className="font-inter text-xs text-glow-gold uppercase tracking-wider font-semibold mb-2">
            Loading AI Models…
          </span>
          <p className="font-inter text-[11px] text-white/50 max-w-[200px] leading-relaxed">
            Downloading face detection model on first use. This may take a moment.
          </p>
        </div>
      )}

      {/* ── INITIALIZING ───────────────────────────────────────────────── */}
      {scanState === 'initializing' && (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader2 size={36} className="text-glow-gold animate-spin mb-6" />
          <span className="font-inter text-xs text-glow-gold uppercase tracking-wider font-semibold mb-2">
            Initialising AI Scan…
          </span>
          <p className="font-inter text-[11px] text-white/50 max-w-[200px] leading-relaxed">
            Requesting camera access and loading beauty models…
          </p>
        </div>
      )}

      {/* ── DETECTING / SMILE_CHECK — unified live validation HUD ───── */}
      {(scanState === 'detecting' || scanState === 'smile_check') && (
        <div className="flex flex-col items-center py-2 text-center">

          {/* Circular camera preview */}
          <div
            className={`relative w-40 h-40 rounded-full overflow-hidden border-2 mb-4 bg-neutral-950 transition-all duration-500 ${
              allValid
                ? 'border-glow-hover-gold shadow-[0_0_22px_rgba(212,175,106,0.35)]'
                : smilePhase
                  ? 'border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.3)]'
                  : 'border-glow-gold shadow-[0_0_14px_rgba(201,168,106,0.2)]'
            }`}
          >
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full m-3 pointer-events-none" />
            <AnimatePresence>
              {allValid && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-glow-gold/15 flex items-center justify-center">
                  <div className="w-11 h-11 bg-glow-deep-gold rounded-full flex items-center justify-center shadow-lg">
                    <Check size={18} className="text-glow-black" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Phase label */}
          <p className="font-inter text-[10px] text-white/40 uppercase tracking-widest mb-2">
            {smilePhase ? 'Step 2 — Smile Detection' : 'Step 1 — Face Validation'}
          </p>

          {/* Validation HUD — 6 face checks */}
          <div className="w-full space-y-1 mb-2">
            {VALIDATION_CHECKS.map(({ key, passLabel, failLabel }) => {
              const state = validation[key]
              return (
                <motion.div key={key} layout
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors duration-200 ${
                    state === true ? 'bg-glow-gold/10' : state === false ? 'bg-red-500/8' : 'bg-white/5'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    state === true ? 'bg-glow-deep-gold' : state === false ? 'bg-red-500' : 'bg-white/10'
                  }`}>
                    {state === true  && <Check size={9} className="text-glow-black" />}
                    {state === false && <span className="text-white text-[8px] font-bold leading-none">✕</span>}
                    {(state === null || state === undefined) && <Loader2 size={8} className="text-white/40 animate-spin" />}
                  </div>
                  <span className={`font-inter text-[11px] text-left leading-tight ${
                    state === true ? 'text-glow-hover-gold' : state === false ? 'text-red-400' : 'text-white/45'
                  }`}>
                    {state === false ? failLabel : passLabel}
                  </span>
                </motion.div>
              )
            })}

            {/* Smile check row — shown once face checks pass */}
            <AnimatePresence>
              {smilePhase && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  {/* Smile score bar */}
                  <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${
                    smileReady
                      ? 'bg-glow-gold/12 border-glow-gold/30'
                      : 'bg-amber-500/8 border-amber-500/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                      smileReady ? 'bg-glow-deep-gold' : 'bg-amber-500/40 border border-amber-500/60'
                    }`}>
                      {smileReady ? <Check size={9} className="text-glow-black" /> : <span>😄</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-inter text-[11px] font-medium ${smileReady ? 'text-glow-hover-gold' : 'text-amber-300'}`}>
                          {smileReady
                            ? '😀 Great smile! Ready to capture'
                            : smileScore >= 50
                              ? '🙂 Smile a little bigger!'
                              : '😐 Show us your smile'}
                        </span>
                        <span className="font-inter text-[10px] text-white/40 ml-2 shrink-0">{smileScore}%</span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${smileReady ? 'bg-glow-gold' : 'bg-amber-400'}`}
                          animate={{ width: `${smileScore}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Smile timeout error */}
                  {smileError && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-1.5 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="font-inter text-[10px] text-red-400 leading-relaxed mb-2">{smileError}</p>
                      <button
                        onClick={() => { setSmileError(''); setSmileScore(0); setSmileReady(false) }}
                        className="font-inter text-[10px] text-white/60 hover:text-white underline"
                      >
                        Try again
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Capture button — locked until allValid */}
          <button
            id="beauty-scan-capture-btn"
            onClick={capturePhoto}
            disabled={!allValid}
            className={`w-full text-xs py-2.5 px-6 rounded-full font-inter font-semibold flex items-center justify-center gap-2 transition-all duration-400 ${
              allValid
                ? 'bg-glow-deep-gold text-glow-black shadow-[0_0_22px_rgba(212,175,106,0.4)] hover:bg-glow-hover-gold active:scale-95 cursor-pointer'
                : smilePhase
                  ? 'bg-amber-500/15 text-amber-400/60 cursor-not-allowed border border-amber-500/20'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            <Camera size={13} />
            {allValid
              ? '✓ Capture Selfie'
              : smilePhase
                ? `😄 Smile to unlock (${smileScore}% / ${SMILE_THRESHOLD}% needed)`
                : 'Checking face quality…'}
          </button>

          {/* Debug panel */}
          {DEBUG_ENABLED && (
            <button onClick={() => setShowDebug(v => !v)} className="mt-2 flex items-center gap-1 text-[9px] font-inter text-white/35 hover:text-white/60 mx-auto">
              <Bug size={9} />{showDebug ? 'Hide' : 'Show'} debug
            </button>
          )}
          {DEBUG_ENABLED && showDebug && (
            <div className="mt-1 w-full bg-black/50 border border-white/8 rounded-xl p-2 text-left font-mono text-[9px] text-white/55 max-h-32 overflow-y-auto">
              <pre>{JSON.stringify({ ...debugInfo, faceChecksPassed, smilePhase, smileScore, smileReady, threshold: SMILE_THRESHOLD }, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── CAPTURING — freeze frame ────────────────────────────────────── */}
      {scanState === 'capturing' && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-glow-hover-gold mb-5 shadow-[0_0_22px_rgba(212,175,106,0.35)]">
            {capturedImage && (
              <img src={capturedImage} alt="Captured selfie" className="w-full h-full object-cover" />
            )}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-glow-gold/15 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="w-12 h-12 bg-glow-deep-gold rounded-full flex items-center justify-center shadow-xl"
              >
                <Check size={22} className="text-glow-black" />
              </motion.div>
            </motion.div>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {['✓ Face Detected', '✓ Smile Confirmed', '✓ Good Lighting'].map((label) => (
              <span key={label} className="font-inter text-[10px] text-glow-hover-gold bg-glow-gold/10 border border-glow-gold/20 px-2 py-0.5 rounded-full">
                {label}
              </span>
            ))}
          </div>
          <p className="font-inter text-[11px] text-white/70">Initialising analysis...</p>
        </div>
      )}

      {/* ── ANALYZING ──────────────────────────────────────────────────── */}
      {scanState === 'analyzing' && (
        <div className="flex flex-col items-center py-3 text-center">
          <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-glow-gold mb-5 bg-neutral-950">
            {capturedImage ? (
              <img src={capturedImage} alt="Analysing face" className="w-full h-full object-cover opacity-55" />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(circle_at_50%_20%,rgba(228,196,136,0.28),transparent_34%),linear-gradient(160deg,#1f1f22,#0f0f10_68%)] opacity-80" />
            )}
            {/* Scan sweep */}
            <motion.div
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-0.5 bg-glow-gold shadow-[0_0_10px_rgba(201,168,106,0.8)] z-10"
            />
            {/* Landmark dots */}
            <div className="absolute top-[32%] left-[30%] w-1.5 h-1.5 bg-glow-gold rounded-full animate-ping" />
            <div className="absolute top-[32%] right-[30%] w-1.5 h-1.5 bg-glow-gold rounded-full animate-ping" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 w-1.5 h-1.5 bg-glow-rose rounded-full animate-ping" />
            <div className="absolute bottom-[30%] left-[50%] -translate-x-1/2 w-1.5 h-1.5 bg-glow-gold rounded-full animate-ping" />
          </div>

          <span className="font-inter text-xs text-glow-gold uppercase tracking-wider font-semibold mb-1">
            Analysing Your Features…
          </span>
          <p className="font-inter text-[11px] text-white/50 mb-4">
            Running AI beauty analysis
          </p>

          {/* 4-step progress */}
          <div className="w-full space-y-2">
            {[
              'Mapping face shape & symmetry',
              'Reading skin undertone',
              'Surfacing celebrity style matches',
            ].map((label, i) => {
              const state = i < analyzingStep ? 'done' : i === analyzingStep ? 'active' : 'pending'
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 transition-opacity duration-300 ${state === 'pending' ? 'opacity-25' : 'opacity-100'}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center transition-all duration-500 ${
                      state === 'done'   ? 'bg-glow-gold'                       :
                      state === 'active' ? 'border-2 border-glow-gold bg-transparent' :
                      'border border-white/20 bg-transparent'
                    }`}
                  >
                    {state === 'done'   && <Check size={9} className="text-white" />}
                    {state === 'active' && (
                      <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-glow-gold rounded-full"
                      />
                    )}
                  </div>
                  <span
                    className={`font-inter text-[11px] text-left ${
                      state === 'done'   ? 'text-glow-gold' :
                      state === 'active' ? 'text-white'     :
                      'text-white/65'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ANALYSIS ERROR ─────────────────────────────────────────────── */}
      {scanState === 'analysis_error' && (
        <div className="flex flex-col items-center text-center py-5">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={22} className="text-amber-400" />
          </div>
          <span className="text-amber-400 text-xs font-inter uppercase tracking-widest mb-2 font-semibold">
            Analysis Could Not Complete
          </span>
          <p className="font-inter text-xs text-white/65 mb-4 max-w-xs leading-relaxed">
            {analysisError || 'GlowAI could not finish analysing this photo. Please retry or choose a clearer image.'}
          </p>
          {capturedImage && (
            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-glow-gold/25 mb-4">
              <img src={capturedImage} alt="Selfie to retry" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col gap-2.5 w-full">
            <button onClick={retryAnalysis} className="btn-gold text-xs py-2.5 px-6 shadow-luxury w-full">
              Retry Analysis
            </button>
            <label className="btn-outline-gold text-xs py-2.5 px-4 cursor-pointer flex items-center justify-center gap-1.5 border-white/20 hover:border-glow-gold text-white/90">
              <UploadCloud size={14} /> Upload a Different Photo
              <input type="file" accept="image/*" onChange={handlePhotoFallback} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* ── ERROR ──────────────────────────────────────────────────────── */}
      {scanState === 'error' && (
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={22} className="text-red-500" />
          </div>

          <span className="text-red-500 text-xs font-inter uppercase tracking-widest mb-2 font-semibold">
            {modelError ? 'Model Load Failed' : 'Camera Access Denied'}
          </span>

          <p className="font-inter text-xs text-white/60 mb-4 max-w-xs leading-relaxed">
            {modelError || errorMsg || 'Camera permissions were denied. Please check your browser settings or upload a photo.'}
          </p>

          {/* Upload validation errors */}
          {uploadErrors.length > 0 && (
            <div className="w-full bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2.5 mb-4 text-left">
              <p className="font-inter text-[10px] text-amber-400 font-semibold mb-1.5">📸 Photo validation failed:</p>
              {uploadErrors.map((err, i) => (
                <p key={i} className="font-inter text-[10px] text-amber-300/80 leading-relaxed">• {err}</p>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2.5 w-full">
            <label className="btn-outline-gold text-xs py-2.5 px-4 cursor-pointer flex items-center justify-center gap-1.5 border-white/20 hover:border-glow-gold text-white/90">
              <UploadCloud size={14} /> Upload Photo Instead
              <input type="file" accept="image/*" onChange={handlePhotoFallback} className="hidden" />
            </label>
            {modelError ? (
              <button onClick={retryWithModelReset} className="btn-gold text-xs py-2.5 px-6 shadow-luxury w-full flex items-center justify-center gap-1.5">
                <RefreshCw size={13} /> Retry
              </button>
            ) : (
              <button onClick={startScan} className="btn-gold text-xs py-2.5 px-6 shadow-luxury w-full">
                Retry Camera Scan
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── RESULTS ────────────────────────────────────────────────────── */}
      {scanState === 'results' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col"
        >
          {/* Profile header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-glow-gold/30 shrink-0">
              {capturedImage ? (
                <img src={capturedImage} alt="Your selfie" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-glow-gold/15 flex items-center justify-center">
                  <Sparkles size={14} className="text-glow-gold" />
                </div>
              )}
            </div>
            <div>
              <p className="font-playfair text-white text-sm font-semibold leading-tight">Analysis Complete</p>
              <p className="font-inter text-[10px] text-glow-gold">GlowAI Match Engine</p>
            </div>
            {(analysisResult?.faceShape || analysisResult?.skinTone) ? (
              <span className="ml-auto shrink-0 text-[9px] font-inter text-glow-gold bg-glow-gold/15 px-2 py-0.5 rounded-full border border-glow-gold/30">
                Verified
              </span>
            ) : (
              <span className="ml-auto shrink-0 text-[9px] font-inter text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                Low Confidence
              </span>
            )}
          </div>

          {/* Analysis results */}
          <div className="space-y-1.5 mb-4">
            {/* Face Shape */}
            <div className="flex items-start justify-between border-b border-white/5 pb-2">
              <span className="font-inter text-[11px] text-white/70 pt-0.5">Face Shape</span>
              <div className="text-right">
                <span className={`font-inter text-[11px] font-semibold ${
                  analysisResult?.faceShape ? 'text-glow-gold' : 'text-white/65'
                }`}>
                  {analysisResult?.faceShape ?? 'Unable to determine'}
                </span>
                <p className="font-inter text-[9px] text-white/60 leading-tight mt-0.5">
                  {analysisResult?.faceShape
                    ? `${analysisResult.faceShapeConfidence}% confidence`
                    : 'Retake selfie for better results'}
                </p>
              </div>
            </div>

            {/* Skin Tone */}
            <div className="flex items-start justify-between pb-1">
              <span className="font-inter text-[11px] text-white/70 pt-0.5">Skin Tone</span>
              <div className="text-right">
                <span className={`font-inter text-[11px] font-semibold ${
                  analysisResult?.skinTone ? 'text-white' : 'text-white/65'
                }`}>
                  {analysisResult?.skinTone
                    ? `${analysisResult.skinTone} · ${analysisResult.skinUndertone}`
                    : 'Unable to determine'}
                </span>
                <p className="font-inter text-[9px] text-white/60 leading-tight mt-0.5">
                  {analysisResult?.skinTone
                    ? `${analysisResult.skinConfidence}% confidence · ${analysisResult.skinUndertone} undertone`
                    : 'Needs clearer lighting'}
                </p>
              </div>
            </div>
          </div>

          {/* Face shape explanation */}
          {analysisResult?.faceShape && analysisResult?.faceShapeReason && (
            <div className="bg-white/8 border border-white/12 rounded-xl px-3 py-2.5 mb-4">
              <p className="font-inter text-[9px] text-glow-gold mb-1 flex items-center gap-1">
                <Info size={8} /> Why this face shape?
              </p>
              <p className="font-inter text-[10px] text-white/70 leading-relaxed">
                {analysisResult.faceShapeReason}
              </p>
            </div>
          )}

          {/* Skin explanation */}
          {analysisResult?.skinTone && analysisResult?.skinReason && (
            <div className="bg-white/8 border border-white/12 rounded-xl px-3 py-2.5 mb-4">
              <p className="font-inter text-[9px] text-glow-gold mb-1 flex items-center gap-1">
                <Info size={8} /> Why this skin reading?
              </p>
              <p className="font-inter text-[10px] text-white/70 leading-relaxed">
                {analysisResult.skinReason}
              </p>
            </div>
          )}

          {/* No landmarks warning */}
          {analysisResult && !analysisResult.landmarksDetected && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2.5 mb-4">
              <p className="font-inter text-[10px] text-amber-400 leading-relaxed">
                ⚠ Landmark detection failed. For best results, ensure your face is fully visible, well-lit, and the camera is at eye level.
              </p>
            </div>
          )}

          {/* Next step prompt */}
          <div className="bg-glow-gold/8 border border-glow-gold/20 rounded-xl px-3 py-2.5 mb-4">
            <p className="font-inter text-[9px] text-glow-gold mb-0.5 flex items-center gap-1">
              <Sparkles size={8} /> Ready for full analysis
            </p>
            <p className="font-inter text-[9px] text-white/70 leading-relaxed">
              Complete your profile to receive character-inspired looks, style recommendations, and curated salon matches.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={resetScan}
              className="btn-outline-gold flex-1 text-xs py-2 px-3 border-white/20 text-white/70 hover:text-white"
            >
              Rescan
            </button>
            <button
              onClick={() => {
                console.log('[GlowAI][ScanFlow] Analyse Yours clicked')
                console.log('[GlowAI][ScanFlow] navigating to report/profile route: /profile-setup')
                navigate('/profile-setup')
              }}
              className="btn-gold flex-1 text-xs py-2 px-3 gap-1 shadow-luxury"
            >
              Analyse Yours <ArrowRight size={11} />
            </button>
          </div>

          {/* Post-analysis debug panel */}
          {DEBUG_ENABLED && (
            <button
              onClick={() => setShowDebug(v => !v)}
              className="mt-3 flex items-center gap-1.5 text-[9px] font-inter text-white/55 hover:text-white/80 transition-colors mx-auto"
            >
              <Bug size={9} />{showDebug ? 'Hide' : 'Show'} analysis debug
            </button>
          )}

          {DEBUG_ENABLED && showDebug && analysisResult && (
            <div className="mt-2 w-full bg-black/50 border border-white/10 rounded-xl p-3 text-left font-mono text-[9px] text-white/70 overflow-auto max-h-48">
              <p className="text-[10px] font-semibold text-glow-gold mb-2">🔬 Analysis Result</p>
              <pre className="whitespace-pre-wrap">
                {JSON.stringify({
                  faceShape: analysisResult.faceShape,
                  faceShapeConfidence: analysisResult.faceShapeConfidence,
                  faceShapeReason: analysisResult.faceShapeReason,
                  skinTone: analysisResult.skinTone,
                  skinUndertone: analysisResult.skinUndertone,
                  skinConfidence: analysisResult.skinConfidence,
                  hairVisible: analysisResult.hairVisible,
                  landmarksDetected: analysisResult.landmarksDetected,
                }, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

/* ---------- Static data for page sections --------------------------------- */

const TESTIMONIALS = [
  {
    name: 'Aisha Kapoor',
    role: 'Fashion Consultant, Vogue India',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&q=80',
    review: 'GlowAI matched me with Luxe Studio Bandra instantly. The AI understood my aesthetic better than I could articulate myself. Absolute game-changer for Mumbai.',
  },
  {
    name: 'Sneha Reddy',
    role: 'Entrepreneur & Beauty Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
    review: 'The bridal planner alone is worth everything. A 90-day beauty timeline, perfectly personalised to my skin and style. My wedding day look was flawless.',
  },
  {
    name: 'Mira Shah',
    role: 'Marketing Director',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
    review: 'I used the budget optimizer and saved ₹3,200 on my monthly beauty routine without compromising on quality. Smart, effortless, luxurious.',
  },
]

const HOW_STEPS = [
  {
    step: '01',
    icon: <Heart size={22} />,
    title: 'Create Style Profile',
    desc: 'Share your grooming goals, skin concerns, style preferences, and budget in under 2 minutes.',
  },
  {
    step: '02',
    icon: <Zap size={22} />,
    title: 'Receive AI Recommendations',
    desc: 'Our AI analyses your profile and surfaces salons, treatments, and experiences curated for you.',
  },
  {
    step: '03',
    icon: <Shield size={22} />,
    title: 'Book Your Experience',
    desc: 'Confirm your appointment instantly with verified professionals and premium salons across Mumbai.',
  },
]

const TRUST = [
  { value: 25000, suffix: '+', label: 'Beauty Consultations' },
  { value: 4.9,   suffix: '★', label: 'Average Rating',       isFloat: true },
  { value: 150,   suffix: '+', label: 'Verified Professionals' },
  { value: 50,    suffix: '+', label: 'Premium Salon Partners' },
]

/* ---------- Page ---------------------------------------------------------- */
export default function LandingPage() {
  const navigate = useNavigate()
  const { openChat } = useBeautyProfile()
  const [showDemo, setShowDemo] = useState(false)

  const fadeUp = {
    hidden:  { opacity: 0, y: 30 },
    visible: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' },
    }),
  }

  return (
    <MainLayout>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="min-h-screen flex items-center pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-glow-bg overflow-hidden luxury-ambient">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="order-2 lg:order-1">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 bg-white/65 backdrop-blur-md border border-glow-gold/25 text-glow-deep-gold font-inter text-xs px-4 py-2 rounded-full mb-6">
                  <Sparkles size={13} /> Mumbai's AI Style Concierge
                </span>
              </motion.div>

              <motion.h1
                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-medium text-glow-black leading-[1.08] mb-6"
              >
                Style,
                <br />
                <span className="italic text-glow-gold">Grooming</span>
                <br />
                For You
              </motion.h1>

              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="font-inter text-base sm:text-lg text-glow-muted leading-relaxed mb-8 max-w-md"
              >
                Discover salons, stylists, grooming experts, bridal artists, and self-care experiences — all personalised to your style, preferences, and budget across Mumbai.
              </motion.p>

              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="flex flex-wrap gap-4"
              >
                <button onClick={() => navigate('/profile-setup')} className="btn-gold text-base py-4 px-8">
                  Create My Style Profile <ArrowRight size={17} />
                </button>
                <button onClick={() => setShowDemo(true)} className="btn-outline-gold text-base py-4 px-8 group">
                  <div className="w-8 h-8 bg-glow-gold/12 rounded-full flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <Play size={14} className="text-glow-gold transition-colors" />
                  </div>
                  Watch Demo
                </button>
              </motion.div>

              {/* Talk to Glow CTA */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="mt-4"
              >
                <button
                  onClick={openChat}
                  className="flex items-center gap-2 text-glow-gold font-inter text-sm hover:text-glow-hover-gold transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-glow-gold/10 border border-glow-gold/25 flex items-center justify-center group-hover:bg-glow-gold/20 transition-colors">
                    <MessageSquare size={13} />
                  </div>
                  Talk to Glow — your AI beauty concierge
                </button>
              </motion.div>
            </div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="order-1 lg:order-2 flex justify-center lg:justify-end"
            >
              <InteractiveAIBeautyAnalyzer />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust Metrics ────────────────────────────────── */}
      <section className="py-14 bg-glow-black border-y border-glow-gold/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {TRUST.map((item) => (
              <div key={item.label} className="text-center lg:border-r lg:border-glow-gold/16 last:border-r-0">
                <p className="font-playfair text-3xl sm:text-4xl font-medium text-glow-gold mb-1">
                  {item.isFloat
                    ? <span>{item.value}{item.suffix}</span>
                    : <><Counter target={item.value} />{item.suffix}</>
                  }
                </p>
                <p className="font-inter text-xs text-white/50 uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Experiences ─────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 luxury-ambient">
        <div className="max-w-7xl mx-auto relative z-10">
          <SectionHeader
            badge="Curated For You"
            title="Featured Style Experiences"
            subtitle="Handpicked beauty, grooming, and self-care experiences personalised for every style identity."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences.slice(0, 3).map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <ExperienceCard experience={exp} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => navigate('/experiences')} className="btn-outline-gold">
              View All Experiences <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-glow-champagne border-y border-glow-border">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Simple & Effortless"
            title="How GlowAI Works"
            subtitle="Three elegant steps to your perfect beauty experience."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px bg-gradient-to-r from-glow-border via-glow-gold to-glow-border" />
            {HOW_STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center relative"
              >
                <div className="w-14 h-14 bg-glow-surface border border-glow-gold/20 rounded-2xl flex items-center justify-center text-glow-gold mx-auto mb-5 shadow-luxury">
                  {step.icon}
                </div>
                <span className="font-inter text-xs text-glow-gold uppercase tracking-widest mb-2 block">{step.step}</span>
                <h3 className="font-playfair text-xl font-semibold text-glow-black mb-3">{step.title}</h3>
                <p className="font-inter text-sm text-glow-muted leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Salons ───────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Mumbai's Finest"
            title="Popular Salons"
            subtitle="Verified premium salons curated for excellence, consistency, and luxury experience."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {salons.slice(0, 6).map((salon, i) => (
              <motion.div
                key={salon.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <SalonCard salon={salon} />
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={() => navigate('/salons')} className="btn-outline-gold">
              Explore All Salons <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-glow-champagne border-y border-glow-border">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Client Stories"
            title="Loved By Mumbai's Best"
            subtitle="Discover how GlowAI is transforming style, grooming, and self-care experiences across Mumbai."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <TestimonialCard testimonial={t} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden luxury-ambient bg-glow-black">
        <div className="absolute top-0 right-0 w-96 h-96 bg-glow-gold/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-glow-rose/8 rounded-full blur-3xl" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-6">
              <Sparkles size={13} /> Your Journey Starts Here
            </span>
            <h2 className="font-playfair text-4xl sm:text-5xl font-medium text-white leading-tight mb-6">
              Your Next Style Experience
              <br />
              <span className="italic text-glow-gold">Starts Here</span>
            </h2>
            <p className="font-inter text-base text-white/55 leading-relaxed mb-10 max-w-lg mx-auto">
              Join 25,000+ clients who have discovered their perfect style match with GlowAI. Personalised, premium, and entirely yours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => navigate('/profile-setup')} className="btn-gold text-base py-4 px-10 shadow-luxury-lg">
                Create My Style Profile <ArrowRight size={17} />
              </button>
              <button
                onClick={openChat}
                className="btn-outline-gold text-base py-4 px-8 flex items-center gap-2"
              >
                <MessageSquare size={16} className="text-glow-gold" /> Talk to Glow
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <DemoVideoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </MainLayout>
  )
}
