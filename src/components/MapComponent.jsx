import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Navigation } from 'lucide-react'

export default function MapComponent({ userCoords, salons = [], onSelectSalon }) {
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  // Inject Leaflet JS & CSS dynamically from CDN
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true)
      return
    }

    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(cssLink)

    const jsScript = document.createElement('script')
    jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    jsScript.async = true
    jsScript.onload = () => {
      setLeafletLoaded(true)
    }
    jsScript.onerror = () => console.error('Failed to load Leaflet script from CDN')
    document.body.appendChild(jsScript)

    return () => {
      // Clean up injected files on final unmount if desired, or keep cached
    }
  }, [])

  // Initialize and Update Map
  useEffect(() => {
    if (!leafletLoaded || !userCoords) return

    const L = window.L
    
    // Clear old map instance if it exists
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    // Initialize map
    const map = L.map('leaflet-salon-map', {
      zoomControl: false,
      attributionControl: false
    }).setView([userCoords.lat, userCoords.lng], 13)

    mapRef.current = map

    // Add zoom controls to the bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map)

    // Attributions
    L.control.attribution({
      position: 'bottomleft'
    }).addTo(map)

    // CartoDB Dark Matter tile layer for premium dark aesthetics
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map)

    // Add User Location Circle Marker
    L.circleMarker([userCoords.lat, userCoords.lng], {
      radius: 9,
      color: '#fff',
      weight: 2,
      fillColor: '#3b82f6', // bright blue for user
      fillOpacity: 0.95
    }).addTo(map)
      .bindPopup(`<div class="font-inter text-xs font-semibold text-slate-800">Your Location</div>`)

    // Add Salon Markers
    markersRef.current = []
    salons.forEach(salon => {
      if (!salon.coordinates || isNaN(salon.coordinates.lat) || isNaN(salon.coordinates.lng)) return

      const markerColor = salon.matchScore >= 90 ? '#eab308' : '#c5a880' // Gold for top matches, soft gold for others
      const marker = L.circleMarker([salon.coordinates.lat, salon.coordinates.lng], {
        radius: 7,
        color: '#fff',
        weight: 1.5,
        fillColor: markerColor,
        fillOpacity: 0.9
      })

      const popupHtml = `
        <div class="font-inter p-1.5 max-w-[200px]">
          <h4 class="font-playfair font-semibold text-glow-black text-sm mb-0.5">${salon.name}</h4>
          <p class="text-[11px] text-gray-500 mb-1">${salon.location}</p>
          <div class="flex items-center justify-between">
            <span class="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">${salon.matchScore}% Match</span>
            <span class="text-[10px] text-gray-400 font-medium">${salon.distance.toFixed(1)} km</span>
          </div>
        </div>
      `

      marker.addTo(map)
        .bindPopup(popupHtml, { closeButton: false })
        .on('click', () => {
          if (onSelectSalon) {
            onSelectSalon(salon)
          }
        })

      markersRef.current.push(marker)
    })

    // Auto fit map bounds if we have salons
    if (salons.length > 0) {
      const points = [
        [userCoords.lat, userCoords.lng],
        ...salons.map(s => [s.coordinates.lat, s.coordinates.lng])
      ]
      map.fitBounds(points, { padding: [40, 40] })
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [leafletLoaded, userCoords, salons])

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-luxury border border-glow-border/40 bg-glow-black/5">
      {!leafletLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-glow-surface/80 backdrop-blur-md z-10">
          <div className="w-8 h-8 rounded-full border-2 border-glow-gold border-t-transparent animate-spin mb-3"></div>
          <p className="font-inter text-xs text-glow-muted">Initializing Map Experience…</p>
        </div>
      )}
      <div id="leaflet-salon-map" className="w-full h-full z-0"></div>

      {/* Floating Info Overlay */}
      <div className="absolute top-4 left-4 bg-glow-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 text-white max-w-xs z-10 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={14} className="text-blue-400 animate-pulse" />
          <span className="font-inter text-xs font-semibold uppercase tracking-wider text-blue-300">Live Radius Map</span>
        </div>
        <p className="font-inter text-[11px] text-white/70">
          Showing salons matching your style profile. Drag and scroll the map to explore details.
        </p>
      </div>
    </div>
  )
}
