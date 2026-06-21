import { useEffect, useRef } from 'react'

const COLORS = ['#D4AF6A', '#E4C488', 'rgba(212,175,106,0.4)']
const MAX_PARTICLES = 60

export default function LuxuryCursorDust() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touchOnly = window.matchMedia('(hover: none)').matches
    if (reduceMotion || touchOnly) return undefined

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const particles = []
    let frameId = 0
    let lastEmit = 0

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const addParticle = (x, y) => {
      if (particles.length >= MAX_PARTICLES) particles.shift()
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.34,
        vy: -0.18 - Math.random() * 0.42,
        size: 1 + Math.random() * 2,
        life: 0,
        ttl: 1000 + Math.random() * 900,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })
    }

    const onMove = (event) => {
      const now = performance.now()
      if (now - lastEmit < 34) return
      lastEmit = now
      addParticle(event.clientX, event.clientY)
      if (Math.random() > 0.55) {
        addParticle(event.clientX + (Math.random() - 0.5) * 8, event.clientY + (Math.random() - 0.5) * 8)
      }
    }

    const draw = (time) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i]
        particle.life += 16.67
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vx += (Math.random() - 0.5) * 0.01

        const progress = particle.life / particle.ttl
        if (progress >= 1) {
          particles.splice(i, 1)
          continue
        }

        const alpha = Math.max(0, (1 - progress) * 0.45)
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
      }

      frameId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMove, { passive: true })
    frameId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="luxury-dust-canvas" aria-hidden="true" />
}
