import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowLeft, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import MainLayout from '../layouts/MainLayout'
import { getAnalysisHistory } from '../services/storageService'

export default function CompareReports() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [report1Id, setReport1Id] = useState('')
  const [report2Id, setReport2Id] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchHistory = async () => {
      const data = await getAnalysisHistory(user.id)
      setHistory(data)
      if (data.length >= 2) {
        setReport1Id(data[0].analysisId)
        setReport2Id(data[1].analysisId)
      }
      setLoading(false)
    }
    fetchHistory()
  }, [user, navigate])

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-32 pb-16 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-glow-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      </MainLayout>
    )
  }

  if (history.length < 2) {
    return (
      <MainLayout>
        <div className="min-h-screen pt-32 pb-16 px-4 text-center">
          <h2 className="font-playfair text-2xl font-semibold text-glow-black mb-4">Compare Reports</h2>
          <p className="font-inter text-glow-muted">You need at least 2 saved analyses to compare.</p>
          <button onClick={() => navigate('/profile')} className="btn-outline-gold mt-6">Back to Profile</button>
        </div>
      </MainLayout>
    )
  }

  const report1 = history.find(h => h.analysisId === report1Id)
  const report2 = history.find(h => h.analysisId === report2Id)

  const renderComparisonRow = (label, val1, val2) => {
    const isDifferent = val1 !== val2
    return (
      <div className="grid grid-cols-3 gap-4 py-4 border-b border-glow-border last:border-0">
        <div className="font-inter text-sm font-semibold text-glow-muted flex items-center">{label}</div>
        <div className={`font-inter text-sm p-3 rounded-xl ${isDifferent ? 'bg-glow-surface' : 'bg-transparent'}`}>
          {val1}
        </div>
        <div className={`font-inter text-sm p-3 rounded-xl ${isDifferent ? 'bg-glow-gold/10 text-glow-black font-medium' : 'bg-transparent'}`}>
          {val2}
        </div>
      </div>
    )
  }

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <MainLayout>
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-2 font-inter text-sm text-glow-muted hover:text-glow-black mb-6 transition-colors">
              <ArrowLeft size={15} /> Back to Profile
            </button>
            <span className="inline-flex items-center gap-2 text-glow-gold font-inter text-xs uppercase tracking-widest mb-2">
              <ArrowLeftRight size={12} /> Analysis Comparison
            </span>
            <h1 className="font-playfair text-3xl font-medium text-glow-black">
              Compare Your Reports
            </h1>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="col-start-2">
              <label className="font-inter text-xs font-semibold text-glow-muted uppercase tracking-widest block mb-2">Report A</label>
              <select 
                value={report1Id} 
                onChange={(e) => setReport1Id(e.target.value)}
                className="w-full border border-glow-border rounded-xl px-4 py-2 font-inter text-sm outline-none focus:border-glow-gold"
              >
                {history.map(h => (
                  <option key={h.analysisId} value={h.analysisId}>{formatDate(h.timestamp)} - {h.styleIntent || 'General'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-inter text-xs font-semibold text-glow-muted uppercase tracking-widest block mb-2">Report B</label>
              <select 
                value={report2Id} 
                onChange={(e) => setReport2Id(e.target.value)}
                className="w-full border border-glow-border rounded-xl px-4 py-2 font-inter text-sm outline-none focus:border-glow-gold"
              >
                {history.map(h => (
                  <option key={h.analysisId} value={h.analysisId}>{formatDate(h.timestamp)} - {h.styleIntent || 'General'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Table */}
          {report1 && report2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-luxury p-6">
              
              <h3 className="font-playfair text-lg font-semibold text-glow-black mb-4 mt-2">Physical Analysis</h3>
              {renderComparisonRow('Face Shape', report1.faceAnalysis?.technicalClassification, report2.faceAnalysis?.technicalClassification)}
              {renderComparisonRow('Hair Type', report1.hairAnalysis?.technicalClassification, report2.hairAnalysis?.technicalClassification)}
              {renderComparisonRow('Skin Tone', report1.skinAnalysis?.technicalClassification, report2.skinAnalysis?.technicalClassification)}

              <h3 className="font-playfair text-lg font-semibold text-glow-black mb-4 mt-8">Intent & Preferences</h3>
              {renderComparisonRow('Style Intent', report1.styleIntent || 'None', report2.styleIntent || 'None')}
              {renderComparisonRow('Occasion', report1.occasion || 'None', report2.occasion || 'None')}
              {renderComparisonRow('Budget Range', report1.budgetRange || 'None', report2.budgetRange || 'None')}

              <h3 className="font-playfair text-lg font-semibold text-glow-black mb-4 mt-8">Recommendations</h3>
              {renderComparisonRow(
                'Top Character Match', 
                report1.recommendations?.characterLooks?.[0]?.characterName || 'N/A', 
                report2.recommendations?.characterLooks?.[0]?.characterName || 'N/A'
              )}
              {renderComparisonRow(
                'Top Hairstyle', 
                report1.recommendations?.recommendedHairstyles?.[0] || 'N/A', 
                report2.recommendations?.recommendedHairstyles?.[0] || 'N/A'
              )}
            </motion.div>
          )}

        </div>
      </div>
    </MainLayout>
  )
}
