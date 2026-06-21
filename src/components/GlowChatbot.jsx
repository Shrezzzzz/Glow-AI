/**
 * GlowChatbot.jsx — Fixed & Production-Ready
 *
 * Fixes applied:
 *  1. Z-Index: wrapper is z-[9999], above Navbar (z-50) and all page content
 *  2. Transparency: chat drawer uses solid #0F0F10 background, NO backdrop-blur
 *  3. ChatMessage: solid bg colours for both user and bot bubbles
 *  4. Backend: correct port 5001, proper error display
 *  5. Location: proactive request on open, area detection, manual fallback
 *  6. Duplicate prevention: disabled state while request in-flight
 *  7. Loading indicator: animated typing dots
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MapPin, Sparkles, Loader2, Trash2, MessageSquare, X, Navigation } from 'lucide-react'
import { useBeautyProfile } from '../context/BeautyProfileContext'
import { useAuth } from '../context/AuthContext'
import ChatMessage from './ChatMessage'
import { MUMBAI_AREA_GROUPS, nearestMumbaiArea } from '../data/mumbaiAreas'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
const CHAT_TIMEOUT_MS = 30_000

function firstValue(...values) {
  return values.find(v => v !== undefined && v !== null && v !== '') || null
}

const DEFAULT_GREETING = (name, area) => {
  const who = name ? `Hi ${name}!` : `Hi there!`
  const loc = area ? ` I can see you're near **${area}** — I'll focus recommendations there.` : ''
  return `${who} I'm Glow ✨${loc}\n\nTell me what you need — an occasion, a service, a budget, or just a vibe:\n\n*"Bridal makeup under ₹5000 in Andheri"*\n*"Best facial near me this weekend"*`
}

export default function GlowChatbot() {
  const {
    isChatOpen, setIsChatOpen,
    chatHistory, setChatHistory,
    profile, form, setForm, analysis,
  } = useBeautyProfile()

  const { user } = useAuth()
  const [input, setInput]         = useState('')
  const [isTyping, setIsTyping]   = useState(false)

  // Location state: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
  const [locationState, setLocationState]   = useState('idle')
  const [coords, setCoords]                 = useState(null)
  const [detectedArea, setDetectedArea]     = useState('')
  const [selectedArea, setSelectedArea]     = useState('')
  const [showAreaPicker, setShowAreaPicker] = useState(false)

  const messagesEndRef = useRef(null)
  const abortRef       = useRef(null)
  const locationAsked  = useRef(false)

  const suggestedPrompts = [
    { label: '✨ Wedding Look',       text: 'I have a wedding next month — help me plan my complete look.' },
    { label: '✨ Korean Glass Skin',  text: 'Recommend a Korean Glass Skin facial near me.' },
    { label: '✨ Bridal Package',     text: 'What does a complete bridal package include for hair & makeup?' },
    { label: '✨ Under ₹3000',        text: 'Best salons and services near me under ₹3000.' },
    { label: '✨ Nearby Salons',      text: 'Show me the best salons near my current location.' },
    { label: '✨ Hair Makeover',      text: 'Recommend a hair makeover based on my face shape.' },
  ]

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [chatHistory, isTyping, scrollToBottom])

  // Fetch history on login
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) {
        setChatHistory([{ id: 'init', isUser: false, text: DEFAULT_GREETING(null, detectedArea || selectedArea) }])
        return
      }
      try {
        const res = await fetch(`${API_BASE}/api/chat/history/${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setChatHistory(
            data?.length > 0
              ? data
              : [{ id: 'init', isUser: false, text: DEFAULT_GREETING(user.name, detectedArea || selectedArea) }]
          )
        }
      } catch (err) {
        console.error('[GlowChatbot] history fetch error:', err)
      }
    }
    fetchHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // ── Location ───────────────────────────────────────────────────────────────
  const requestLocation = useCallback((silent = false) => {
    if (locationAsked.current) return
    if (!navigator.geolocation) {
      setLocationState('unavailable')
      if (!silent) setShowAreaPicker(true)
      return
    }
    locationAsked.current = true
    setLocationState('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCoords({ lat, lng })
        setLocationState('granted')
        const area = nearestMumbaiArea(lat, lng)
        if (area) {
          setDetectedArea(area)
          setChatHistory(prev => {
            const copy = [...prev]
            const idx = copy.findIndex(m => m.id === 'init')
            if (idx !== -1) copy[idx] = { ...copy[idx], text: DEFAULT_GREETING(user?.name, area) }
            return copy
          })
        }
      },
      () => {
        setLocationState('denied')
        locationAsked.current = false
        if (!silent) setShowAreaPicker(true)
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }, [user?.name, setChatHistory])

  // Request location when drawer opens
  useEffect(() => {
    if (isChatOpen && locationState === 'idle') {
      const t = setTimeout(() => requestLocation(true), 500)
      return () => clearTimeout(t)
    }
    if (isChatOpen && locationState === 'denied' && !selectedArea) {
      setShowAreaPicker(true)
    }
  }, [isChatOpen, locationState, selectedArea, requestLocation])

  const effectiveArea = detectedArea || selectedArea

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (customText) => {
    const text = typeof customText === 'string' ? customText.trim() : input.trim()
    if (!text || isTyping) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setInput('')

    if (locationState === 'idle') requestLocation(true)
    if (!form.userIntent) setForm(prev => ({ ...prev, userIntent: text }))

    const userMsgId = `u_${Date.now()}`
    const botMsgId  = `b_${Date.now()}`
    setChatHistory(prev => [...prev, { id: userMsgId, isUser: true, text }])
    setIsTyping(true)

    const timeoutId = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS)

    try {
      const profileState = {
        name:            firstValue(user?.name, form?.name, profile?.name) || 'Guest',
        faceShape:       firstValue(analysis?.faceShape?.technicalClassification, profile?.faceShape) || '',
        skinAnalysis:    firstValue(analysis?.skinAnalysis?.technicalClassification, profile?.skinTone) || '',
        hairAnalysis:    firstValue(analysis?.hairAnalysis?.technicalClassification, profile?.hairType) || '',
        userIntent:      form.userIntent || text,
        location:        effectiveArea || (locationState === 'granted' ? 'Current GPS location' : ''),
        locationLabel:   effectiveArea ? `${effectiveArea}, Mumbai` : '',
        budget:          firstValue(form.budgetRange, profile?.budgetRange) || '',
        occasion:        firstValue(form.occasion, profile?.occasion) || '',
        stylePreference: firstValue(form.styleProfile, profile?.stylePreference) || '',
        selfieAnalysis: analysis ? {
          faceShape: analysis?.faceShape?.technicalClassification,
          skinTone:  analysis?.skinAnalysis?.technicalClassification,
          hairType:  analysis?.hairAnalysis?.technicalClassification,
        } : null,
      }

      const res = await fetch(`${API_BASE}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  controller.signal,
        body: JSON.stringify({ userId: user?.id || null, message: text, profileState, coords }),
      })

      if (!res.ok) {
        let errMsg = 'Glow is unavailable right now — please try again.'
        try {
          const body = await res.json()
          if (body?.message) errMsg = body.message
          else if (body?.error) errMsg = body.error
        } catch (_) {}
        setChatHistory(prev => [...prev, { id: botMsgId, isUser: false, text: errMsg }])
        return
      }

      if (!res.body) throw new Error('SSE not supported')

      // Add placeholder bot message
      setChatHistory(prev => [...prev, { id: botMsgId, isUser: false, text: '' }])

      const reader   = res.body.getReader()
      const decoder  = new TextDecoder('utf-8')
      let botText    = ''
      let streamDone = false

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value, { stream: true }).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') { streamDone = true; break }
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              botText += parsed.text
              setChatHistory(prev => {
                const copy = [...prev]
                const i = copy.findIndex(m => m.id === botMsgId)
                if (i !== -1) copy[i] = { ...copy[i], text: botText }
                return copy
              })
            }
            if (parsed.error) {
              setChatHistory(prev => {
                const copy = [...prev]
                const i = copy.findIndex(m => m.id === botMsgId)
                if (i !== -1) copy[i] = { ...copy[i], text: parsed.error }
                return copy
              })
              streamDone = true
              break
            }
          } catch (_) {}
        }
      }

    } catch (err) {
      clearTimeout(timeoutId)
      const msg = err.name === 'AbortError'
        ? 'Glow took too long to respond. Please try again.'
        : `Glow couldn't reach the server. Make sure the backend is running on port 5001.`

      setChatHistory(prev => {
        const copy = [...prev]
        const i = copy.findIndex(m => m.id === botMsgId)
        if (i !== -1) return copy.map((m, idx) => idx === i ? { ...m, text: msg } : m)
        return [...copy, { id: botMsgId, isUser: false, text: msg }]
      })
    } finally {
      clearTimeout(timeoutId)
      setIsTyping(false)
    }
  }, [input, isTyping, locationState, form, profile, analysis, user, effectiveArea, coords, setChatHistory, setForm, requestLocation])

  const handleClear = useCallback(async () => {
    abortRef.current?.abort()
    setChatHistory([{ id: 'init', isUser: false, text: DEFAULT_GREETING(user?.name, effectiveArea) }])
    if (user?.id) {
      try { await fetch(`${API_BASE}/api/chat/history/${user.id}`, { method: 'DELETE' }) } catch (_) {}
    }
  }, [user?.id, user?.name, effectiveArea, setChatHistory])

  const handleOpen = useCallback(() => setIsChatOpen(true), [setIsChatOpen])

  const locationLabel = (() => {
    if (locationState === 'requesting') return '⏳ Getting location…'
    if (detectedArea) return `📍 ${detectedArea}`
    if (selectedArea) return `📍 ${selectedArea}`
    if (locationState === 'granted') return '📍 GPS Active'
    if (locationState === 'denied') return '📍 Set area ↑'
    return '📍 Location pending'
  })()

  return (
    <>
      {/* ── FULL-SCREEN OVERLAY when chat is open ────────────────────────── */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            key="chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/40"
            onClick={() => setIsChatOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── CHAT WIDGET (above overlay) ──────────────────────────────────── */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              key="chat-drawer"
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.94 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ backgroundColor: '#0F0F10' }}
              className="w-[390px] max-w-[calc(100vw-1.5rem)] h-[580px] max-h-[calc(100vh-6rem)] border border-yellow-600/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-4"
              onClick={e => e.stopPropagation()}
            >
              {/* ── Header ── */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0" style={{ backgroundColor: '#1a1a1b' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-yellow-500/40 flex items-center justify-center" style={{ backgroundColor: '#1f1f20' }}>
                    <Sparkles size={15} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-playfair text-sm font-semibold text-white leading-none">Glow</p>
                    <p className="text-[9px] text-yellow-400/80 tracking-widest uppercase font-inter mt-0.5">
                      Your Beauty Concierge ✨
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { locationAsked.current = false; requestLocation(false) }}
                    title="Set location"
                    className={`p-1.5 rounded-full transition-colors hover:bg-white/10 ${locationState === 'granted' ? 'text-yellow-400' : 'text-white/40'}`}
                  >
                    <Navigation size={14} />
                  </button>
                  <button onClick={handleClear} title="Clear chat" className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setIsChatOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* ── Location requesting banner ── */}
              {locationState === 'requesting' && (
                <div className="px-4 py-2 border-b border-yellow-600/15 flex items-center gap-2 shrink-0" style={{ backgroundColor: 'rgba(234,179,8,0.08)' }}>
                  <Loader2 size={11} className="text-yellow-400 animate-spin shrink-0" />
                  <p className="text-[10px] text-yellow-300/80 font-inter">Detecting your Mumbai area for personalised picks…</p>
                </div>
              )}

              {/* ── Location denied — area picker ── */}
              {(locationState === 'denied' || locationState === 'unavailable' || showAreaPicker) && !selectedArea && (
                <div className="p-3 border-b border-orange-500/20 shrink-0" style={{ backgroundColor: 'rgba(249,115,22,0.08)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-orange-300 font-inter font-medium">
                      {locationState === 'denied'
                        ? '📍 Location denied — pick your Mumbai area:'
                        : '📍 Where in Mumbai are you?'}
                    </p>
                    {showAreaPicker && (
                      <button onClick={() => setShowAreaPicker(false)} className="text-white/30 hover:text-white/60">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const area = e.target.value
                      if (!area) return
                      setSelectedArea(area)
                      setShowAreaPicker(false)
                      setChatHistory(prev => {
                        const copy = [...prev]
                        const i = copy.findIndex(m => m.id === 'init')
                        if (i !== -1) copy[i] = { ...copy[i], text: DEFAULT_GREETING(user?.name, area) }
                        return copy
                      })
                    }}
                    style={{ backgroundColor: '#1a1a1b', color: 'white' }}
                    className="w-full border border-white/20 text-[11px] font-inter rounded-xl px-3 py-2 focus:outline-none focus:border-yellow-500/50 appearance-none"
                  >
                    <option value="" disabled>Select your Mumbai area…</option>
                    {MUMBAI_AREA_GROUPS.map(group => (
                      <optgroup key={group.region} label={group.region}>
                        {group.areas.map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ backgroundColor: '#0F0F10' }}>
                {chatHistory.map(msg => (
                  <ChatMessage key={msg.id} message={msg.text} isUser={msg.isUser} />
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full border border-yellow-500/40 flex items-center justify-center shrink-0" style={{ backgroundColor: '#1a1a1b' }}>
                      <Sparkles size={13} className="text-yellow-400" />
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm" style={{ backgroundColor: '#1e1d1a' }}>
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Suggested prompts ── */}
              <div className="px-3 py-2 border-t border-white/8 shrink-0" style={{ backgroundColor: '#141414' }}>
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {suggestedPrompts.map(p => (
                    <button
                      key={p.label}
                      onClick={() => handleSend(p.text)}
                      disabled={isTyping}
                      style={{ backgroundColor: '#1e1e1f', borderColor: 'rgba(212,175,106,0.2)', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}
                      className="flex-shrink-0 px-3 py-1.5 border rounded-full font-inter text-[10px] hover:border-yellow-500/50 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Input ── */}
              <div className="px-3 pb-3 pt-2 border-t border-white/8 shrink-0" style={{ backgroundColor: '#141414' }}>
                <form onSubmit={e => { e.preventDefault(); handleSend() }} className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Glow about beauty, salons, budget…"
                    disabled={isTyping}
                    style={{ backgroundColor: '#1a1a1b', color: 'white', borderColor: 'rgba(255,255,255,0.15)' }}
                    className="w-full border rounded-full py-2.5 pl-4 pr-12 font-inter text-xs placeholder-white/30 focus:outline-none focus:border-yellow-500/50 transition-colors disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    style={{ backgroundColor: '#1a1a1b', borderColor: 'rgba(212,175,106,0.35)' }}
                    className="absolute right-1.5 w-8 h-8 border text-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={12} className="ml-0.5" />
                  </button>
                </form>

                {/* Location indicator */}
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <button
                    onClick={() => { locationAsked.current = false; requestLocation(false) }}
                    className={`flex items-center gap-1 text-[9px] font-inter transition-colors ${effectiveArea ? 'text-yellow-400/70 hover:text-yellow-400' : 'text-white/25 hover:text-white/50'}`}
                  >
                    <MapPin size={8} />
                    <span>{locationLabel}</span>
                  </button>
                  <span className="text-[9px] text-white/20 font-inter">GlowAI Concierge v2.0</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FAB ── */}
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleOpen}
          style={{ backgroundColor: '#0F0F10', borderColor: 'rgba(212,175,106,0.4)' }}
          className="border w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-2xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all duration-300 hover:bg-yellow-600"
        >
          <MessageSquare size={19} className="text-yellow-400" />
          <span className="text-[9px] font-inter font-medium text-white/70 mt-0.5">Glow</span>
        </motion.button>
      </div>
    </>
  )
}
