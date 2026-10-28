import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import Landing         from './pages/Landing'
import Login           from './pages/Login'
import Register        from './pages/Register'
import OnboardingPage  from './pages/OnboardingPage'
import Dashboard       from './pages/Dashboard'
import DailyJobs       from './pages/DailyJobs'
import JobDetail       from './pages/JobDetail'
import JobResumeOptimizer from './pages/JobResumeOptimizer'
import ResumeBuilderV2   from './pages/ResumeBuilderV2'
import Applications    from './pages/Applications'
import ErrorBoundary   from './components/ErrorBoundary'

import Pricing         from './pages/Pricing'
import Knowledge       from './pages/Knowledge'
import LinkedInGrowth  from './pages/LinkedInGrowth'
import UserVoice       from './pages/UserVoice'

import { HelmetProvider } from 'react-helmet-async'
import PublicLayout from './components/PublicLayout'
import About from './pages/seo/About'
import Features from './pages/seo/Features'
import Privacy from './pages/seo/Privacy'
import Terms from './pages/seo/Terms'
import BlogListing from './pages/blog/BlogListing'
import BlogPost from './pages/blog/BlogPost'
import ResourceCenter from './pages/seo/ResourceCenter'
import FAQHub from './pages/seo/FAQHub'
import ProfessionPage from './pages/seo/ProfessionPage'
import IndustryLanding from './pages/seo/IndustryLanding'
import SuccessStories from './pages/seo/SuccessStories'
import ContentDashboard from './pages/seo/ContentDashboard'

// Requires login only (used for Pricing page)
function PricingRoute({ children }) {
  const { isLoggedIn, currentUser, isLoading } = useAuth()
  if (isLoading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  
  if (currentUser?.pricingCompleted !== false) {
    if (currentUser?.onboardingCompleted === false) return <Navigate to="/onboarding" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

// Requires login AND pricingCompleted (used for Onboarding)
function OnboardingRoute({ children }) {
  const { isLoggedIn, currentUser, isLoading } = useAuth()
  if (isLoading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  
  // TEMP PAYMENT BYPASS FOR DEVELOPMENT
  // if (currentUser?.pricingCompleted === false) return <Navigate to="/pricing" replace />
  
  if (currentUser?.onboardingCompleted !== false) return <Navigate to="/dashboard" replace />
  return children
}

// Requires login AND onboardingCompleted
// NOTE: Only redirect to /onboarding when onboardingCompleted is *explicitly* false (boolean).
//       null / undefined / missing means the user is set up — avoids the landing-page redirect loop.
function AppRoute({ children }) {
  const { isLoggedIn, currentUser, isLoading } = useAuth()
  if (isLoading) return null
  if (!isLoggedIn) return <Navigate to="/login" replace />
  
  // TEMP PAYMENT BYPASS FOR DEVELOPMENT
  // if (currentUser?.pricingCompleted === false) return <Navigate to="/pricing" replace />

  // Only redirect when the field is explicitly set to false — prevents redirect loops
  // caused by undefined / null onboardingCompleted values in legacy accounts
  if (currentUser && currentUser.onboardingCompleted === false) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}

// Redirect logged-in users away from login/register
function GuestRoute({ children }) {
  const { isLoggedIn, currentUser, isLoading } = useAuth()
  if (isLoading) return null
  if (isLoggedIn) {
    if (currentUser?.pricingCompleted === false) return <Navigate to="/pricing" replace />
    if (currentUser?.onboardingCompleted === false) return <Navigate to="/onboarding" replace />
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Public SEO & Content Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/blog" element={<BlogListing />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/resources" element={<ResourceCenter />} />
        <Route path="/faq" element={<FAQHub />} />
        <Route path="/resume-keywords/:profession" element={<ProfessionPage />} />
        <Route path="/resume-builder-for-:industry" element={<IndustryLanding />} />
        <Route path="/success-stories" element={<SuccessStories />} />
        <Route path="/seo-dashboard" element={<ContentDashboard />} />
      </Route>

      {/* Pricing — needs login but no plan yet */}
      <Route path="/pricing"  element={<PricingRoute><Pricing /></PricingRoute>} />
      <Route path="/payment"  element={<AppRoute><Pricing /></AppRoute>} />

      {/* Auth — needs login & plan, but NOT necessarily prefs yet */}
      <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

      {/* Protected — needs login + plan + prefs */}
      <Route path="/dashboard"       element={<AppRoute><Dashboard /></AppRoute>} />
      <Route path="/jobs"            element={<AppRoute><DailyJobs /></AppRoute>} />
      <Route path="/jobs/:id"        element={<AppRoute><JobDetail /></AppRoute>} />
      <Route path="/jobs/:id/resume-optimizer"  element={<AppRoute><JobResumeOptimizer /></AppRoute>} />
      <Route path="/resume-builder"  element={<AppRoute><ResumeBuilderV2 /></AppRoute>} />
      <Route path="/resume"          element={<Navigate to="/resume-builder" replace />} />
      {/* /jobs/:id/optimizer-v2 removed — Optimize For Job lives inside Resume Builder right panel */}
      <Route path="/applications"    element={<AppRoute><Applications /></AppRoute>} />
      <Route path="/knowledge"       element={<AppRoute><Knowledge /></AppRoute>} />
      <Route path="/linkedin-growth" element={<AppRoute><LinkedInGrowth /></AppRoute>} />
      <Route path="/user-voice"      element={<AppRoute><UserVoice /></AppRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </HelmetProvider>
  )
}