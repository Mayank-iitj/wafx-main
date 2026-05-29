import { SignUp } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Bot } from 'lucide-react'

export function SignupPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="bg-orb-1" />
      <div className="bg-orb-3" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-brand">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">HireMind AI</span>
          </Link>
          <p className="text-secondary text-sm">Create your recruiter account with Clerk</p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="w-full flex justify-center">
          <SignUp 
            routing="hash"
            signInUrl="/login"
            appearance={{
              variables: {
                colorPrimary: '#6366f1',
                colorBackground: '#111122',
                colorInputBackground: '#0a0a0f',
                colorText: '#f1f5f9',
                colorTextSecondary: '#94a3b8',
                colorInputText: '#f1f5f9',
                colorBorder: 'rgba(99, 102, 241, 0.15)',
              },
              elements: {
                card: 'border border-white/5 bg-[#111122]/90 backdrop-blur-md shadow-2xl rounded-2xl',
                headerTitle: 'text-primary font-bold',
                headerSubtitle: 'text-secondary',
                socialButtonsBlockButton: 'bg-white/5 border border-white/10 hover:bg-white/10 text-primary',
                formButtonPrimary: 'btn-primary bg-indigo-600 hover:bg-indigo-500 border-none',
                footerActionLink: 'text-brand-400 hover:text-brand-300',
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  )
}
