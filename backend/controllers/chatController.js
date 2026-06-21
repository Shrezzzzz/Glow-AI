/**
 * chatController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Streaming SSE chat controller for the GlowAI Glow concierge.
 *
 * Production fixes applied:
 *
 *  [CRITICAL-1] SSE headers were set BEFORE the API-key check. When the key
 *    was missing in production, the code called res.status(503).json() on an
 *    already-flushed SSE stream, throwing "Cannot set headers after they are
 *    sent." The 503 was silently swallowed; the client received an empty open
 *    stream. Fixed: all branching logic (key check, dev fallback, OpenAI call)
 *    now runs BEFORE res.setHeader / res.flushHeaders().
 *
 *  [CRITICAL-3] Full chat history sent to OpenAI on every message with no cap.
 *    Fixed: apiMessages trimmed to last MAX_HISTORY_MESSAGES (20) before the
 *    OpenAI call. System prompt is excluded from this count.
 *
 *  [HIGH-4] OpenAI SDK instantiated inside the request handler on every call.
 *    Fixed: singleton openaiClient created once at module load, guarded by
 *    config.openaiEnabled.
 *
 *  [HIGH-5] No typed OpenAI error handling. A 401 bad-key or 429 rate-limit
 *    produced the same generic "trouble connecting" message.
 *    Fixed: catch branch inspects err.status and err.code to emit specific,
 *    actionable SSE error messages per error type.
 *
 *  [HIGH-6] Dev fallback local reply sent as one giant SSE chunk. Inconsistent
 *    with the streamed OpenAI path; caused UI to feel "stuck" then suddenly
 *    appear. Fixed: local reply is sentence-split and streamed in 40 ms
 *    intervals to match the streaming UX.
 *
 *  [MEDIUM-7] res.flushHeaders() called without guarding headersSent.
 *    Fixed: guard added before flushHeaders().
 *
 *  [LOW-12] No max_tokens set. Fixed: max_tokens: 1024 added to prevent
 *    runaway long responses.
 */

import Groq from 'groq-sdk'
import { config, isProduction } from '../config/env.js'
import { db } from '../models/inMemoryDb.js'
import { fetchGooglePlacesSalons, geocodeAddress } from '../services/googlePlacesService.js'
import { rankSalons } from '../services/salonMatchingEngine.js'
import { salons as localSalons } from '../data/salons.js'
import { MUMBAI_AREA_COORDS } from '../data/mumbaiAreas.js'
import { getHaversineDistance } from '../utils/geo.js'

// ─── OpenAI singleton ────────────────────────────────────────────────────────
// Created once at module load. null when key is absent (dev / mis-configured).
const groqClient = config.groqApiKey
  ? new Groq({ apiKey: config.groqApiKey })
  : null
// Maximum number of past messages forwarded to OpenAI per request.
const MAX_HISTORY_MESSAGES = 20

// ─── Mumbai area resolution from GPS coords ───────────────────────────────────
function nearestMumbaiArea(lat, lng) {
  if (!lat || !lng) return null
  const entries = Object.entries(MUMBAI_AREA_COORDS)
  let nearest = null
  let minDist = Infinity

  for (const [, data] of entries) {
    const dist = getHaversineDistance(lat, lng, data.lat, data.lng)
    if (dist < minDist) {
      minDist = dist
      nearest = data.label
    }
  }
  // If more than 50 km away, not Mumbai
  if (minDist > 50) return null
  return nearest
}

// ─── Service & intent helpers ─────────────────────────────────────────────────

const SERVICE_ALIASES = [
  { intent: 'waxing',   terms: ['wax', 'waxing', 'full body waxing', 'body wax', 'underarm'] },
  { intent: 'threading', terms: ['threading', 'eyebrow', 'brows', 'hd brows'] },
  { intent: 'facial',   terms: ['facial', 'cleanup', 'clean-up', 'skin glow', 'glass skin', 'hydrafacial'] },
  { intent: 'hair',     terms: ['hair', 'haircut', 'cut', 'blow dry', 'spa', 'keratin', 'cysteine', 'balayage', 'color'] },
  { intent: 'makeup',   terms: ['makeup', 'makeover', 'bridal', 'reception', 'wedding', 'party'] },
  { intent: 'nails',    terms: ['nail', 'manicure', 'pedicure', 'gel polish'] },
  { intent: 'massage',  terms: ['massage', 'spa', 'aromatherapy'] },
]

const AFFORDABLE_SERVICES = [
  { salonName: 'Glow Essential Bandra',    location: 'Bandra West',   area: 'Bandra',      rating: 4.4, reviewCount: 86,  service: 'Underarm Waxing',       price: 250,  duration: '20 min', specialties: ['Waxing', 'Threading', 'Clean-up'],            tags: ['Budget Friendly', 'Express Services'], coordinates: { lat: 19.0588, lng: 72.8324 } },
  { salonName: 'Velvet Beauty Andheri',    location: 'Andheri West',  area: 'Andheri',     rating: 4.8, reviewCount: 218, service: 'Eyebrow Design',        price: 500,  duration: '30 min', specialties: ['Threading', 'Skin Treatments', 'Nail Art'],   tags: ['Celebrity Choice', 'Express Services'], coordinates: { lat: 19.1206, lng: 72.8275 } },
  { salonName: 'Blossom Beauty Mulund',    location: 'Mulund West',   area: 'Powai',       rating: 4.5, reviewCount: 120, service: 'Fruit Clean-up Facial', price: 800,  duration: '45 min', specialties: ['Threading', 'Hair Styling', 'Facials'],       tags: ['Affordable', 'Friendly'],              coordinates: { lat: 19.1725, lng: 72.9563 } },
  { salonName: 'Radiance Parlour Worli',   location: 'Worli',         area: 'Lower Parel', rating: 4.5, reviewCount: 95,  service: 'Half Arms Waxing',      price: 450,  duration: '30 min', specialties: ['Facials', 'Waxing', 'Manicure'],              tags: ['Clean', 'Budget Friendly'],            coordinates: { lat: 19.0088, lng: 72.8172 } },
  { salonName: 'Urban Fringe Santa Cruz',  location: 'Santa Cruz West', area: 'Bandra',    rating: 4.3, reviewCount: 71,  service: 'Basic Threading Package', price: 350, duration: '25 min', specialties: ['Styling & Trimming', 'Organic Henna', 'Pedicure'], tags: ['Express Services', 'Budget Friendly'], coordinates: { lat: 19.0810, lng: 72.8410 } },
  { salonName: 'Mahogany Studio Malad',    location: 'Malad West',    area: 'Andheri',     rating: 4.4, reviewCount: 94,  service: 'Full Arms Waxing',      price: 499,  duration: '35 min', specialties: ['Nail Extensions', 'Hair Spa', 'Waxing'],      tags: ['Hygienic', 'Friendly'],                coordinates: { lat: 19.1860, lng: 72.8485 } },
]

function parseBudget(text = '', profileBudget = '') {
  const source = `${text} ${profileBudget}`.toLowerCase()
  const underMatch = source.match(/(?:under|below|less than|within|upto|up to)\s*₹?\s*([\d,]+)/)
  if (underMatch) return Number(underMatch[1].replace(/,/g, ''))
  const rupeeMatches = [...source.matchAll(/₹\s*([\d,]+)/g)].map(m => Number(m[1].replace(/,/g, '')))
  if (rupeeMatches.length) return Math.max(...rupeeMatches)
  const plainBudget = source.match(/budget\s*(?:is|of|:)?\s*([\d,]+)/)
  if (plainBudget) return Number(plainBudget[1].replace(/,/g, ''))
  return null
}

function detectIntent(text = '') {
  const lower = text.toLowerCase()
  const match = SERVICE_ALIASES.find(g => g.terms.some(t => lower.includes(t)))
  if (match) return match.intent
  if (/wedding|bridal|reception|sangeet|engagement|occasion/.test(lower)) return 'occasion_plan'
  return 'beauty_concierge'
}

function serviceMatches(serviceText, intent, message) {
  const lower = serviceText.toLowerCase()
  const query = message.toLowerCase()
  const alias = SERVICE_ALIASES.find(g => g.intent === intent)
  if (alias?.terms.some(t => lower.includes(t) || (query.includes(t) && lower.includes(intent)))) return true
  return query.split(/\s+/).some(w => w.length > 3 && lower.includes(w))
}

function withDistance(item, activeCoords) {
  if (!activeCoords || !item.coordinates) return item
  const toRad = v => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(item.coordinates.lat - activeCoords.lat)
  const dLng = toRad(item.coordinates.lng - activeCoords.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(activeCoords.lat)) * Math.cos(toRad(item.coordinates.lat)) * Math.sin(dLng / 2) ** 2
  return { ...item, distance: R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) }
}

function buildLocalServiceMatches(message, profileState, activeCoords) {
  const budget = parseBudget(message, profileState?.budget)
  const intent = detectIntent(message)
  const queryLocation = (profileState?.location || '').toLowerCase()

  const baseServices = localSalons.flatMap(salon =>
    (salon.services || []).map(service => ({
      salonName: salon.name, location: salon.location, area: salon.area,
      rating: salon.rating, reviewCount: salon.reviewCount,
      service: service.name, price: service.price, duration: service.duration,
      specialties: salon.specialties, tags: salon.tags, coordinates: salon.coordinates,
    }))
  )

  const allServices = [...baseServices, ...AFFORDABLE_SERVICES].map(item => withDistance(item, activeCoords))

  const filter = (locationRequired) => allServices.filter(item => {
    const intentOk = intent === 'beauty_concierge' || intent === 'occasion_plan' ||
      serviceMatches(`${item.service} ${(item.specialties || []).join(' ')} ${(item.tags || []).join(' ')}`, intent, message)
    const budgetOk = !budget || item.price <= budget
    const locationOk = !locationRequired || !queryLocation || queryLocation.includes('current gps') ||
      item.area?.toLowerCase().includes(queryLocation) || item.location?.toLowerCase().includes(queryLocation) ||
      queryLocation.includes(item.area?.toLowerCase())
    return intentOk && budgetOk && locationOk
  }).sort((a, b) => {
    if (typeof a.distance === 'number' && typeof b.distance === 'number' && a.distance !== b.distance) return a.distance - b.distance
    if (a.price !== b.price) return a.price - b.price
    return b.rating - a.rating
  })

  const located = filter(true).slice(0, 5)
  if (located.length >= 3) return located

  const broader = filter(false)
  return [...located, ...broader.filter(i => !located.some(l => l.salonName === i.salonName && l.service === i.service))]
    .slice(0, 5)
}

function formatServiceMatches(matches) {
  if (!matches.length) return 'No exact service-and-budget matches found in the GlowAI local dataset.'
  return matches.map((item, idx) =>
    `${idx + 1}. **${item.salonName}**\n` +
    `   - Service: ${item.service}\n` +
    `   - Rating: ⭐ ${item.rating} (${item.reviewCount} reviews)\n` +
    `   - Price: ₹${item.price}\n` +
    `   - Duration: ${item.duration}\n` +
    `   - Location: ${item.location}\n` +
    `   - Distance: ${typeof item.distance === 'number' ? `${item.distance.toFixed(1)} km away` : 'Ask user for area/GPS to calculate'}\n` +
    `   - Specialties: ${(item.specialties || []).join(', ')}`
  ).join('\n\n')
}

function buildLocalConciergeReply({ message, profileState, serviceMatches, detectedIntent, detectedBudget, locationName }) {
  const area = locationName && !locationName.toLowerCase().includes('current gps') ? locationName : 'your area'

  if (detectedIntent === 'occasion_plan') {
    const occasion = profileState?.occasion || message
    return (
      `✨ Absolutely. For ${occasion}, I would plan this in phases:\n\n` +
      `1. **Now:** decide the style direction, outfit neckline, hair length, and grooming priorities.\n` +
      `2. **3–4 weeks before:** book skin prep, hair consult, brows/beard shaping if needed, and a trial look.\n` +
      `3. **1 week before:** do final facial or clean-up, hair spa/trim, nails, and outfit-compatible styling.\n` +
      `4. **Event week:** keep treatments gentle, hydrate, and lock the final look.\n\n` +
      `For your profile, I would lean toward **${profileState?.stylePreference || 'a polished, camera-ready style'}** ` +
      `with a budget estimate of **${profileState?.budget || '₹3,000–₹8,000'}** depending on salon tier.\n\n` +
      `Would you like me to make this more bridal, minimal, celebrity-inspired, or clean professional?`
    )
  }

  if (serviceMatches.length > 0) {
    const introBudget = detectedBudget ? ` within ₹${detectedBudget}` : ''
    const lines = serviceMatches.slice(0, 3).map((item, idx) =>
      `${idx + 1}. **${item.salonName}**\n` +
      `   ⭐ ${item.rating}\n` +
      `   ${item.service} — ₹${item.price}\n` +
      `   ${typeof item.distance === 'number' ? `${item.distance.toFixed(1)} km away` : item.location}`
    )
    return (
      `✨ I found ${Math.min(serviceMatches.length, 3)} ${detectedIntent.replace('_', ' ')} option${serviceMatches.length === 1 ? '' : 's'} near ${area}${introBudget}:\n\n` +
      lines.join('\n\n') +
      `\n\nMy pick: start with the closest option if you want speed, or choose the highest-rated salon if finish and hygiene matter more.\n\n` +
      `Would you prefer:\n• Home service\n• Salon visit\n• A full package with add-ons`
    )
  }

  return (
    `✨ I can help with that. I could not find an exact salon-service match in the current GlowAI dataset for ${area}, ` +
    `so I need one detail before I recommend:\n\n` +
    `What matters most right now: lowest price, closest salon, highest rating, or a specific look?`
  )
}

// Stream a string sentence-by-sentence with a short delay between chunks.
// Gives the local fallback the same progressive UX as the OpenAI path.
async function streamLocalReply(res, text, userId) {
  // Split on sentence boundaries while preserving list items and line breaks
  const sentences = text.match(/[^.!?\n]+[.!?\n]?|\n+/g) || [text]
  let fullText = ''

  for (const sentence of sentences) {
    const trimmed = sentence
    if (!trimmed) continue
    fullText += trimmed
    res.write(`data: ${JSON.stringify({ text: trimmed })}\n\n`)
    // Small artificial delay so the client renders progressively
    await new Promise(resolve => setTimeout(resolve, 40))
  }

  if (userId) {
    await db.chatHistories.saveMessage(userId, { isUser: false, text: fullText.trim() })
  }
}

// Map OpenAI error codes / HTTP statuses to user-facing SSE error messages.
function openAIErrorMessage(err) {
  const status = err?.status || err?.statusCode
  const code   = err?.code || err?.error?.code

  if (status === 401 || code === 'invalid_api_key') {
    return 'Glow is not available right now — the AI service is not configured correctly. Please contact support.'
  }
  if (status === 429 || code === 'rate_limit_exceeded' || code === 'insufficient_quota') {
    return 'Glow is receiving too many requests right now. Please try again in a few seconds.'
  }
  if (status === 503 || status === 500) {
    return 'The AI service is temporarily unavailable. Please try again shortly.'
  }
  if (code === 'context_length_exceeded') {
    return 'This conversation has become too long. Please clear the chat and start fresh.'
  }
  return 'Glow is having trouble connecting right now. Please try again in a moment.'
}

// ─────────────────────────────────────────────────────────────────────────────
// handleChat — main SSE controller
// ─────────────────────────────────────────────────────────────────────────────

export const handleChat = async (req, res, next) => {
  const { userId, message, profileState, coords } = req.body

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' })
  }

  try {
    // ── 1. Fetch chat history from in-memory DB ────────────────────────────
    const dbHistory = userId ? await db.chatHistories.getHistory(userId) : []

    // Build OpenAI message array from history, capped to MAX_HISTORY_MESSAGES.
    // Trimming from the front keeps the most recent context.
    const rawMessages = dbHistory.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text }))
    const trimmedHistory = rawMessages.slice(-MAX_HISTORY_MESSAGES)

    // Save the incoming user message to history
    if (userId) {
      await db.chatHistories.saveMessage(userId, { isUser: true, text: message.trim() })
    }

    // The full messages array sent to OpenAI (system prompt prepended later)
    const apiMessages = [...trimmedHistory, { role: 'user', content: message.trim() }]

    // ── 2. Resolve location & fetch nearby salons ──────────────────────────
    let activeCoords = coords
    const locationName = profileState?.location || ''

    if (!activeCoords && locationName) {
      const geo = geocodeAddress(locationName)
      if (geo?.lat) activeCoords = { lat: geo.lat, lng: geo.lng }
    }

    // Resolve GPS coordinates to the nearest named Mumbai area
    let resolvedAreaName = profileState?.locationLabel || profileState?.location || ''
    if (activeCoords?.lat && (!resolvedAreaName || resolvedAreaName === 'Current GPS location')) {
      const area = nearestMumbaiArea(activeCoords.lat, activeCoords.lng)
      if (area) resolvedAreaName = area
    }
    if (!resolvedAreaName && locationName) {
      resolvedAreaName = locationName
    }

    let salonText = 'No nearby salons found or location not provided yet.'
    if (activeCoords?.lat) {
      try {
        const salonsData = await fetchGooglePlacesSalons(activeCoords.lat, activeCoords.lng, 5000)
        const analysisData = {
          faceShape:    { technicalClassification: profileState?.faceShape },
          hairAnalysis: { technicalClassification: profileState?.hairAnalysis },
          skinAnalysis: { technicalClassification: profileState?.skinAnalysis },
        }
        const profileData = {
          budgetRange: profileState?.budget   || '₹1,500–₹3,000',
          occasion:    profileState?.occasion || '',
          styleIntent: profileState?.userIntent || message,
        }
        const topSalons = rankSalons(salonsData, analysisData, profileData).slice(0, 4)
        if (topSalons.length > 0) {
          salonText = `[Salons near ${resolvedAreaName || 'your location'}]\n\n` + topSalons.map((s, idx) =>
            `${idx + 1}. **${s.name}**\n` +
            `   - Location: ${s.location}\n` +
            `   - Rating: ⭐ ${s.rating} (${s.reviewCount} reviews)\n` +
            `   - Distance: ${s.distance ? s.distance.toFixed(1) + ' km away' : 'N/A'}\n` +
            `   - Match Score: ${s.matchScore}% Match\n` +
            `   - Estimated Cost: Starting at ₹${s.priceFrom || 1500}\n` +
            `   - Specialties: ${s.specialties ? s.specialties.join(', ') : 'Styling'}\n` +
            `   - Match Reason: ${s.whyRecommended || ''}`
          ).join('\n\n')
        }
      } catch (err) {
        console.error('[handleChat] Salon fetch/rank error:', err.message)
      }
    } else if (resolvedAreaName) {
      // No GPS but we have an area name — look up coords and try local dataset
      const geo = geocodeAddress(resolvedAreaName)
      if (geo?.lat) {
        const areaCoords = { lat: geo.lat, lng: geo.lng }
        const areaMatches = buildLocalServiceMatches(message, { ...profileState, location: resolvedAreaName }, areaCoords)
        if (areaMatches.length > 0) {
          salonText = `[Local GlowAI salons near ${resolvedAreaName}]\n\n` + formatServiceMatches(areaMatches)
        }
      }
    }

    const detectedIntent   = detectIntent(message)
    const detectedBudget   = parseBudget(message, profileState?.budget)
    const localMatches     = buildLocalServiceMatches(message, profileState, activeCoords)
    const serviceMatchText = formatServiceMatches(localMatches)

    // ── 3. Build system prompt ─────────────────────────────────────────────
    const userProfileContext = {
      name:            profileState?.name            || 'Guest',
      faceShape:       profileState?.faceShape        || '',
      skinAnalysis:    profileState?.skinAnalysis      || '',
      hairAnalysis:    profileState?.hairAnalysis      || '',
      budget:          profileState?.budget            || '',
      location:        resolvedAreaName               || '',
      userIntent:      profileState?.userIntent || detectedIntent || '',
      stylePreference: profileState?.stylePreference   || '',
      occasion:        profileState?.occasion          || null,
      selfieAnalysis:  profileState?.selfieAnalysis    || null,
    }

    const hasSelfieData = !!(userProfileContext.faceShape || userProfileContext.skinAnalysis || userProfileContext.hairAnalysis)
    const selfieSection = hasSelfieData
      ? `Selfie Analysis Results (AI-detected, use these to personalise responses):
- Face Shape: ${userProfileContext.faceShape || 'not detected'}
- Skin Tone/Analysis: ${userProfileContext.skinAnalysis || 'not detected'}  
- Hair Type/Analysis: ${userProfileContext.hairAnalysis || 'not detected'}`
      : 'No selfie analysis data available yet. Encourage the user to do the AI beauty scan for personalised recommendations.'

    const locationSection = resolvedAreaName
      ? `User's Location: **${resolvedAreaName}** (GPS-verified Mumbai area)`
      : 'Location: Not yet provided. Ask the user for their Mumbai area if it would help with salon recommendations.'

    const systemPrompt = `You are Glow, the AI beauty concierge for GlowAI — Mumbai's premier beauty marketplace.

Your personality: warm, smart, slightly playful, Mumbai-aware. You are NOT a generic chatbot. You are a personal beauty advisor who knows Mumbai's salon scene intimately.

You help users with:
- Finding the right salons in their Mumbai area matched to their budget and service needs
- Personalised beauty and style recommendations based on their face shape, skin tone, hair type
- Bridal and occasion beauty planning with realistic timelines and budgets
- Service-specific recommendations (waxing, facials, hair, makeup, nails, massage, bridal)

CRITICAL RULES:
1. ALWAYS use the user's profile data when available. Start responses with personal context: "Since your face shape is [X] and you're in [Area]..."
2. For salon/service requests: ALWAYS recommend from the GlowAI service matches below. Include name, price, rating, location.
3. For bridal/occasion requests: Create a structured multi-phase plan with timing, treatments, estimated costs.
4. Budget detection: If user mentions a budget, find salons/services WITHIN that budget. Be specific about what ₹X covers.
5. Location: ALWAYS use the user's detected area for recommendations. Never recommend salons in random Mumbai areas.
6. Do NOT invent salons not in the GlowAI dataset. Only recommend real options from the data provided.
7. Do NOT give generic beauty advice. Be specific, actionable, and personal.
8. Keep responses chat-friendly (not too long), but genuinely useful.
9. If a service or budget/area combination has no matches, say so honestly and ask for more detail.
10. Do NOT identify celebrity lookalikes or claim the user resembles a real person.

${locationSection}

${selfieSection}

Full User Profile:
${JSON.stringify(userProfileContext, null, 2)}

Request Analysis:
- Detected Intent: ${detectedIntent}
- Budget Cap Detected: ${detectedBudget ? '₹' + detectedBudget : 'none mentioned'}
- Has GPS Coordinates: ${Boolean(activeCoords)}
- Service Matches Found: ${localMatches.length}

GlowAI Service Matches (use these for recommendations — do NOT invent new salons):
${serviceMatchText}

Nearby Salons ranked by GlowAI matching engine:
${salonText}`

    // ── 4. KEY CHECK — before any SSE headers are written ─────────────────
    // FIXED: the original code opened the SSE stream first, then checked the
    // key. This made it impossible to send a proper HTTP error response when
    // the key was missing in production (headers already sent).
    if (!config.groqApiKey) {
      if (isProduction) {
        // In production with no key: return a plain JSON 503.
        // The SSE stream has NOT been opened yet so this is safe.
        console.error('[handleChat] GROQ_API_KEY missing in production. Chat disabled.')
        return res.status(503).json({
          error: 'AI concierge is temporarily unavailable.',
          message: 'The AI service is not configured. Please contact support or try again later.',
        })
      }

      // ── Development fallback (no key) ────────────────────────────────────
      // Open SSE stream and deliver the local concierge reply sentence-by-sentence.
      if (res.headersSent) return
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      res.flushHeaders()

      const localReply = buildLocalConciergeReply({
        message,
        profileState,
        serviceMatches: localMatches,
        detectedIntent,
        detectedBudget,
        locationName: resolvedAreaName || locationName,
      })

      await streamLocalReply(res, localReply, userId)
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    // ── 5. OpenAI streaming path ───────────────────────────────────────────
    if (res.headersSent) return
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')   // disable Nginx/proxy buffering
    res.flushHeaders()

    const messages = [
      { role: 'system', content: systemPrompt },
      ...apiMessages,
    ]

    const stream = await groqClient.chat.completions.create({
      model:       config.groqModel,   // default: gpt-4o-mini
      messages,
      stream:      true,
      temperature: 0.8,
      max_tokens:  1024,
    })

    let fullText = ''
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || ''
      if (text) {
        fullText += text
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    if (userId && fullText.trim()) {
      await db.chatHistories.saveMessage(userId, { isUser: false, text: fullText.trim() })
    }

    res.write('data: [DONE]\n\n')
    res.end()

  } catch (err) {
    console.error('[handleChat] Error:', err?.message || err)

    const userMessage = openAIErrorMessage(err)

    if (!res.headersSent) {
      // Stream not yet open: send plain JSON error
      return res.status(err?.status || 500).json({ error: userMessage })
    }

    // Stream already open: send error via SSE so the frontend can display it
    try {
      res.write(`data: ${JSON.stringify({ error: userMessage })}\n\n`)
      res.write('data: [DONE]\n\n')
      res.end()
    } catch (_) {
      // Connection already closed by client — nothing to do
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getChatHistory / clearChatHistory
// ─────────────────────────────────────────────────────────────────────────────

export const getChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params
    if (!userId) return res.status(400).json({ error: 'userId is required.' })
    const history = await db.chatHistories.getHistory(userId)
    return res.status(200).json(history)
  } catch (err) {
    next(err)
  }
}

export const clearChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params
    if (!userId) return res.status(400).json({ error: 'userId is required.' })
    await db.chatHistories.clearHistory(userId)
    return res.status(200).json({ success: true, message: 'Chat history cleared.' })
  } catch (err) {
    next(err)
  }
}