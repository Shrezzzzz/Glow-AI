import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const MainLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-glow-bg relative">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
)

export default MainLayout
