export default function SectionHeader({ badge, title, subtitle, center = true, dark = false }) {
  return (
    <div className={`mb-12 ${center ? 'text-center' : ''}`}>
      {badge && (
        <span className="inline-block font-inter text-xs uppercase tracking-widest text-glow-gold mb-3">
          {badge}
        </span>
      )}
      <h2 className={`font-playfair text-3xl md:text-4xl font-medium leading-tight mb-4 ${dark ? 'text-white' : 'text-glow-ink'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`font-inter text-base leading-relaxed ${center ? 'mx-auto' : ''} max-w-xl ${dark ? 'text-white/60' : 'text-glow-muted'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
