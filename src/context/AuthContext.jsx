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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
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
        },
      })

      if (error) {
        console.error('Registration error:', error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        console.log('Registration successful:', data.user.email)
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
    try {
      console.log('Logging out user')
      
      // Clear local state first
      setUser(null)
      setProfile(null)
      
      // Sign out from Supabase (this clears the session)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
        return { success: false, error: error.message }
      }

      // Verify session is cleared
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.warn('Session still exists after logout, forcing clear')
        // Force clear by removing from storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token')
        }
      }
      
      console.log('Logout successful')
      return { success: true }
    } catch (error) {
      console.error('Logout exception:', error)
      // Clear state even on exception
      setUser(null)
      setProfile(null)
      // Try to clear storage anyway
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
      }
      return { success: false, error: error.message || 'An unexpected error occurred' }
    }
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

