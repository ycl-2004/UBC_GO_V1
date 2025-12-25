import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { useAuth } from '../context/AuthContext'
import { useDegreePlan } from '../hooks/useDegreePlan'
import { facultyRequirements, getCoursesByFaculty, getAllFaculties } from '../data/facultiesData'
import { artsCourses } from '../data/artsData'
import './PlannerPage.css'

const PlannerPage = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  // Use the degree plan hook for authenticated users
  const {
    plans: savedPlans,
    activePlan,
    loading: plansLoading,
    createPlan: createPlanHook,
    savePlan: savePlanHook,
    switchPlan: switchPlanHook,
    deletePlan: deletePlanHook,
    updatePlanMetadata
  } = useDegreePlan()
  
  const [selectedFaculty, setSelectedFaculty] = useState('arts')
  const [selectedMajor, setSelectedMajor] = useState('')
  const [planName, setPlanName] = useState('My Degree Plan')
  const [completedCourses, setCompletedCourses] = useState([])
  const [courseStatus, setCourseStatus] = useState({})
  const [curriculumData, setCurriculumData] = useState(null)
  const [selectedYearTab, setSelectedYearTab] = useState(1)
  const [selectedYear, setSelectedYear] = useState('Year 1')
  const [selectedTerm, setSelectedTerm] = useState('Term 1')
  const [showPlanManager, setShowPlanManager] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isInitialLoad = useRef(true)
  const isSavingRef = useRef(false)
  
  // Create Plan Modal State
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanFaculty, setNewPlanFaculty] = useState('arts')
  const [newPlanMajor, setNewPlanMajor] = useState('')
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)

  const majorOptions = {
    appliedScience: [
      { value: 'biomedical-engineering', label: 'Biomedical Engineering' },
      { value: 'chemical-and-biological-engineering', label: 'Chemical and Biological Engineering' },
      { value: 'civil-engineering', label: 'Civil Engineering' },
      { value: 'computer-engineering', label: 'Computer Engineering' },
      { value: 'electrical-engineering', label: 'Electrical Engineering' },
      { value: 'engineering-physics', label: 'Engineering Physics' },
      { value: 'environmental-engineering', label: 'Environmental Engineering' },
      { value: 'geological-engineering', label: 'Geological Engineering' },
      { value: 'integrated-engineering', label: 'Integrated Engineering' },
      { value: 'manufacturing-engineering', label: 'Manufacturing Engineering' },
      { value: 'materials-engineering', label: 'Materials Engineering' },
      { value: 'mechanical-engineering', label: 'Mechanical Engineering' },
      { value: 'mining-engineering', label: 'Mining Engineering' },
    ],
  }

  // Sync active plan data to local state when it changes
  useEffect(() => {
    if (!isAuthenticated || !activePlan) {
      return
    }
    
    // Set flag to prevent savePlan from running during load
    isSavingRef.current = true
    
    console.log('Syncing plan data:', {
      id: activePlan.id,
      plan_name: activePlan.plan_name,
      faculty: activePlan.faculty,
      major: activePlan.major,
      course_count: activePlan.course_data?.length
    })
    
    // Update all local state from the active plan
    setPlanName(activePlan.plan_name || 'My Degree Plan')
    setSelectedFaculty(activePlan.faculty || 'arts')
    setSelectedMajor(activePlan.major || '')
    setCompletedCourses(activePlan.course_data || [])
    setHasUnsavedChanges(false)
    
    // Reset flag after state updates (give React time to batch)
    const timer = setTimeout(() => {
      isSavingRef.current = false
    }, 300)
    
    return () => clearTimeout(timer)
  }, [activePlan?.id, activePlan?.faculty, activePlan?.major, activePlan?.plan_name, isAuthenticated])

  const loadGuestPlan = () => {
    const saved = localStorage.getItem('guest_plan')
    if (saved) {
      const plan = JSON.parse(saved)
      setCompletedCourses(plan.courses || [])
      setSelectedFaculty(plan.faculty || 'arts')
      setSelectedMajor(plan.major || '')
    }
  }

  // Manual save function
  const handleSaveChanges = async () => {
    if (!isAuthenticated || !user || !activePlan) {
      // Save to localStorage for guest
      const planData = {
        name: planName,
        faculty: selectedFaculty,
        major: selectedMajor,
        courses: completedCourses,
        updatedAt: new Date().toISOString()
      }
      localStorage.setItem('guest_plan', JSON.stringify(planData))
      setHasUnsavedChanges(false)
      return
    }

    setIsSaving(true)

    try {
      // Save course data
      await savePlanHook(activePlan.id, completedCourses, false)
      
      // Update plan metadata if changed
      const metadataUpdates = {}
      if (activePlan.plan_name !== planName) {
        metadataUpdates.plan_name = planName
      }
      if (activePlan.faculty !== selectedFaculty) {
        metadataUpdates.faculty = selectedFaculty
      }
      if (activePlan.major !== selectedMajor) {
        metadataUpdates.major = selectedMajor
      }
      
      if (Object.keys(metadataUpdates).length > 0) {
        await updatePlanMetadata(activePlan.id, metadataUpdates, true)
      }
      
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving plan:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Load curriculum data based on faculty + major
  useEffect(() => {
    // Don't reset courses if we're loading a plan (isSavingRef indicates plan loading)
    if (isSavingRef.current) return
    
    const loadCurriculum = async () => {
      // Handle Applied Science majors with dynamic import
      if (selectedFaculty === 'appliedScience' && selectedMajor) {
        try {
          // Dynamic import based on major slug (e.g., 'civil-engineering' -> civil-engineering.json)
          const module = await import(`../data/curriculum/applied-science/${selectedMajor}.json`)
          const data = module.default || module
          setCurriculumData(data)
          const statusKey = `course_status_${selectedFaculty}_${selectedMajor}`
          const storedStatus = localStorage.getItem(statusKey)
          setCourseStatus(storedStatus ? JSON.parse(storedStatus) : {})
          setSelectedYearTab(1)
        } catch (error) {
          console.error(`Failed to load curriculum data for ${selectedMajor}:`, error)
          setCurriculumData(null)
        }
      } else {
        setCurriculumData(null)
        setCourseStatus({})
      }
      // Only reset courses if this is a manual faculty/major change, not a plan load
      if (!isSavingRef.current) {
        setCompletedCourses([])
      }
    }
    loadCurriculum()
  }, [selectedFaculty, selectedMajor])

  // Track unsaved changes
  useEffect(() => {
    if (isInitialLoad.current || isSavingRef.current) return
    setHasUnsavedChanges(true)
  }, [completedCourses, planName])

  // Load guest plan on mount if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      loadGuestPlan()
    }
    isInitialLoad.current = false
  }, [isAuthenticated, user])

  // Open create plan modal
  const openCreateModal = () => {
    setNewPlanName('')
    setNewPlanFaculty('arts')
    setNewPlanMajor('')
    setShowCreateModal(true)
    setShowPlanManager(false)
  }

  // Create new plan with modal data
  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) {
      alert('Please enter a plan name')
      return
    }

    if (!isAuthenticated || !user) {
      // For guest users, create a local plan
      setPlanName(newPlanName)
      setSelectedFaculty(newPlanFaculty)
      setSelectedMajor(newPlanMajor)
      setCompletedCourses([])
      setShowCreateModal(false)
      return
    }

    setIsCreatingPlan(true)

    try {
      console.log('Creating plan with:', { name: newPlanName, faculty: newPlanFaculty, major: newPlanMajor })
      
      // Create plan with name, faculty, and major directly
      const newPlan = await createPlanHook(newPlanName, newPlanFaculty, newPlanMajor || null)
      
      console.log('Plan created:', newPlan)
      
      // The hook will set this as the active plan, and the sync effect will update local state
      // No need to manually set faculty/major since the plan already has correct values
      
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create plan:', error)
      alert(`Failed to create plan: ${error.message || 'Unknown error'}`)
    } finally {
      setIsCreatingPlan(false)
    }
  }

  const loadPlan = (planId) => {
    if (!isAuthenticated || !user) return
    
    try {
      // Set flag to prevent savePlan from running during load
      isSavingRef.current = true
      
      // Switch plan - this updates activePlan in the hook
      // The useEffect will automatically sync activePlan to local state
      switchPlanHook(planId)
      
      setShowPlanManager(false)
      
      // Reset flag after state updates
      setTimeout(() => {
        isSavingRef.current = false
      }, 200)
    } catch (error) {
      console.error('Failed to load plan:', error)
    }
  }

  const deletePlan = async (planId) => {
    if (!isAuthenticated || !user || !window.confirm('Are you sure you want to delete this plan?')) return
    
    try {
      await deletePlanHook(planId)
      // The hook will automatically handle switching to another plan if needed
      // If no plans remain, activePlan will be null
      if (savedPlans.length === 1) {
        // Last plan was deleted, reset to default state
        setCompletedCourses([])
        setSelectedFaculty('arts')
        setSelectedMajor('')
        setPlanName('My Degree Plan')
      }
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
  }

  const addCourse = (course) => {
    if (!completedCourses.find(c => c.code === course.code)) {
      const updated = [...completedCourses, {
        ...course,
        year: selectedYear,
        term: selectedTerm,
        grade: null
      }]
      setCompletedCourses(updated)
    }
  }

  const getStatusKey = () => `course_status_${selectedFaculty}_${selectedMajor || 'none'}`

  const persistCourseStatus = (statusMap) => {
    try {
      localStorage.setItem(getStatusKey(), JSON.stringify(statusMap))
    } catch (e) {
      console.warn('Unable to persist course status', e)
    }
  }

  const toggleCourseStatus = (course) => {
    const statusOrder = {
      'not-started': 'in-progress',
      'in-progress': 'completed',
      'completed': 'not-started'
    }

    setCourseStatus((prev) => {
      const currentStatus = prev[course.code] || 'not-started'
      const nextStatus = statusOrder[currentStatus]
      const next = { ...prev }

      if (nextStatus === 'not-started') {
        delete next[course.code]
        setCompletedCourses(prevCourses => prevCourses.filter(c => c.code !== course.code))
      } else if (nextStatus === 'completed') {
        next[course.code] = nextStatus
        setCompletedCourses(prevCourses => {
          if (prevCourses.find(c => c.code === course.code)) return prevCourses
          return [
            ...prevCourses,
            {
              code: course.code,
              name: course.title || course.name || course.code,
              credits: course.credits || 0,
              year: `Year ${course.year || selectedYear.replace('Year ', '')}`,
              term: `Term ${course.term || selectedTerm.replace('Term ', '')}`,
              category: course.category || 'elective'
            }
          ]
        })
      } else {
        // in-progress should not count toward completed credits
        next[course.code] = nextStatus
        setCompletedCourses(prevCourses => prevCourses.filter(c => c.code !== course.code))
      }

      persistCourseStatus(next)
      return next
    })
  }

  const removeCourse = (courseCode) => {
    setCompletedCourses(completedCourses.filter(c => c.code !== courseCode))
    // Also update course status
    setCourseStatus(prev => {
      const next = { ...prev }
      delete next[courseCode]
      persistCourseStatus(next)
      return next
    })
  }

  const getCurrentRequirements = () => {
    return facultyRequirements[selectedFaculty] || facultyRequirements.arts
  }

  const getCurrentCourses = () => {
    // Try to get from scraped data, fallback to artsCourses
    const facultyCourses = getCoursesByFaculty(selectedFaculty)
    return facultyCourses.length > 0 ? facultyCourses : artsCourses
  }

  const calculateProgress = () => {
    const requirements = getCurrentRequirements()
    const totalCredits = completedCourses.reduce((sum, course) => sum + (course.credits || 0), 0)
    const totalCreditsDenominator = curriculumData?.totalCredits || requirements.totalCredits
    const progress = (totalCredits / totalCreditsDenominator) * 100

    const communicationCredits = completedCourses
      .filter(c => c.category === 'communication')
      .reduce((sum, c) => sum + c.credits, 0)
    
    const scienceCredits = completedCourses
      .filter(c => c.category === 'science')
      .reduce((sum, c) => sum + c.credits, 0)
    
    const literatureCredits = completedCourses
      .filter(c => c.category === 'literature')
      .reduce((sum, c) => sum + c.credits, 0)

    return {
      totalCredits,
      progress: Math.min(progress, 100),
      communicationCredits,
      scienceCredits,
      literatureCredits,
      remainingCredits: Math.max(0, (curriculumData?.totalCredits || requirements.totalCredits) - totalCredits),
      requirements
    }
  }

  const getRecommendedCourses = () => {
    const completedCodes = completedCourses.map(c => c.code)
    const availableCourses = getCurrentCourses()
    
    const recommendations = availableCourses
      .filter(course => !completedCodes.includes(course.code))
      .filter(course => {
        if (course.prerequisites && course.prerequisites.length > 0) {
          return course.prerequisites.every(prereq => completedCodes.includes(prereq))
        }
        return true
      })
      .slice(0, 6)

    return recommendations
  }

  const progress = calculateProgress()
  const recommendedCourses = getRecommendedCourses()
  const currentCourses = getCurrentCourses()
  const requirements = curriculumData
    ? {
        ...getCurrentRequirements(),
        faculty: `${curriculumData.faculty} - ${curriculumData.major}`,
        totalCredits: curriculumData.totalCredits
      }
    : getCurrentRequirements()

  const statusLabels = {
    'completed': 'Completed',
    'in-progress': 'In Progress',
    'not-started': 'Not Started'
  }

  // Check if we should show empty state
  const showEmptyState = isAuthenticated && !activePlan && !plansLoading

  // Debug: only log when there's a mismatch
  if (activePlan && selectedFaculty !== activePlan.faculty) {
    console.warn('Faculty mismatch detected:', {
      selectedFaculty,
      activePlanFaculty: activePlan.faculty,
      activePlanId: activePlan.id
    })
  }

  return (
    <div className="planner-page">
      <Navigation />
      <div className="planner-container">
        <div className="planner-header">
          <div className="header-top">
            <div>
              <h1>Degree Planner</h1>
              {activePlan && (
                <p className="subtitle">{requirements.faculty} - Track your progress and plan your courses</p>
              )}
            </div>
            <div className="header-actions">
              {hasUnsavedChanges && isAuthenticated && activePlan && (
                <button 
                  className="btn-save-changes"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              {isAuthenticated && (
                <button 
                  className="btn-manage-plans"
                  onClick={() => setShowPlanManager(!showPlanManager)}
                >
                  Manage Plans
                </button>
              )}
              {!isAuthenticated && (
                <button 
                  className="btn-login-prompt"
                  onClick={() => navigate('/login')}
                >
                  Login to Save Plans
                </button>
              )}
            </div>
          </div>

          {/* Create Plan Modal */}
          {showCreateModal && (
            <>
              <div className="modal-overlay" onClick={() => setShowCreateModal(false)} />
              <div className="create-plan-modal">
                <div className="modal-header">
                  <h3>Create New Plan</h3>
                  <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="newPlanName">Plan Name</label>
                    <input
                      type="text"
                      id="newPlanName"
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      placeholder="e.g., My Engineering Path"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="newPlanFaculty">Select Faculty</label>
                    <select
                      id="newPlanFaculty"
                      value={newPlanFaculty}
                      onChange={(e) => {
                        setNewPlanFaculty(e.target.value)
                        setNewPlanMajor('')
                      }}
                      className="form-select"
                    >
                      {getAllFaculties().map(facultyKey => (
                        <option key={facultyKey} value={facultyKey}>
                          {facultyRequirements[facultyKey].faculty}
                        </option>
                      ))}
                    </select>
                  </div>
                  {majorOptions[newPlanFaculty] && (
                    <div className="form-group">
                      <label htmlFor="newPlanMajor">Select Major</label>
                      <select
                        id="newPlanMajor"
                        value={newPlanMajor}
                        onChange={(e) => setNewPlanMajor(e.target.value)}
                        className="form-select"
                      >
                        <option value="">Select a major</option>
                        {majorOptions[newPlanFaculty].map((major) => (
                          <option key={major.value} value={major.value}>
                            {major.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn-cancel" 
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreatingPlan}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-create" 
                    onClick={handleCreatePlan}
                    disabled={isCreatingPlan}
                  >
                    {isCreatingPlan ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Plan Manager Modal */}
          {showPlanManager && isAuthenticated && (
            <>
              <div className="modal-overlay" onClick={() => setShowPlanManager(false)} />
              <div className="plan-manager">
                <div className="plan-manager-header">
                  <h3>My Plans</h3>
                  <button className="close-btn" onClick={() => setShowPlanManager(false)}>×</button>
                </div>
                <div className="plan-list">
                  {savedPlans.length === 0 ? (
                    <div className="no-plans-message">
                      <p>You don't have any plans yet.</p>
                      <p>Click "New Plan" to create your first degree plan.</p>
                    </div>
                  ) : (
                    savedPlans.map(plan => (
                      <div 
                        key={plan.id} 
                        className={`plan-item ${plan.id === activePlan?.id ? 'active' : ''}`}
                      >
                        <div onClick={() => loadPlan(plan.id)}>
                          <h4>{plan.plan_name || 'My Degree Plan'}</h4>
                          <p>{facultyRequirements[plan.faculty]?.faculty || 'Unknown Faculty'}</p>
                          <small>{(plan.course_data?.length || 0)} courses</small>
                        </div>
                        <button 
                          className="delete-plan-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePlan(plan.id)
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                  <button 
                    className="btn-new-plan" 
                    onClick={openCreateModal}
                    disabled={savedPlans.length >= 3}
                    title={savedPlans.length >= 3 ? 'Maximum 3 plans allowed. Delete a plan to create a new one.' : ''}
                  >
                    + New Plan {savedPlans.length >= 3 && '(Limit Reached)'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Show plan controls only when there's an active plan */}
          {(activePlan || !isAuthenticated) && (
            <>
              {/* Plan Name Editor - Editable, saves on blur */}
              {isAuthenticated && activePlan && (
                <div className="plan-name-editor">
                  <label htmlFor="planNameInput">Plan Name:</label>
                  <input
                    id="planNameInput"
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    onBlur={async () => {
                      if (activePlan && planName !== activePlan.plan_name) {
                        try {
                          await updatePlanMetadata(activePlan.id, { plan_name: planName }, false)
                        } catch (error) {
                          console.error('Failed to update plan name:', error)
                        }
                      }
                    }}
                    placeholder="Plan name"
                    className="plan-name-input"
                  />
                  <span className="plan-name-hint">Press Tab or click away to save</span>
                </div>
              )}

              {/* Faculty Selector - Locked when a plan is active */}
              <div className={`faculty-selector ${isAuthenticated && activePlan ? 'locked' : ''}`}>
                <label htmlFor="faculty">
                  Select Faculty:
                  {isAuthenticated && activePlan && <span className="lock-icon" title="Locked to this plan">🔒</span>}
                </label>
                <select 
                  id="faculty"
                  value={selectedFaculty} 
                  onChange={(e) => {
                    setSelectedFaculty(e.target.value)
                    setSelectedMajor('')
                    setCompletedCourses([]) // Reset courses when changing faculty
                    setCourseStatus({})
                  }}
                  disabled={isAuthenticated && !!activePlan}
                  className={isAuthenticated && activePlan ? 'disabled-select' : ''}
                >
                  {getAllFaculties().map(facultyKey => (
                    <option key={facultyKey} value={facultyKey}>
                      {facultyRequirements[facultyKey].faculty}
                    </option>
                  ))}
                </select>
              </div>

              {majorOptions[selectedFaculty] && (
                <div className={`faculty-selector ${isAuthenticated && activePlan ? 'locked' : ''}`}>
                  <label htmlFor="major">
                    Select Major:
                    {isAuthenticated && activePlan && <span className="lock-icon" title="Locked to this plan">🔒</span>}
                  </label>
                  <select
                    id="major"
                    value={selectedMajor}
                    onChange={(e) => {
                      setSelectedMajor(e.target.value)
                      setCompletedCourses([])
                      setCourseStatus({})
                    }}
                    disabled={isAuthenticated && !!activePlan}
                    className={isAuthenticated && activePlan ? 'disabled-select' : ''}
                  >
                    <option value="">Select a major</option>
                    {majorOptions[selectedFaculty].map((major) => (
                      <option key={major.value} value={major.value}>
                        {major.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Empty State - No Active Plan */}
        {showEmptyState && (
          <div className="empty-state-container">
            <div className="empty-state-content">
              <div className="empty-state-icon">📚</div>
              <h2>No Plan Active</h2>
              <p>You haven't created a degree plan yet.</p>
              <p>Click "Manage Plans" to create your first plan and start tracking your courses.</p>
              <button 
                className="btn-create-first-plan"
                onClick={openCreateModal}
              >
                Create Your First Plan
              </button>
            </div>
          </div>
        )}

        {/* Show planner content only when there's an active plan or guest mode */}
        {(activePlan || !isAuthenticated) && !showEmptyState && (
          <div className="planner-content">
            {/* Progress Overview */}
            <div className="progress-section">
              <h2>Your Progress</h2>
              <div className="progress-card">
                <div className="progress-circle">
                  <svg className="progress-ring" width="200" height="200">
                    <circle
                      className="progress-ring-circle"
                      stroke="#e0e0e0"
                      strokeWidth="12"
                      fill="transparent"
                      r="90"
                      cx="100"
                      cy="100"
                    />
                    <circle
                      className="progress-ring-circle progress-ring-fill"
                      stroke="#002145"
                      strokeWidth="12"
                      fill="transparent"
                      r="90"
                      cx="100"
                      cy="100"
                      strokeDasharray={`${2 * Math.PI * 90}`}
                      strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress.progress / 100)}`}
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div className="progress-text">
                    <span className="progress-percentage">{Math.round(progress.progress)}%</span>
                    <span className="progress-label">Complete</span>
                  </div>
                </div>
                <div className="progress-details">
                  <div className="progress-item">
                    <span className="progress-item-label">Total Credits:</span>
                    <span className="progress-item-value">{progress.totalCredits} / {requirements.totalCredits}</span>
                  </div>
                  <div className="progress-item">
                    <span className="progress-item-label">Remaining:</span>
                    <span className="progress-item-value">{progress.remainingCredits} credits</span>
                  </div>
                </div>
              </div>

              {/* Requirements Progress */}
              <div className="requirements-grid">
                {requirements.requirements?.communication && (
                  <div className="requirement-card">
                    <h3>Communication</h3>
                    <div className="requirement-progress">
                      <div className="requirement-bar">
                        <div 
                          className="requirement-bar-fill"
                          style={{ width: `${Math.min((progress.communicationCredits / requirements.requirements.communication.credits) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span>{progress.communicationCredits} / {requirements.requirements.communication.credits} credits</span>
                    </div>
                  </div>
                )}

                {requirements.requirements?.breadth?.science && (
                  <div className="requirement-card">
                    <h3>Science</h3>
                    <div className="requirement-progress">
                      <div className="requirement-bar">
                        <div 
                          className="requirement-bar-fill"
                          style={{ width: `${Math.min((progress.scienceCredits / requirements.requirements.breadth.science.credits) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span>{progress.scienceCredits} / {requirements.requirements.breadth.science.credits} credits</span>
                    </div>
                  </div>
                )}

                {requirements.requirements?.breadth?.literature && (
                  <div className="requirement-card">
                    <h3>Literature</h3>
                    <div className="requirement-progress">
                      <div className="requirement-bar">
                        <div 
                          className="requirement-bar-fill"
                          style={{ width: `${Math.min((progress.literatureCredits / requirements.requirements.breadth.literature.credits) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span>{progress.literatureCredits} / {requirements.requirements.breadth.literature.credits} credits</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Course Management */}
            <div className="courses-section">
              <div className="section-header">
                <h2>My Courses</h2>
                {!curriculumData && (
                  <div className="term-selector">
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                      <option>Year 1</option>
                      <option>Year 2</option>
                      <option>Year 3</option>
                      <option>Year 4</option>
                    </select>
                    <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
                      <option>Term 1</option>
                      <option>Term 2</option>
                    </select>
                  </div>
                )}
              </div>

              {majorOptions[selectedFaculty] && !selectedMajor && (
                <div className="empty-state">
                  <p>Please select a major to view requirements.</p>
                </div>
              )}

              {curriculumData && selectedMajor ? (
                <div className="curriculum-view">
                  <div className="year-tabs">
                    {curriculumData.years.map((year) => (
                      <button
                        key={year.year}
                        className={`year-tab ${selectedYearTab === year.year ? 'active' : ''}`}
                        onClick={() => setSelectedYearTab(year.year)}
                      >
                        {year.label}
                      </button>
                    ))}
                  </div>

                  {curriculumData.years.filter(y => y.year === selectedYearTab).map((year) => (
                    <div key={year.year} className="available-courses">
                      <h3>{year.label}</h3>
                      {year.terms.map((term) => (
                        <div key={term.term}>
                          <h4>Term {term.term}</h4>
                          <div className="course-grid">
                            {term.courses.map((course) => {
                              const status = courseStatus[course.code] || 'not-started'
                              return (
                                <div
                                  key={course.code}
                                  className={`course-card status-${status}`}
                                  onClick={() => toggleCourseStatus(course)}
                                >
                                  <div className="course-card-header">
                                    <span className="course-card-code">{course.code}</span>
                                    <span className="course-card-credits">{course.credits} credits</span>
                                  </div>
                                  <h4 className="course-card-name">{course.title || course.name}</h4>
                                  <div className="course-status">
                                    <span className={`status-badge status-${status}`}>
                                      {statusLabels[status]}
                                    </span>
                                  </div>
                                  <p className="course-card-description">{course.description || ''}</p>
                                  <small>Click to toggle status</small>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Completed Courses */}
                  <div className="completed-courses">
                    {completedCourses.length === 0 ? (
                      <div className="empty-state">
                        <p>No courses added yet. Start by adding courses from the course list below.</p>
                      </div>
                    ) : (
                      <div className="course-list">
                        {completedCourses.map((course, index) => (
                          <div key={index} className="course-item">
                            <div className="course-info">
                              <span className="course-code">{course.code}</span>
                              <span className="course-name">{course.name}</span>
                              <span className="course-credits">{course.credits} credits</span>
                              <span className="course-term">{course.year} - {course.term}</span>
                            </div>
                            <button 
                              className="remove-course"
                              onClick={() => removeCourse(course.code)}
                              title="Remove course"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available Courses */}
                  <div className="available-courses">
                    <h3>Available Courses</h3>
                    <div className="course-grid">
                      {currentCourses.map((course, index) => {
                        const isCompleted = completedCourses.find(c => c.code === course.code)
                        return (
                          <div 
                            key={index} 
                            className={`course-card ${isCompleted ? 'completed' : ''}`}
                          >
                            <div className="course-card-header">
                              <span className="course-card-code">{course.code}</span>
                              <span className="course-card-credits">{course.credits} credits</span>
                            </div>
                            <h4 className="course-card-name">{course.name}</h4>
                            <p className="course-card-description">{course.description}</p>
                            {course.prerequisites && course.prerequisites.length > 0 && (
                              <div className="course-prerequisites">
                                <strong>Prerequisites:</strong> {course.prerequisites.join(', ')}
                              </div>
                            )}
                            {!isCompleted && (
                              <button 
                                className="add-course-btn"
                                onClick={() => addCourse(course)}
                              >
                                Add Course
                              </button>
                            )}
                            {isCompleted && (
                              <span className="course-added-badge">Added</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Recommended Courses */}
                  {recommendedCourses.length > 0 && (
                    <div className="recommended-courses">
                      <h3>Recommended for Next Term</h3>
                      <div className="course-grid">
                        {recommendedCourses.map((course, index) => (
                          <div key={index} className="course-card recommended">
                            <div className="course-card-header">
                              <span className="course-card-code">{course.code}</span>
                              <span className="course-card-credits">{course.credits} credits</span>
                            </div>
                            <h4 className="course-card-name">{course.name}</h4>
                            <p className="course-card-description">{course.description}</p>
                            <button 
                              className="add-course-btn"
                              onClick={() => addCourse(course)}
                            >
                              Add Course
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlannerPage
