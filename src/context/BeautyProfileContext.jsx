import { createContext, useContext, useState } from 'react'

const BeautyProfileContext = createContext(null)

export const BeautyProfileProvider = ({ children }) => {
  const [profile, setProfile]       = useState(null)
  const [analysis, setAnalysis]     = useState(null)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [aiScanSelfie, setAiScanSelfie] = useState(null)

  // Chatbot site-wide persistent states
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([
    {
      id: 'init',
      isUser: false,
      text: "Hi! I'm Glow ✨\n\nTell me what you need — an occasion, a service, a budget, or just a vibe. Like:\n\n*\"Bridal makeup under ₹5000 in Andheri\"*\n*\"Best facial near me this weekend\"*",
    }
  ])

  // Global location context — shared between chatbot and salon marketplace
  const [locationContext, setLocationContext] = useState({
    coords: null,           // { lat, lng }
    area: '',               // e.g. "Bandra West"
    state: 'idle',          // idle | requesting | granted | denied | unavailable
  })

  const openChat = () => setIsChatOpen(true)
  const openChatWithMessage = (message) => {
    setIsChatOpen(true)
    return message // caller can use this to pre-fill input
  }

  // Onboarding step and form state persistence
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [form, setForm] = useState({
    photo: null,
    photoPreview: null,
    photoSource: '',
    name: '',
    styleProfile: '',
    skinConcern: '',
    styleIntent: '',
    userIntent: '',
    occasion: '',
    inspirations: [],
    budgetRange: '',
  })

  const saveProfile  = (data) => setProfile(data)
  const saveAnalysis = (data) => { setAnalysis(data); setIsAnalyzed(true) }
  const saveAiScanSelfie = (data) => setAiScanSelfie(data)
  const clearAiScanSelfie = () => setAiScanSelfie(null)
  
  const clearProfile = () => { 
    setProfile(null)
    setAnalysis(null)
    setIsAnalyzed(false)
    setAiScanSelfie(null)
    setOnboardingStep(0)
    setForm({
      photo: null,
      photoPreview: null,
      photoSource: '',
      name: '',
      styleProfile: '',
      skinConcern: '',
      styleIntent: '',
      userIntent: '',
      occasion: '',
      inspirations: [],
      budgetRange: '',
    })
  }

  return (
    <BeautyProfileContext.Provider value={{ 
      profile, 
      analysis, 
      isAnalyzed, 
      aiScanSelfie,
      saveProfile, 
      saveAnalysis, 
      saveAiScanSelfie,
      clearAiScanSelfie,
      clearProfile,
      onboardingStep,
      setOnboardingStep,
      form,
      setForm,
      isChatOpen,
      setIsChatOpen,
      chatHistory,
      setChatHistory,
      openChat,
      openChatWithMessage,
      locationContext,
      setLocationContext,
    }}>
      {children}
    </BeautyProfileContext.Provider>
  )
}

export const useBeautyProfile = () => {
  const ctx = useContext(BeautyProfileContext)
  if (!ctx) throw new Error('useBeautyProfile must be inside BeautyProfileProvider')
  return ctx
}
