import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import { BookProvider } from './context/BookContext.jsx'
import Layout from './components/layout/Layout.jsx'
import ProtectedRoute from './components/layout/ProtectedRoute.jsx'
import CookieConsent from './components/legal/CookieConsent.jsx'
import Admin from './pages/Admin.jsx'

const Landing        = lazy(() => import('./pages/Landing.jsx'))
const CreateBook     = lazy(() => import('./pages/CreateBook.jsx'))
const Preview        = lazy(() => import('./pages/Preview.jsx'))
const Checkout       = lazy(() => import('./pages/Checkout.jsx'))
const Dashboard      = lazy(() => import('./pages/Dashboard.jsx'))
// Admin is imported directly (not lazy) to avoid Suspense/HMR issues
const ReadPage       = lazy(() => import('./pages/ReadPage.jsx'))
const Login          = lazy(() => import('./pages/Login.jsx'))
const Register       = lazy(() => import('./pages/Register.jsx'))
const Account        = lazy(() => import('./pages/Account.jsx'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'))
const ResetPassword  = lazy(() => import('./pages/ResetPassword.jsx'))
const Privacy        = lazy(() => import('./pages/Privacy.jsx'))

const PageLoader = () => (
  <div className="min-h-screen bg-bg-primary flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      <p className="text-cream text-sm">Loading...</p>
    </div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Public */}
                <Route index element={<Landing />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="read/:bookId/:pageNumber" element={<ReadPage />} />
                <Route path="privacy" element={<Privacy />} />

                {/* Protected */}
                <Route element={<ProtectedRoute />}>
                  <Route path="create" element={<CreateBook />} />
                  <Route path="preview/:bookId" element={<Preview />} />
                  <Route path="checkout/:bookId" element={<Checkout />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="account" element={<Account />} />
                  <Route path="admin" element={<Admin />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <CookieConsent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1E2A4A',
                color: '#F5EDD6',
                border: '1px solid #C9A84C',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#4CAF82', secondary: '#1E2A4A' } },
              error:   { iconTheme: { primary: '#E85454', secondary: '#1E2A4A' } },
            }}
          />
        </BookProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
