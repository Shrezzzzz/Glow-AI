import { motion } from 'framer-motion'
import { Star, MapPin, CheckCircle2, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ProfessionalCard({ professional }) {
  const navigate = useNavigate()
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="card-luxury p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative shrink-0">
          <img src={professional.image} alt={professional.name} className="w-16 h-16 rounded-2xl object-cover" />
          {professional.verified && (
            <CheckCircle2 size={16} className="text-glow-gold absolute -bottom-1 -right-1 bg-white rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-playfair text-base font-semibold text-glow-black truncate">{professional.name}</h3>
          <p className="font-inter text-xs text-glow-gold mb-1">{professional.role}</p>
          <div className="flex items-center gap-1">
            <Star size={11} className="text-glow-gold fill-glow-gold" />
            <span className="font-inter text-xs font-semibold text-glow-black">{professional.rating}</span>
            <span className="font-inter text-xs text-glow-muted">({professional.reviewCount})</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3">
        <MapPin size={11} className="text-glow-muted" />
        <span className="font-inter text-xs text-glow-muted">{professional.location}</span>
      </div>

      <p className="font-inter text-xs text-glow-muted leading-relaxed mb-4 line-clamp-2">{professional.bio}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {professional.services.slice(0, 3).map((s) => (
          <span key={s} className="text-xs font-inter bg-glow-border text-glow-muted px-2 py-0.5 rounded-full">{s}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-glow-border">
        <div>
          <span className="font-inter text-xs text-glow-muted block">{professional.experience}</span>
          <span className="font-inter text-sm font-semibold text-glow-black">From ₹{professional.priceFrom.toLocaleString()}</span>
        </div>
        <button onClick={() => navigate('/booking')} className="btn-gold py-2 px-4 text-xs">
          <Calendar size={12} /> Book
        </button>
      </div>
    </motion.div>
  )
}