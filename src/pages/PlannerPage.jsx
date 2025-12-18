import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { useAuth } from '../context/AuthContext'
import { storage } from '../utils/storage'
import { facultyRequirements, getCoursesByFaculty, getAllFaculties } from '../data/facultiesData'
import { artsCourses } from '../data/artsData'
import './PlannerPage.css'

const PlannerPage = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [selectedFaculty, setSelectedFaculty] = useState('arts')
  const [currentPlanId, setCurrentPlanId] = useState('default')
  const [planName, setPlanName] = useState('My Degree Plan')
  const [completedCourses, setCompletedCourses] = useState([])
  const [selectedYear, setSelectedYear] = useState('Year 1')
  const [selectedTerm, setSelectedTerm] = useState('Term 1')
  const [savedPlans, setSavedPlans] = useState([])
  const [showPlanManager, setShowPlanManager] = useState(false)

  // Load plans on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserPlans()
    } else {
      // Load from localStorage for guest users
      loadGuestPlan()
    }
  }, [isAuthenticated, user])

  // Save plan when courses change
  useEffect(() => {
    if (completedCourses.length > 0) {
      savePlan()
    }
  }, [completedCourses, selectedFaculty, planName])

  const loadUserPlans = () => {
    if (!user) return
    
    const plans = storage.getUserPlans(user.id)
    setSavedPlans(plans)
    
    if (plans.length > 0) {
      const firstPlan = plans[0]
      setCurrentPlanId(firstPlan.id)
      setPlanName(firstPlan.name || 'My Degree Plan')
      setSelectedFaculty(firstPlan.faculty || 'arts')
      setCompletedCourses(firstPlan.courses || [])
    }
  }

  const loadGuestPlan = () => {
    const saved = localStorage.getItem('guest_plan')
    if (saved) {
      const plan = JSON.parse(saved)
      setCompletedCourses(plan.courses || [])
      setSelectedFaculty(plan.faculty || 'arts')
    }
  }

  const savePlan = () => {
    const planData = {
      id: currentPlanId,
      name: planName,
      faculty: selectedFaculty,
      courses: completedCourses,
      updatedAt: new Date().toISOString()
    }

    if (isAuthenticated && user) {
      storage.savePlan(user.id, currentPlanId, planData)
      loadUserPlans()
    } else {
      // Save to localStorage for guest
      localStorage.setItem('guest_plan', JSON.stringify(planData))
    }
  }

  const createNewPlan = () => {
    const newPlanId = `plan_${Date.now()}`
    const newPlan = {
      id: newPlanId,
      name: `Plan ${savedPlans.length + 1}`,
      faculty: 'arts',
      courses: [],
      createdAt: new Date().toISOString()
    }
    
    if (isAuthenticated && user) {
      storage.savePlan(user.id, newPlanId, newPlan)
      setCurrentPlanId(newPlanId)
      setPlanName(newPlan.name)
      setCompletedCourses([])
      loadUserPlans()
    }
  }

  const loadPlan = (planId) => {
    if (!user) return
    
    const plan = storage.getPlan(user.id, planId)
    if (plan) {
      setCurrentPlanId(plan.id)
      setPlanName(plan.name)
      setSelectedFaculty(plan.faculty || 'arts')
      setCompletedCourses(plan.courses || [])
      setShowPlanManager(false)
    }
  }

  const deletePlan = (planId) => {
    if (!user || !window.confirm('Are you sure you want to delete this plan?')) return
    
    storage.deletePlan(user.id, planId)
    loadUserPlans()
    
    if (currentPlanId === planId && savedPlans.length > 1) {
      const remainingPlans = savedPlans.filter(p => p.id !== planId)
      if (remainingPlans.length > 0) {
        loadPlan(remainingPlans[0].id)
      } else {
        createNewPlan()
      }
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

  const removeCourse = (courseCode) => {
    setCompletedCourses(completedCourses.filter(c => c.code !== courseCode))
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
    const totalCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0)
    const progress = (totalCredits / requirements.totalCredits) * 100

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
      remainingCredits: requirements.totalCredits - totalCredits,
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
  const requirements = getCurrentRequirements()

  return (
    <div className="planner-page">
      <Navigation />
      <div className="planner-container">
        <div className="planner-header">
          <div className="header-top">
            <div>
              <h1>Degree Planner</h1>
              <p className="subtitle">{requirements.faculty} - Track your progress and plan your courses</p>
            </div>
            <div className="header-actions">
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

          {/* Plan Manager Modal */}
          {showPlanManager && isAuthenticated && (
            <div className="plan-manager">
              <div className="plan-manager-header">
                <h3>My Plans</h3>
                <button className="close-btn" onClick={() => setShowPlanManager(false)}>×</button>
              </div>
              <div className="plan-list">
                {savedPlans.map(plan => (
                  <div 
                    key={plan.id} 
                    className={`plan-item ${plan.id === currentPlanId ? 'active' : ''}`}
                  >
                    <div onClick={() => loadPlan(plan.id)}>
                      <h4>{plan.name}</h4>
                      <p>{facultyRequirements[plan.faculty]?.faculty || 'Unknown Faculty'}</p>
                      <small>{plan.courses?.length || 0} courses</small>
                    </div>
                    <button 
                      className="delete-plan-btn"
                      onClick={() => deletePlan(plan.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button className="btn-new-plan" onClick={createNewPlan}>
                  + New Plan
                </button>
              </div>
            </div>
          )}

          {/* Faculty Selector */}
          <div className="faculty-selector">
            <label htmlFor="faculty">Select Faculty:</label>
            <select 
              id="faculty"
              value={selectedFaculty} 
              onChange={(e) => {
                setSelectedFaculty(e.target.value)
                setCompletedCourses([]) // Reset courses when changing faculty
              }}
            >
              {getAllFaculties().map(facultyKey => (
                <option key={facultyKey} value={facultyKey}>
                  {facultyRequirements[facultyKey].faculty}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Name Editor */}
          {isAuthenticated && (
            <div className="plan-name-editor">
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Plan name"
                className="plan-name-input"
              />
            </div>
          )}
        </div>

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
              {requirements.requirements.communication && (
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

              {requirements.requirements.breadth?.science && (
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

              {requirements.requirements.breadth?.literature && (
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
            </div>

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
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlannerPage
