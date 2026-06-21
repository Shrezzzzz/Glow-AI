# GlowAI Analysis Pipeline - Debugging Guide

## How to Test the Real Pipeline

### Option 1: Test in Browser (Recommended)
Open `test-analysis.html` in your browser:
```bash
cd /Users/shrezzzzz/Documents/Code/GLoW_AI
python3 -m http.server 8000
# Then navigate to: http://localhost:8000/test-analysis.html
```

This will:
- ✅ Load real MediaPipe FaceDetector
- ✅ Load real MediaPipe FaceLandmarker
- ✅ Capture live webcam
- ✅ Show real detection output (faces detected, landmarks, bounding box)
- ✅ Show validation metrics (brightness, blur, centering, hair visibility)
- ✅ Run analysis on captured selfie
- ✅ Upload and analyze external images

### Option 2: Test in GlowAI Landing Page
1. Go to `http://localhost:5173` (after `npm run dev`)
2. Click "Start Scan"
3. Check console (F12) for MediaPipe errors
4. Watch for validation checks passing/failing in real-time

---

## Potential Issues to Check

### Issue 1: FaceDetector Not Initialized
**Location**: `src/pages/LandingPage.jsx:197`

The detector is initialized lazily. If it fails silently, detection won't work:

```javascript
const initializeDetector = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm'
  )
  return await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
    },
    runningMode: 'VIDEO',  // ← Critical: must be VIDEO for live stream
  })
}
```

**Check**: Look in browser console for errors:
- "Failed to load WASM" → CDN issue
- "Model failed to load" → Google Storage access issue
- "FilesetResolver not found" → Import issue

---

### Issue 2: FaceDetector.detectForVideo() Timeout
**Location**: `src/services/imageValidation.js:54`

```javascript
const result = detector.detectForVideo(element, timestamp)
```

**Problem**: If video is not ready (readyState < 2), detector might fail silently.

**Check**: In `startValidationLoop()`, verify:
```javascript
if (!video || video.readyState < 2) {
  requestRef.current = requestAnimationFrame(tick)
  return  // Skip until video is ready
}
```

---

### Issue 3: Validation Thresholds Too Strict
**Location**: `src/services/imageValidation.js:340-350`

```javascript
export const IMAGE_VALIDATION_THRESHOLDS = {
  brightnessMin: 58,        // 0-255 scale (might be too high)
  blurMin: 2.4,              // Laplacian variance (might be too high)
  centerXMin: 0.34,
  centerXMax: 0.66,
  centerYMin: 0.24,
  centerYMax: 0.74,
  faceHeightMin: 0.28,      // 28% of image (tight!)
  faceHeightMax: 0.78,      // 78% of image
  hairTopMin: 0.18,         // Hair must start in top 18%
}
```

**Possible Problem**: `brightnessMin: 58` is very strict. Typical room lighting is 80-120.

**Fix**: Reduce thresholds for initial MVP:
```javascript
brightnessMin: 45,  // More lenient
blurMin: 1.8,       // More lenient
```

---

### Issue 4: Hair Visibility Check Too Strict
**Location**: `src/services/imageValidation.js:60-66`

```javascript
hairVisibility =
  topY > IMAGE_VALIDATION_THRESHOLDS.hairTopMin &&
  box.originX / width > IMAGE_VALIDATION_THRESHOLDS.cropSideMin &&
  (box.originX + box.width) / width < 1 - IMAGE_VALIDATION_THRESHOLDS.cropSideMin
```

**Problem**: Requires hair to be in top 18% AND full width visible. Many hairstyles won't fit.

**Check**: Try with visible hair (not tied up) and see if it still fails.

---

### Issue 5: Video Readiness Edge Case
**Location**: `src/pages/LandingPage.jsx:274`

```javascript
const validationResult = validateImageSource(video, detector, vw, vh)
```

**Problem**: If `video.readyState` is 1 (loading) not 2 (canplay), detection might return empty.

**Check**: Console should show: `Video ready state: HAVE_CURRENT_DATA`

---

## Diagnostic Commands

### 1. Check if FaceDetector loads:
```javascript
// In browser console while on landing page
console.log(window.google?.mediapipe?.FaceDetector)  // Should not be undefined
```

### 2. Check video element state:
```javascript
// In browser console
const video = document.querySelector('video')
console.log({
  videoWidth: video.videoWidth,
  videoHeight: video.videoHeight,
  readyState: video.readyState,  // Should be 2 or higher
  networkState: video.networkState,  // Should be 2
  paused: video.paused  // Should be false
})
```

### 3. Check detector output directly:
```javascript
// In browser console
const detector = detectorRef.current  // If accessible
const result = detector.detectForVideo(video, performance.now())
console.log(result)  // Should show { detections: [...] }
```

---

## Real-World Test Scenarios

### Scenario A: Good Lighting, Face Visible
**Expected**: All checks pass ✓
- Faces detected: 1
- Face centered: ✓
- Face size: 40-60%
- Brightness: 80-150
- Blur: 5-50

### Scenario B: Low Lighting
**Expected**: Brightness check fails ✗
- Brightness: < 45 (too dark)
- **Fix**: Turn on lights or increase screen brightness

### Scenario C: Hair Tied Up
**Expected**: Hair visibility fails ✗
- Hair visible: ✗
- **Fix**: Loosen hair and retake

### Scenario D: Face Too Close
**Expected**: Face size check fails ✗
- Face size: > 78% (too close)
- **Fix**: Move further from camera

### Scenario E: Multiple Faces in Frame
**Expected**: Single face check fails ✗
- Faces detected: 2+
- **Fix**: Only one person in frame

---

## Performance Metrics

### Expected Detection Latency
- FaceDetector: 30-50ms per frame @ 30fps
- FaceLandmarker: 100-150ms per frame @ 30fps

### Expected Results
```javascript
{
  facesDetected: 1,
  faceCentered: true,
  faceSize: 52,              // 52% of image
  brightnessScore: 105,      // Good indoor lighting
  blurScore: 8.3,            // Sharp image
  hairVisibility: true,
  validationPassed: true,
  errors: []
}
```

---

## Troubleshooting Checklist

- [ ] MediaPipe models load (check Network tab)
- [ ] Video has permission (check browser permissions)
- [ ] Video element readyState ≥ 2 before detection
- [ ] Console shows no WASM errors
- [ ] FaceDetector initialized successfully
- [ ] Face visible to camera
- [ ] Adequate lighting (80+ brightness)
- [ ] Image is sharp (blur > 1.8)
- [ ] Hair is visible (not tied up)
- [ ] Face fills 28-78% of frame
- [ ] Face is centered (34-66% horizontally, 24-74% vertically)

---

## Next Steps

1. **Open `test-analysis.html` in browser**
2. **Allow camera access when prompted**
3. **Click "Start Webcam"**
4. **Observe detection metrics in real-time**
5. **Capture selfie and verify analysis**
6. **Upload test images to verify consistency**
7. **Review JSON output for accuracy**
8. **Compare with expected thresholds**
9. **Adjust thresholds if needed**
10. **Re-test until all validations pass**
