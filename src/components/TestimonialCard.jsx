import { Star } from 'lucide-react'

export default function TestimonialCard({ testimonial }) {
  return (
    <div className="card-luxury p-7 flex flex-col gap-4 h-full relative overflow-hidden">
      <span className="absolute -top-4 right-6 font-playfair text-8xl text-glow-gold/16 leading-none">“</span>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => <Star key={i} size={13} className="text-glow-gold fill-glow-gold" />)}
      </div>
      <p className="font-playfair text-lg italic text-glow-ink/82 leading-relaxed flex-1 relative z-10">
        "{testimonial.review}"
      </p>
      <div className="flex items-center gap-3 pt-3 border-t border-glow-border">
        <img src={testimonial.avatar} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-glow-gold/30" />
        <div>
          <p className="font-inter text-sm font-semibold text-glow-ink">{testimonial.name}</p>
          <p className="font-inter text-xs text-glow-muted">{testimonial.role}</p>
        </div>
      </div>
    </div>
  )
}
