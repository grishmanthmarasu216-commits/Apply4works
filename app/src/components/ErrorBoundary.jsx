import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 min-h-[50vh]">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-gray-900">Oops! Something went wrong.</h2>
            <p className="text-gray-600 mb-6 text-sm">
              We encountered an unexpected error while processing this page. This often happens if some data is temporarily missing or structured unexpectedly.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-primary w-full shadow-md"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </button>
              
              <Link to="/jobs" className="btn btn-outline w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Return to Jobs
              </Link>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 text-left bg-gray-50 p-4 rounded text-xs text-red-600 overflow-auto max-h-32 border">
                <strong>{this.state.error?.toString()}</strong>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
