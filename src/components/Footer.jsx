import { useState } from 'react'
import { Sparkles, Instagram, Twitter, Youtube } from 'lucide-react'
import AboutGlowModal from './AboutGlowModal'

const COL1 = ['Find Salons', 'Premium Experiences', 'Bridal Planner', 'At-Home Services', 'Budget Optimizer']
const COL2 = ['For Salons', 'Privacy Policy', 'Terms of Service', 'Contact Us']

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  return (
    <footer className="bg-glow-black text-white luxury-ambient border-t border-glow-gold/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white/5 border border-glow-gold/30 rounded-full flex items-center justify-center">
                <Sparkles size={15} className="text-glow-gold" />
              </div>
              <span className="font-playfair text-xl font-semibold text-glow-gold">GlowAI</span>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="ml-3 px-3 py-1 bg-white/5 hover:bg-white/10 border border-glow-gold/15 rounded-full font-inter text-xs text-white/45 hover:text-glow-gold transition-colors duration-300"
              >
                [ About GlowAI ]
              </button>
            </div>
            <p className="font-inter text-sm text-white/55 leading-relaxed max-w-xs">
              Mumbai's AI-powered beauty concierge. Discover salons, stylists, and premium beauty experiences personalized to your profile.
            </p>
            <div className="flex gap-3 mt-6">
              {[Instagram, Twitter, Youtube].map((Icon, i) => (
                <button key={i} className="w-9 h-9 border border-white/15 rounded-full flex items-center justify-center text-white/45 hover:border-glow-gold hover:text-glow-gold hover:bg-white/5 transition-all duration-300">
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-inter text-xs uppercase tracking-widest mb-5 text-glow-gold">Explore</h4>
            <ul className="space-y-3">
              {COL1.map((i) => (
                <li key={i}><a href="#" className="font-inter text-sm text-white/48 hover:text-glow-gold transition-colors duration-300">{i}</a></li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-inter text-xs uppercase tracking-widest mb-5 text-glow-gold">Support</h4>
            <ul className="space-y-3">
              {COL2.map((i) => (
                <li key={i}><a href="#" className="font-inter text-sm text-white/48 hover:text-glow-gold transition-colors duration-300">{i}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-glow-gold/12 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-inter text-xs text-white/35">© 2026 GlowAI Mumbai. All rights reserved.</p>
          <p className="font-inter text-xs text-white/35 flex items-center gap-1.5">
            Made with <span className="text-glow-gold">♥</span> in Mumbai
          </p>
        </div>
      </div>

      <AboutGlowModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </footer>
  )
}
