'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import { Inter } from 'next/font/google'
import { Unbounded } from 'next/font/google'
import Image from 'next/image'
import { motion } from 'motion/react'
import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'

const unbounded = Unbounded({
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isInformational, setIsInformational] = useState(false)
  const router = useRouter()
  
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword, error, clearError } = useAuth()

  // Check if form is valid (both fields filled)
  const isFormValid = email.trim() !== '' && password.trim() !== ''

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setIsInformational(false)

    try {
      const result = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (result.success) {
        // Check if it's an informational message (like email confirmation)
        if (result.isInformational) {
          setIsInformational(true)
        } else {
          router.push('/dashboard')
        }
      } else {
        setIsInformational(false)
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setIsInformational(false)
    }
  }

  const handleGoogleSignIn = async () => {
    clearError()
    setIsInformational(false)
    
    try {
      const result = await signInWithGoogle()
      if (result.success) {
        // OAuth redirect will handle navigation
      }
    } catch (error) {
      console.error('Google sign-in error:', error)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      // We can't directly set error here, so we'll show an alert or return early
      alert('Please enter your email address first.')
      return
    }

    clearError()
    setIsInformational(false)

    try {
      const result = await resetPassword(email)
      if (result.isInformational) {
        setIsInformational(true)
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setIsInformational(false)
    }
  }

  // Show loading state for initial auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1D1D1D]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-[rgba(250,250,250,0.6)]">Processing your request...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1D1D1D]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Autocomplete dropdown styling */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px rgba(139,92,246,0.2) inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        
        /* Firefox autocomplete styling */
        input:-moz-autofill {
          background-color: rgba(139,92,246,0.2) !important;
          color: white !important;
        }
        
        /* Autocomplete dropdown list styling */
        input::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
        
        /* Custom autocomplete dropdown */
        input::-webkit-autofill {
          background-color: rgba(139,92,246,0.2) !important;
        }
        
        /* For the dropdown suggestions themselves */
        input::-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px rgba(139,92,246,0.2) inset !important;
        }
      `,
        }}
      />

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Sidebar - Maintains original proportion (roughly 2/3 of screen) */}
        <div className="w-2/3 relative">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <div className="relative z-10 flex flex-col h-full p-[100px]">
            {/* Flow Brand */}
            <motion.div 
              className="flex items-center"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                ease: "easeOut",
                delay: 0.2
              }}
            >
              <Image
                src="/logo-no-bg.png"
                alt="Flow logo"
                width={48}
                height={48}
                className="w-[48px] h-[48px]"
              />
              <span
                className={`font-bold text-xl text-white ml-[] ${unbounded.className}`}
              >
                FLOW
              </span>
            </motion.div>

            {/* Content - Centered in remaining space */}
            <div className="flex-1 flex flex-col justify-center">
              <motion.div 
                className="text-neutral-50 mb-6"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 1.0, 
                  ease: "easeOut",
                  delay: 0.6
                }}
              >
                <motion.div
                  className={`font-light text-4xl lg:text-5xl xl:text-6xl leading-tight mb-1 ${inter.className}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeOut",
                    delay: 0.8
                  }}
                >
                  <span>Get a </span>
                  <span className="text-white">hold</span>
                  <span> of your</span>
                </motion.div>
                <motion.div
                  className={`font-bold text-4xl lg:text-5xl xl:text-6xl leading-tight ${inter.className}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeOut",
                    delay: 1.0
                  }}
                >
                  {'productivity'}
                </motion.div>
              </motion.div>
              <motion.p
                className={`text-lg lg:text-xl text-[rgba(240,240,240,0.8)] leading-relaxed ${inter.className}`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 0.8, 
                  ease: "easeOut",
                  delay: 1.2
                }}
              >
                {'Let us do the boring tasks for you.'}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Auth Form Side - Maintains original proportion (roughly 1/3 of screen) */}
        <div className="w-1/3 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-white mb-2 leading-tight">
                Sign in to your account
              </h2>
            </div>

            {/* Auth Form */}
            <div>
              <div className="bg-[#242424] rounded-xl p-6 shadow-lg">
                {error && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    isInformational || error.includes('Please check your email') || error.includes('confirmation')
                      ? 'bg-[#8b5cf6]/30'
                      : 'bg-red-900/30'
                  }`}>
                    <p className={`text-sm ${
                      isInformational || error.includes('Please check your email') || error.includes('confirmation')
                        ? 'text-white'
                        : 'text-red-400'
                    }`}>{error}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-[rgba(250,250,250,0.6)] mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[#2d2d2d] rounded-lg outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent text-white placeholder-transition-all duration-300"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-[rgba(250,250,250,0.6)] mb-1"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#2d2d2d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent text-white placeholder-[rgba(250,250,250,0.6)] transition-all duration-300"
                      placeholder="Enter your password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isFormValid || loading}
                    className={`w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2 focus:ring-offset-[#242424] transition-all duration-300 text-white ${
                      isFormValid && !loading
                        ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] cursor-pointer'
                        : 'bg-[#8b5cf6] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                  </button>
                </form>

                <div className="my-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[rgba(250,250,250,0.36)]" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-[#242424] text-[rgba(250,250,250,0.6)]">
                        or
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleGoogleSignIn}
                  className="w-full bg-[#3c3c3c] text-white py-2 px-4 rounded-lg hover:bg-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2 focus:ring-offset-[#242424] flex items-center justify-center space-x-2"
                  title="Opens Google sign-in in a popup window"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button 
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full bg-[#2d2d2d] text-white py-2 px-4 rounded-lg hover:bg-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2 focus:ring-offset-[#242424] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? 'Sending...' : 'Forgot password'}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p
                className={`text-sm text-[rgba(250,250,250,0.6)] ${inter.className}`}
              >
                {isLogin
                  ? "Don't have an account? "
                  : 'Already have an account? '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#8b5cf6] hover:text-[#7c3aed]"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2 leading-tight">
              Sign in to your account
            </h2>
          </div>

          {/* Auth Form */}
          <div>
            <div className="bg-[#242424] rounded-xl p-4 sm:p-6 shadow-lg">
              {error && (
                <div className={`mb-4 p-3 rounded-lg ${
                  isInformational || error.includes('Please check your email') || error.includes('confirmation')
                    ? 'bg-[#8b5cf6]/30'
                    : 'bg-red-900/30'
                }`}>
                  <p className={`text-sm ${
                    isInformational || error.includes('Please check your email') || error.includes('confirmation')
                      ? 'text-white'
                      : 'text-red-400'
                  }`}>{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email-mobile"
                    className="block text-sm font-medium text-[rgba(250,250,250,0.6)] mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email-mobile"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2d2d2d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent text-white placeholder-[rgba(250,250,250,0.6)] transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password-mobile"
                    className="block text-sm font-medium text-[rgba(250,250,250,0.6)] mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password-mobile"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2d2d2d] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent text-white placeholder-[rgba(250,250,250,0.6)] transition-all duration-300"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className={`w-full py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2 focus:ring-offset-[#242424] transition-all duration-300 text-white ${
                    isFormValid && !loading
                      ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] cursor-pointer'
                      : 'bg-[#8b5cf6] opacity-50 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              <div className="my-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[rgba(250,250,250,0.36)]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#242424] text-[rgba(250,250,250,0.6)]">
                      or
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                className="w-full bg-[#3c3c3c] text-white py-2 px-4 rounded-lg hover:bg-[#4a4a4a] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2 focus:ring-offset-[#242424] flex items-center justify-center space-x-2"
                title="Opens Google sign-in in a popup window"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC5"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button 
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full bg-[#2d2d2d] text-white py-2 px-4 rounded-lg hover:bg-[#3a3a3a] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:ring-offset-2 focus:ring-offset-[#242424] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Sending...' : 'Forgot password'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p
              className={`text-sm text-[rgba(250,250,250,0.6)] ${inter.className}`}
            >
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#8b5cf6] hover:text-[#7c3aed]"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
