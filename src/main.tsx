import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const CLERK_PUBLISHABLE_KEY = 
  import.meta.env.CLERK_PUBLISHABLE_KEY || 
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 
  'pk_test_aGlyZW1pbmQtYWktNTkuY2xlcmsuYWNjb3VudHMuZGV2JA'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6 font-sans select-text">
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-red-500/10 blur-[80px] pointer-events-none" />
          <div className="relative max-w-md w-full border border-red-500/20 bg-[#0f0f1a]/85 backdrop-blur-xl p-8 rounded-2xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">Engine Initialization Failed</h2>
              <p className="text-sm text-slate-400">
                HireMind AI failed to initialize the authentication service. This is usually due to an invalid or missing Clerk Publishable Key.
              </p>
            </div>
            <div className="text-left font-mono text-[11px] bg-black/40 border border-white/5 p-4 rounded-lg text-red-400 overflow-auto max-h-40">
              {this.state.error?.message || "Unknown Initialization Error"}
            </div>
            <div className="space-y-3 pt-2 text-xs text-slate-500">
              <p>To resolve this, please run in your terminal:</p>
              <div className="bg-black/30 p-2.5 rounded border border-white/5 select-all text-indigo-400 font-mono text-center">
                clerk init --app app_3ELeH1no5hL3iXUPazhQJpidqid
              </div>
              <p>Or configure <code className="text-slate-300">CLERK_PUBLISHABLE_KEY</code> in your <code className="text-slate-300">.env.local</code> file.</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('welcome-screen-seen');
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-[0.98] text-white font-medium rounded-xl shadow-lg transition-all text-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <QueryClientProvider client={queryClient}>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(15, 15, 26, 0.95)',
                  color: '#f1f5f9',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: '#0f0f1a' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#0f0f1a' },
                },
              }}
            />
          </QueryClientProvider>
        </ClerkProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)
