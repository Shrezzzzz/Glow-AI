import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BeautyProfileProvider } from './context/BeautyProfileContext'
import LandingPage        from './pages/LandingPage'
import BeautyProfileSetup from './pages/BeautyProfileSetup'
import AIAnalysis         from './pages/AIAnalysis'
import BeautyDashboard    from './pages/BeautyDashboard'
import SalonMarketplace   from './pages/SalonMarketplace'
import SalonDetail        from './pages/SalonDetail'
import BudgetOptimizer    from './pages/BudgetOptimizer'
import BridalPlanner      from './pages/BridalPlanner'
import AtHomeServices     from './pages/AtHomeServices'
import PremiumExperiences from './pages/PremiumExperiences'
import BookingPage        from './pages/BookingPage'
import BookingConfirmation from './pages/BookingConfirmation'
import Login              from './pages/Auth/Login'
import Register           from './pages/Auth/Register'
import ForgotPassword     from './pages/Auth/ForgotPassword'
import ResetPassword      from './pages/Auth/ResetPassword'
import UserProfile        from './pages/UserProfile'
import CompareReports     from './pages/CompareReports'
import GlowChatbot        from './components/GlowChatbot'
import LuxuryCursorDust   from './components/LuxuryCursorDust'

export default function App() {
  return (
    <AuthProvider>
      <BeautyProfileProvider>
        <Routes>
          <Route path="/"                  element={<LandingPage />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/forgot-password"   element={<ForgotPassword />} />
          <Route path="/reset-password"    element={<ResetPassword />} />
          <Route path="/profile"           element={<UserProfile />} />
          <Route path="/compare"           element={<CompareReports />} />
          <Route path="/profile-setup"     element={<BeautyProfileSetup />} />
          <Route path="/analyzing"         element={<AIAnalysis />} />
          <Route path="/dashboard"         element={<BeautyDashboard />} />
          <Route path="/salons"            element={<SalonMarketplace />} />
          <Route path="/salons/:id"        element={<SalonDetail />} />
          <Route path="/budget"            element={<BudgetOptimizer />} />
          <Route path="/bridal"            element={<BridalPlanner />} />
          <Route path="/at-home"           element={<AtHomeServices />} />
          <Route path="/experiences"       element={<PremiumExperiences />} />
          <Route path="/booking"           element={<BookingPage />} />
          <Route path="/booking/confirmed" element={<BookingConfirmation />} />
        </Routes>
        <GlowChatbot />
        <LuxuryCursorDust />
      </BeautyProfileProvider>
    </AuthProvider>
  )
}