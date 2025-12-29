import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * Custom hook for managing admission scenarios with Supabase
 * 
 * Features:
 * - CRUD operations for admission scenarios
 * - 3-scenario quota limit per user
 * - Automatic state synchronization
 * - Toast notifications for user feedback
 * - Guest user support with localStorage fallback
 */
export const useAdmissionScenarios = () => {
  const { user, isAuthenticated } = useAuth()
  const [scenarios, setScenarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Simple toast notification function
  const showToast = useCallback((message, type = 'success') => {
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

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse'
      setTimeout(() => {
        if (document.body.contains(toast)) document.body.removeChild(toast)
        if (document.head.contains(style)) document.head.removeChild(style)
      }, 300)
    }, 3000)
  }, [])

  // Load scenarios from localStorage for guest users
  const loadGuestScenarios = useCallback(() => {
    try {
      const saved = localStorage.getItem('guest_scenarios')
      if (saved) {
        const parsed = JSON.parse(saved)
        setScenarios(parsed)
        return parsed
      }
      return []
    } catch (err) {
      console.error('Error loading guest scenarios:', err)
      return []
    }
  }, [])

  // Save scenarios to localStorage for guest users
  const saveGuestScenarios = useCallback((scenariosList) => {
    try {
      localStorage.setItem('guest_scenarios', JSON.stringify(scenariosList))
    } catch (err) {
      console.error('Error saving guest scenarios:', err)
    }
  }, [])

  // Load all scenarios for the current user
  const loadScenarios = useCallback(async () => {
    if (!isAuthenticated || !user) {
      // Load from localStorage for guest users
      const guestScenarios = loadGuestScenarios()
      setScenarios(guestScenarios)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('admission_scenarios')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      const scenariosData = data || []
      console.log('Loaded scenarios from Supabase:', scenariosData.length)
      
      setScenarios(scenariosData)
      setLoading(false)
    } catch (err) {
      console.error('Error loading scenarios:', err)
      setError(err.message)
      setLoading(false)
      showToast('Failed to load scenarios', 'error')
    }
  }, [user, isAuthenticated, loadGuestScenarios, showToast])

  // Load scenarios on mount and when user changes
  useEffect(() => {
    loadScenarios()
  }, [loadScenarios])

  /**
   * Create a new scenario
   * @param {string} name - Scenario name
   * @param {string} programId - Program ID (e.g., "Arts", "Science")
   * @param {Object} inputs - Form inputs JSON
   * @param {Object} results - Calculation results JSON
   * @returns {Promise<Object>} Created scenario object
   * @throws {Error} If quota limit (3 scenarios) is reached
   */
  const createScenario = useCallback(async (name, programId, inputs, results) => {
    // Check quota limit
    if (scenarios.length >= 3) {
      const errorMsg = 'Maximum 3 scenarios allowed. Please delete a scenario before creating a new one.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw new Error(errorMsg)
    }

    // Validate inputs
    if (!inputs || !results) {
      const errorMsg = 'Invalid scenario data'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw new Error(errorMsg)
    }

    if (!isAuthenticated || !user) {
      // Guest user: save to localStorage
      try {
        const newScenario = {
          id: `guest_${Date.now()}`,
          scenario_name: name,
          program_id: programId,
          inputs_json: inputs,
          results_json: results,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const updatedScenarios = [newScenario, ...scenarios]
        setScenarios(updatedScenarios)
        saveGuestScenarios(updatedScenarios)
        
        showToast(`Scenario "${name}" saved successfully`, 'success')
        return newScenario
      } catch (err) {
        console.error('Error creating guest scenario:', err)
        const errorMsg = 'Failed to save scenario'
        setError(errorMsg)
        showToast(errorMsg, 'error')
        throw err
      }
    }

    try {
      setError(null)
      
      console.log('Creating scenario in DB with:', { name, programId })

      const { data, error: insertError } = await supabase
        .from('admission_scenarios')
        .insert({
          user_id: user.id,
          scenario_name: name,
          program_id: programId,
          inputs_json: inputs,
          results_json: results
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Update local state
      const newScenarios = [data, ...scenarios]
      setScenarios(newScenarios)

      showToast(`Scenario "${name}" saved successfully`, 'success')
      return data
    } catch (err) {
      console.error('Error creating scenario:', err)
      const errorMsg = err.message || 'Failed to create scenario'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw err
    }
  }, [user, isAuthenticated, scenarios, showToast, saveGuestScenarios])

  /**
   * Update a scenario
   * @param {string} scenarioId - Scenario ID
   * @param {Object} updates - Object with fields to update
   */
  const updateScenario = useCallback(async (scenarioId, updates) => {
    if (!isAuthenticated || !user) {
      // Guest user: update in localStorage
      try {
        const updatedScenarios = scenarios.map(scenario =>
          scenario.id === scenarioId
            ? { ...scenario, ...updates, updated_at: new Date().toISOString() }
            : scenario
        )
        setScenarios(updatedScenarios)
        saveGuestScenarios(updatedScenarios)
        showToast('Scenario updated successfully', 'success')
        return
      } catch (err) {
        console.error('Error updating guest scenario:', err)
        showToast('Failed to update scenario', 'error')
        throw err
      }
    }

    try {
      setError(null)

      const { error: updateError } = await supabase
        .from('admission_scenarios')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', scenarioId)
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      const updatedScenarios = scenarios.map(scenario =>
        scenario.id === scenarioId
          ? { ...scenario, ...updates, updated_at: new Date().toISOString() }
          : scenario
      )
      setScenarios(updatedScenarios)

      showToast('Scenario updated successfully', 'success')
    } catch (err) {
      console.error('Error updating scenario:', err)
      const errorMsg = err.message || 'Failed to update scenario'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw err
    }
  }, [user, isAuthenticated, scenarios, showToast, saveGuestScenarios])

  /**
   * Delete a scenario
   * @param {string} scenarioId - Scenario ID to delete
   */
  const deleteScenario = useCallback(async (scenarioId) => {
    if (!isAuthenticated || !user) {
      // Guest user: delete from localStorage
      try {
        const filteredScenarios = scenarios.filter(s => s.id !== scenarioId)
        setScenarios(filteredScenarios)
        saveGuestScenarios(filteredScenarios)
        showToast('Scenario deleted successfully', 'success')
        return
      } catch (err) {
        console.error('Error deleting guest scenario:', err)
        showToast('Failed to delete scenario', 'error')
        throw err
      }
    }

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('admission_scenarios')
        .delete()
        .eq('id', scenarioId)
        .eq('user_id', user.id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      const filteredScenarios = scenarios.filter(s => s.id !== scenarioId)
      setScenarios(filteredScenarios)

      showToast('Scenario deleted successfully', 'success')
    } catch (err) {
      console.error('Error deleting scenario:', err)
      const errorMsg = err.message || 'Failed to delete scenario'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw err
    }
  }, [user, isAuthenticated, scenarios, showToast, saveGuestScenarios])

  /**
   * Duplicate a scenario
   * @param {string} scenarioId - Scenario ID to duplicate
   * @returns {Promise<Object>} New duplicated scenario
   */
  const duplicateScenario = useCallback(async (scenarioId) => {
    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) {
      const errorMsg = 'Scenario not found'
      setError(errorMsg)
      showToast(errorMsg, 'error')
      throw new Error(errorMsg)
    }

    const newName = `${scenario.scenario_name} (Copy)`
    return createScenario(
      newName,
      scenario.program_id,
      scenario.inputs_json,
      scenario.results_json
    )
  }, [scenarios, createScenario, showToast])

  return {
    scenarios,
    loading,
    error,
    createScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario,
    refreshScenarios: loadScenarios
  }
}

