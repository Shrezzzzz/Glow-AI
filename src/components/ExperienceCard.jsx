import { motion } from 'framer-motion'
import { Star, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ExperienceCard({ experience }) {
  const navigate = useNavigate()
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => navigate('/experiences')}
      className="card-luxury overflow-hidden cursor-pointer group"
    >
      <div className="relative h-60 overflow-hidden">
        <img src={experience.image} alt={experience.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-glow-black/88 via-glow-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <span className="text-xs font-inter text-glow-gold uppercase tracking-widest mb-1 block">{experience.category}</span>
          <h3 className="font-playfair text-lg font-semibold text-white leading-tight">{experience.title}</h3>
        </div>
        <span className="absolute top-3 right-3 bg-glow-black/82 backdrop-blur-md border border-glow-gold/30 text-glow-gold text-sm font-inter font-semibold px-3 py-1 rounded-full">
          ₹{experience.price.toLocaleString()}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={12} className="text-glow-gold fill-glow-gold" />
            <span className="font-inter text-sm font-semibold">{experience.rating}</span>
            <span className="font-inter text-xs text-glow-muted">({experience.bookings} booked)</span>
          </div>
          <div className="flex items-center gap-1 text-glow-muted">
            <Clock size={12} />
            <span className="font-inter text-xs">{experience.duration}</span>
          </div>
        </div>
        <p className="font-inter text-xs text-glow-muted leading-relaxed line-clamp-2 mb-4">{experience.description}</p>
        <button className="flex items-center gap-2 text-glow-gold font-inter text-sm font-semibold group-hover:gap-3 transition-all duration-300">
          Explore <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}
