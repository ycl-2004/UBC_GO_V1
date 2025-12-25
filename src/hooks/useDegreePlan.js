import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * Custom hook for managing degree plans with Supabase
 * 
 * Features:
 * - CRUD operations for degree plans
 * - 3-plan quota limit per user
 * - Automatic state synchronization when switching plans
 * - Toast notifications for user feedback
 */
export const useDegreePlan = () => {
  const { user, isAuthenticated } = useAuth()
  const [plans, setPlans] = useState([])
  const [activePlan, setActivePlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Simple toast notification function
  const showToast = useCallback((message, type = 'success') => {
    // Create toast element
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : '#f44336'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `
    
    // Add animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(style)
    document.body.appendChild(toast)

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse'
      setTimeout(() => {
        document.body.removeChild(toast)
        document.head.removeChild(style)
      }, 300)
    }, 3000)
  }, [])

  // Load all plans for the current user
  const loadPlans = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPlans([])
      setActivePlan(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('degree_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      const plansData = data || []
      console.log('Loaded plans from Supabase:', plansData.map(p => ({
        id: p.id,
        plan_name: p.plan_name,
        faculty: p.faculty,
        major: p.major
      })))
      
      setPlans(plansData)

      // Set the first plan as active if no active plan is set
      if (plansData.length > 0 && !activePlan) {
        console.log('Setting first plan as active:', plansData[0])
        setActivePlan(plansData[0])
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading plans:', err)
      setError(err.message)
      setLoading(false)
      showToast('Failed to load plans', 'error')
    }
  }, [user, isAuthenticated, activePlan, showToast])

  // Load plans on mount and when user changes
  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  /**
   * Create a new plan
   * @param {string} name - Plan name
   * @param {string} faculty - Faculty key (e.g., 'arts', 'appliedScience')
   * @param {string} major - Major slug (e.g., 'electrical-engineering')
   * @returns {Promise<Object>} Created plan object
   * @throws {Error} If quota limit (3 plans) is reached
   */
  const createPlan = useCallback(async (name = 'My Degree Plan', faculty = 'arts', major = null) => {
    if (!isAuthenticated || !user) {
      throw new Error('You must be logged in to create a plan')
    }

    // Check quota limit
    if (plans.length >= 3) {
      const errorMsg = 'Maximum 3 plans allowed. Please delete a plan before creating a new one.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw new Error(errorMsg)
    }

    try {
      setError(null)
      
      console.log('Creating plan in DB with:', { name, faculty, major })

      const { data, error: insertError } = await supabase
        .from('degree_plans')
        .insert({
          user_id: user.id,
          plan_name: name,
          faculty: faculty,
          major: major,
          course_data: []
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Update local state
      const newPlans = [data, ...plans]
      setPlans(newPlans)
      setActivePlan(data)

      showToast(`Plan "${name}" created successfully`, 'success')
      return data
    } catch (err) {
      console.error('Error creating plan:', err)
      const errorMsg = err.message || 'Failed to create plan'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw err
    }
  }, [user, isAuthenticated, plans, showToast])

  /**
   * Save current courses to a plan
   * @param {string} planId - Plan ID to save to
   * @param {Array} currentCourses - Array of course objects
   * @param {boolean} silent - If true, don't show toast notifications (for auto-save)
   */
  const savePlan = useCallback(async (planId, currentCourses, silent = false) => {
    if (!isAuthenticated || !user) {
      throw new Error('You must be logged in to save a plan')
    }

    try {
      setError(null)

      const { error: updateError } = await supabase
        .from('degree_plans')
        .update({
          course_data: currentCourses,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      const updatedPlans = plans.map(plan =>
        plan.id === planId
          ? { ...plan, course_data: currentCourses, updated_at: new Date().toISOString() }
          : plan
      )
      setPlans(updatedPlans)

      // Update active plan if it's the one being saved
      if (activePlan && activePlan.id === planId) {
        setActivePlan({ ...activePlan, course_data: currentCourses, updated_at: new Date().toISOString() })
      }

      // Only show toast if not silent (i.e., manual save)
      if (!silent) {
        showToast('Plan saved successfully', 'success')
      }
    } catch (err) {
      console.error('Error saving plan:', err)
      const errorMsg = err.message || 'Failed to save plan'
      setError(errorMsg)
      // Always show error toast, even for auto-save failures
      showToast(errorMsg, 'error')
      throw err
    }
  }, [user, isAuthenticated, plans, activePlan, showToast])

  /**
   * Switch to a different plan
   * @param {string} planId - Plan ID to switch to
   * @returns {Array} The course_data array from the switched plan
   */
  const switchPlan = useCallback((planId) => {
    if (!isAuthenticated || !user) {
      throw new Error('You must be logged in to switch plans')
    }

    const plan = plans.find(p => p.id === planId)
    if (!plan) {
      const errorMsg = 'Plan not found'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw new Error(errorMsg)
    }

    console.log('Switching to plan:', {
      id: plan.id,
      plan_name: plan.plan_name,
      faculty: plan.faculty,
      major: plan.major
    })
    
    setActivePlan(plan)
    
    // Return course_data so UI can update immediately
    return plan.course_data || []
  }, [user, isAuthenticated, plans, showToast])

  /**
   * Delete a plan
   * @param {string} planId - Plan ID to delete
   */
  const deletePlan = useCallback(async (planId) => {
    if (!isAuthenticated || !user) {
      throw new Error('You must be logged in to delete a plan')
    }

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('degree_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      const filteredPlans = plans.filter(p => p.id !== planId)
      setPlans(filteredPlans)

      // If deleted plan was active, switch to first available plan or null
      if (activePlan && activePlan.id === planId) {
        if (filteredPlans.length > 0) {
          setActivePlan(filteredPlans[0])
        } else {
          setActivePlan(null)
        }
      }

      showToast('Plan deleted successfully', 'success')
    } catch (err) {
      console.error('Error deleting plan:', err)
      const errorMsg = err.message || 'Failed to delete plan'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw err
    }
  }, [user, isAuthenticated, plans, activePlan, showToast])

  /**
   * Update plan metadata (name, faculty, major)
   * @param {string} planId - Plan ID
   * @param {Object} updates - Object with plan_name, faculty, major fields
   * @param {boolean} silent - If true, don't show toast notifications (for auto-save)
   */
  const updatePlanMetadata = useCallback(async (planId, updates, silent = false) => {
    if (!isAuthenticated || !user) {
      throw new Error('You must be logged in to update a plan')
    }

    try {
      setError(null)

      const { error: updateError } = await supabase
        .from('degree_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      const updatedPlans = plans.map(plan =>
        plan.id === planId
          ? { ...plan, ...updates, updated_at: new Date().toISOString() }
          : plan
      )
      setPlans(updatedPlans)

      // Update active plan if it's the one being updated
      if (activePlan && activePlan.id === planId) {
        setActivePlan({ ...activePlan, ...updates, updated_at: new Date().toISOString() })
      }

      // Only show toast if not silent (i.e., manual update)
      if (!silent) {
        showToast('Plan updated successfully', 'success')
      }
    } catch (err) {
      console.error('Error updating plan:', err)
      const errorMsg = err.message || 'Failed to update plan'
      setError(errorMsg)
      // Always show error toast, even for auto-save failures
      showToast(errorMsg, 'error')
      throw err
    }
  }, [user, isAuthenticated, plans, activePlan, showToast])

  return {
    plans,
    activePlan,
    loading,
    error,
    createPlan,
    savePlan,
    switchPlan,
    deletePlan,
    updatePlanMetadata,
    refreshPlans: loadPlans
  }
}

