import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import GlobalLogo from './GlobalLogo';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text-m)' }}>
      {/* Navigation Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b" style={{ background: '#fff', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-8">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <GlobalLogo size="md" />
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-semibold">
            <Link to="/features" className="hover:text-primary transition-colors">Features</Link>
            <Link to="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link to="/blog" className="hover:text-primary transition-colors">Blog</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm px-6 rounded-full shadow-md shadow-primary/20">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold hover:text-primary transition-colors">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm px-6 rounded-full shadow-md shadow-primary/20">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full bg-white">
        <Outlet />
      </main>

      {/* SEO Footer */}
      <footer className="py-12 border-t mt-auto" style={{ background: '#f8fafc', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <GlobalLogo size="sm" />
            <p className="mt-4 text-sm text-gray-500">
              AI-powered resume optimization and smart job application tracker. Beat the ATS and land your dream job faster.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/features" className="hover:text-primary">Features</Link></li>
              <li><Link to="/success-stories" className="hover:text-primary">Success Stories</Link></li>
              <li><Link to="/pricing" className="hover:text-primary">Pricing</Link></li>
              <li><Link to="/register" className="hover:text-primary">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Company & Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-primary">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-primary">Blog</Link></li>
              <li><Link to="/resources" className="hover:text-primary">Resource Center</Link></li>
              <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-primary">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/seo-dashboard" className="text-gray-300 hover:text-gray-400 text-xs mt-4 block">SEO Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Jobright AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
