import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../utils/supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize: Listen for auth state changes
  useEffect(() => {
    const initAuth = async () => {
      // Always clear all Supabase storage on page load to prevent ghost sessions
      // This ensures users start with a clean state unless they explicitly log in
      if (typeof window !== 'undefined') {
        console.log('Clearing all Supabase storage on initialization...')
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token')) {
            console.log('Removing:', key)
            localStorage.removeItem(key)
          }
        })
        localStorage.removeItem('supabase.auth.token')
        
        // Also clear sessionStorage
        try {
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              console.log('Removing sessionStorage:', key)
              sessionStorage.removeItem(key)
            }
          })
        } catch (e) {
          console.warn('Error clearing sessionStorage:', e)
        }
      }
      
      // Force Supabase to sign out to clear internal state
      try {
        await supabase.auth.signOut()
        console.log('Supabase signOut completed')
      } catch (e) {
        console.warn('signOut during cleanup failed:', e)
      }
      
      // After clearing, check if there's a valid session
      // If user just logged in, the session will be re-established by onAuthStateChange
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session check after cleanup:', { sessionUser: session?.user?.email })
      
      if (session?.user) {
        // Session exists - user is logged in (this should be rare after cleanup)
        console.log('Valid session found for:', session.user.email)
        setUser(session.user)
        loadUserProfile(session.user.id)
      } else {
        // No session - user is not logged in (default state)
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    }
    
    initAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      // Ignore SIGNED_IN events if localStorage was cleared (ghost sessions)
      if (event === 'SIGNED_IN' && session?.user) {
        const hasStorage = typeof window !== 'undefined' && 
          Object.keys(localStorage).some(key => 
            key.startsWith('sb-') || 
            key === 'supabase.auth.token' || 
            key.includes('supabase') || 
            key.includes('auth-token')
          )
        
        if (!hasStorage) {
          console.log('Ghost session detected, ignoring SIGNED_IN event and forcing signOut')
          try {
            await supabase.auth.signOut()
          } catch (e) {
            console.warn('signOut during ghost cleanup failed:', e)
          }
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
      }
      
      if (session?.user) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load user profile from Supabase
  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        // Profile might not exist yet, that's okay
        return
      }

      if (data) {
        console.log('Loaded profile from Supabase:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('Login successful:', data.user.email)
        // Profile will be loaded by onAuthStateChange listener
        return { success: true, user: data.user }
      }

      return { success: false, error: 'Login failed' }
    } catch (error) {
      console.error('Login exception:', error)
      return { success: false, error: error.message || 'An unexpected error occurred' }
    }
  }

  const register = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0],
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/UBC_GO_V1/login` : undefined,
        },
      })

      if (error) {
        console.error('Registration error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('Registration successful:', data.user.email)
        
        // Check if email confirmation is required
        if (data.session === null && data.user) {
          // Email confirmation required
          return { 
            success: true, 
            user: data.user,
            requiresConfirmation: true,
            message: 'Please check your email to confirm your account before logging in.'
          }
        }
        
        // Profile will be auto-created by trigger, and loaded by onAuthStateChange
        return { success: true, user: data.user }
      }

      return { success: false, error: 'Registration failed' }
    } catch (error) {
      console.error('Registration exception:', error)
      return { success: false, error: error.message || 'An unexpected error occurred' }
    }
  }

  const logout = async () => {
    console.log('Logging out user - initiating nuclear logout')
    
    // Step 1: Reset state immediately to prevent UI updates
    setUser(null)
    setProfile(null)
    
    // Step 2: Sign out from Supabase
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signOut error:', error)
      } else {
        console.log('Supabase signOut successful')
      }
    } catch (error) {
      console.error('Supabase signOut exception:', error)
    }
    
    // Step 3: Nuclear Option - Force clear ALL Supabase traces from localStorage
    if (typeof window !== 'undefined') {
      // First, explicitly remove our configured storage key
      localStorage.removeItem('supabase.auth.token')
      console.log('Removed configured storage key: supabase.auth.token')
      
      const keysToRemove = []
      // Collect all keys to remove
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth-token'))) {
          keysToRemove.push(key)
        }
      }
      
      // Remove all collected keys
      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
        console.log('Removed storage key:', key)
      })
      
      // Also try to clear sessionStorage just in case
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            sessionStorage.removeItem(key)
            console.log('Removed sessionStorage key:', key)
          }
        }
      } catch (e) {
        console.warn('Error clearing sessionStorage:', e)
      }
    }
    
    console.log('Logout complete, storage cleared')
    
    // Step 4: Force a hard redirect to home page with a small delay to ensure cleanup completes
    if (typeof window !== 'undefined') {
      // Use setTimeout to ensure all cleanup completes before redirect
      setTimeout(() => {
        window.location.replace('/UBC_GO_V1/')
      }, 100)
    }
    
    return { success: true }
  }

  const updateProfile = async (updatedUserData) => {
    if (!user) {
      console.error('Cannot update profile: no user logged in')
      return { success: false, error: 'No user logged in' }
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updatedUserData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return { success: false, error: error.message }
      }

      if (data) {
        console.log('Profile updated successfully:', data)
        setProfile(data)
        return { success: true, profile: data }
      }

      return { success: false, error: 'Update failed' }
    } catch (error) {
      console.error('Update profile exception:', error)
      return { success: false, error: error.message || 'An unexpected error occurred' }
    }
  }

  const value = {
    user,
    profile,
    login,
    register,
    logout,
    updateProfile,
    loading,
    isAuthenticated: !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

