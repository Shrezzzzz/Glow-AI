import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import MainLayout from '../layouts/MainLayout'
import ProfessionalCard from '../components/ProfessionalCard'
import SectionHeader from '../components/SectionHeader'
import { professionals } from '../data/professionals'

const ROLES = ['All', 'Hairstylist', 'Makeup Artist', 'Skincare', 'Nail Artist', 'Color Expert', 'Wellness']

export default function AtHomeServices() {
  const [query, setQuery] = useState('')
  const [role,  setRole]  = useState('All')

  const filtered = professionals.filter((p) => {
    const qm = p.name.toLowerCase().includes(query.toLowerCase()) || p.role.toLowerCase().includes(query.toLowerCase())
    const rm = role === 'All' || p.role.toLowerCase().includes(role.toLowerCase())
    return qm && rm
  })

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            badge="Doorstep Luxury"
            title="At-Home Beauty Services"
            subtitle="Mumbai's most skilled beauty professionals come to you. Premium service, your space, your schedule."
          />

          <div className="relative mb-6">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-glow-muted" />
            <input
              type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search professionals by name or specialty…"
              className="w-full pl-11 pr-4 py-3.5 border border-glow-border rounded-full font-inter text-sm text-glow-black bg-glow-surface outline-none focus:border-glow-gold transition-colors shadow-card"
            />
            {query && <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2"><X size={14} className="text-glow-muted" /></button>}
          </div>

          <div className="flex flex-wrap gap-2.5 mb-8">
            {ROLES.map((r) => (
              <button key={r} onClick={() => setRole(r)} className={`px-4 py-2 rounded-full border font-inter text-xs transition-all duration-200 ${role === r ? 'bg-glow-gold text-white border-glow-gold' : 'bg-glow-surface border-glow-border text-glow-muted hover:border-glow-gold'}`}>
                {r}
              </button>
            ))}
          </div>

          <p className="font-inter text-sm text-glow-muted mb-6">
            Showing <span className="font-semibold text-glow-black">{filtered.length}</span> professionals
          </p>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((pro, i) => (
                <motion.div key={pro.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <ProfessionalCard professional={pro} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="font-playfair text-xl text-glow-muted">No professionals match your search.</p>
              <button onClick={() => { setQuery(''); setRole('All') }} className="btn-gold mt-5">Clear Filters</button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}