import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'

export default function SalonCard({ salon }) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => navigate(`/salons/${salon.id}`)}
      className="card-luxury overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img 
          src={salon.image} 
          alt={salon.name} 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-glow-black/56 via-glow-black/8 to-transparent" />
        {salon.badge && (
          <span className="absolute top-3 left-3 bg-glow-black/82 backdrop-blur-md border border-glow-gold/30 text-glow-gold text-xs font-inter font-semibold px-2.5 py-1 rounded-full">
            {salon.badge}
          </span>
        )}
        {salon.verified && (
          <span className="absolute top-3 right-3 bg-white/92 backdrop-blur-sm border border-glow-gold/20 text-xs font-inter px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 size={11} className="text-glow-gold" /> Verified
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1.5">
          <h3 className="font-playfair text-base font-semibold text-glow-black leading-snug">{salon.name}</h3>
          <span className="font-inter text-sm text-glow-muted ml-2 shrink-0">{salon.priceRange}</span>
        </div>

        <div className="flex items-center gap-1 mb-2.5">
          <MapPin size={12} className="text-glow-gold" />
          <span className="font-inter text-xs text-glow-muted">{salon.location}</span>
        </div>

        <div className="flex items-center gap-2 mb-3.5">
          <Star size={12} className="text-glow-gold fill-glow-gold" />
          <span className="font-inter text-sm font-semibold text-glow-black">{salon.rating}</span>
          <span className="font-inter text-xs text-glow-muted">({salon.reviewCount} reviews)</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {salon.specialties.slice(0, 3).map((s) => (
            <span key={s} className="text-xs font-inter bg-glow-champagne text-glow-muted border border-glow-gold/10 px-2.5 py-0.5 rounded-full">{s}</span>
          ))}
        </div>

        {salon.matchScore && (
          <div className="mb-4 p-2.5 bg-glow-champagne/70 border border-glow-gold/20 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-glow-gold"></span>
              <span className="font-inter text-[10px] font-bold text-glow-gold uppercase tracking-widest">GlowAI Match {salon.matchScore}%</span>
            </div>
            <p className="font-inter text-[11px] text-glow-muted leading-relaxed italic">
              "{salon.whyRecommended}"
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-glow-border">
          <span className="font-inter text-xs text-glow-muted">
            {salon.distance ? `${salon.distance.toFixed(1)} km • ` : ''}From ₹{salon.priceFrom.toLocaleString()}
          </span>
          <button onClick={(e) => { e.stopPropagation(); navigate('/booking') }} className="btn-gold py-2 px-4 text-xs">Book Now</button>
        </div>
      </div>
    </motion.div>
  )
}
