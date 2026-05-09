import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const isFullscreen = ['/create', '/preview', '/checkout'].some((p) =>
    pathname.startsWith(p)
  )

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />
      <main className={`flex-1 ${isFullscreen ? '' : ''}`}>
        <Outlet />
      </main>
      {!isFullscreen && <Footer />}
    </div>
  )
}
