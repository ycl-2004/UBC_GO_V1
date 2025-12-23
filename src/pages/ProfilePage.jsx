import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { useAuth } from '../context/AuthContext'
import { facultyRequirements } from '../data/facultiesData'
import './ProfilePage.css'

const ProfilePage = () => {
  const { user, profile, updateProfile, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    studentNumber: '',
    faculty: '',
    major: '',
    yearLevel: '',
    targetGraduationYear: ''
  })
  
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  
  const majorOptions = {
    arts: [
      { value: 'economics', label: 'Economics' },
      { value: 'psychology', label: 'Psychology' },
      { value: 'politicalScience', label: 'Political Science' },
    ],
    science: [
      { value: 'computerScience', label: 'Computer Science' },
      { value: 'biology', label: 'Biology' },
      { value: 'chemistry', label: 'Chemistry' },
    ],
    sauder: [
      { value: 'commerce', label: 'Commerce' },
      { value: 'accounting', label: 'Accounting' },
    ],
    appliedScience: [
      { value: 'electricalEngineering', label: 'Electrical Engineering' },
      { value: 'computerEngineering', label: 'Computer Engineering' },
      { value: 'mechanicalEngineering', label: 'Mechanical Engineering' },
    ],
  }
  
  const yearLevels = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5+']
  const graduationYears = []
  const currentYear = new Date().getFullYear()
  for (let i = currentYear; i <= currentYear + 6; i++) {
    graduationYears.push(i.toString())
  }
  
  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        dateOfBirth: profile.date_of_birth || '',
        studentNumber: profile.student_number || '',
        faculty: profile.faculty || '',
        major: profile.major || '',
        yearLevel: profile.year_level || '',
        targetGraduationYear: profile.target_graduation_year || ''
      })
    } else if (user) {
      // Fallback to user email if profile not loaded yet
      setFormData(prev => ({
        ...prev,
        fullName: user.email?.split('@')[0] || ''
      }))
    }
  }, [profile, user])
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleStudentNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '') // Only allow digits
    if (value.length <= 8) {
      setFormData(prev => ({
        ...prev,
        studentNumber: value
      }))
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate student number if provided
    if (formData.studentNumber && formData.studentNumber.length !== 8) {
      showToastNotification('Student number must be 8 digits', 'error')
      return
    }
    
    try {
      const result = await updateProfile({
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth || null,
        student_number: formData.studentNumber || null,
        faculty: formData.faculty || null,
        major: formData.major || null,
        year_level: formData.yearLevel || null,
        target_graduation_year: formData.targetGraduationYear || null,
      })
      
      if (result.success) {
        showToastNotification('Profile updated successfully!', 'success')
      } else {
        showToastNotification(result.error || 'Failed to update profile. Please try again.', 'error')
      }
    } catch (error) {
      showToastNotification('Failed to update profile. Please try again.', 'error')
    }
  }
  
  const showToastNotification = (message, type = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }
  
  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  
  const calculateDegreeProgress = () => {
    // Mock calculation - in real app, this would come from planner data
    // For now, return a placeholder
    return 15
  }
  
  const availableMajors = formData.faculty ? (majorOptions[formData.faculty] || []) : []
  
  if (!isAuthenticated || !user) {
    return null
  }
  
  return (
    <div className="profile-page">
      <Navigation />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p className="subtitle">Manage your personal information and academic details</p>
        </div>
        
        <div className="profile-grid">
          {/* Left Column - Profile Card */}
          <div className="profile-card">
            <div className="avatar-container">
              <div className="avatar" style={{ backgroundColor: '#C5A069' }}>
                {getInitials(formData.fullName || user.name)}
              </div>
            </div>
            
            <div className="profile-info">
              <h2 className="profile-name">{formData.fullName || profile?.full_name || user?.email?.split('@')[0] || 'User'}</h2>
              <p className="profile-email">{user?.email}</p>
              <div className="profile-badge">
                <span className="badge">Student</span>
              </div>
            </div>
            
            {/* Degree Completion Progress */}
            <div className="degree-progress">
              <div className="progress-header">
                <span className="progress-label">Degree Completion</span>
                <span className="progress-percentage">{calculateDegreeProgress()}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${calculateDegreeProgress()}%` }}
                ></div>
              </div>
              <p className="progress-hint">
                Track your courses in the <a href="/planner">Degree Planner</a>
              </p>
            </div>
          </div>
          
          {/* Right Column - Edit Form */}
          <div className="profile-form-container">
            <div className="form-card">
              <h2 className="form-title">Personal Information</h2>
              
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="studentNumber">UBC Student Number (Optional)</label>
                  <input
                    type="text"
                    id="studentNumber"
                    name="studentNumber"
                    value={formData.studentNumber}
                    onChange={handleStudentNumberChange}
                    placeholder="8-digit number"
                    maxLength={8}
                  />
                  {formData.studentNumber && formData.studentNumber.length !== 8 && (
                    <span className="form-error">Student number must be 8 digits</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="faculty">Faculty</label>
                  <select
                    id="faculty"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                  >
                    <option value="">Select a faculty</option>
                    {Object.keys(facultyRequirements).map(key => (
                      <option key={key} value={key}>
                        {facultyRequirements[key].faculty}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="major">Major</label>
                  <select
                    id="major"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    disabled={!formData.faculty}
                  >
                    <option value="">Select a major</option>
                    {availableMajors.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {!formData.faculty && (
                    <span className="form-hint">Please select a faculty first</span>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="yearLevel">Year Level</label>
                  <select
                    id="yearLevel"
                    name="yearLevel"
                    value={formData.yearLevel}
                    onChange={handleChange}
                  >
                    <option value="">Select year level</option>
                    {yearLevels.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="targetGraduationYear">Target Graduation Year</label>
                  <select
                    id="targetGraduationYear"
                    name="targetGraduationYear"
                    value={formData.targetGraduationYear}
                    onChange={handleChange}
                  >
                    <option value="">Select graduation year</option>
                    {graduationYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div className={`toast toast-${toastType}`}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default ProfilePage

