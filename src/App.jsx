import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import BlockAppsPage from './pages/BlockAppsPage'
import { ThemeProvider } from './contexts/ThemeContext'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('App component mounted')
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session:', session)
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session)
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  console.log('App render - loading:', loading, 'session:', session)

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Routes>
            <Route
              path="/auth"
              element={!session ? <AuthPage /> : <Navigate to="/" />}
            />
            <Route
              path="/"
              element={session ? <Dashboard /> : <Navigate to="/auth" />}
            />
            <Route
              path="/block-apps"
              element={session ? <BlockAppsPage /> : <Navigate to="/auth" />}
            />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
