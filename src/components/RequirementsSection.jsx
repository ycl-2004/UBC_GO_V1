import React, { useState, useEffect } from 'react'
import './RequirementsSection.css'

const RequirementsSection = ({ selectedFaculty, selectedDegree }) => {
  const [selectedProvince, setSelectedProvince] = useState('British Columbia')
  const [requirements, setRequirements] = useState(null)
  const [loading, setLoading] = useState(true)

  const provinces = [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland & Labrador',
    'Northwest Territories',
    'Nova Scotia',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon'
  ]

  useEffect(() => {
    loadRequirements()
  }, [selectedProvince, selectedFaculty, selectedDegree])

  const loadRequirements = async () => {
    setLoading(true)
    try {
      // Try to load from JSON file
      const response = await fetch('/src/data/detailed_requirements.json')
      if (response.ok) {
        const data = await response.json()
        setRequirements(data)
      } else {
        // Use fallback data if JSON not available
        setRequirements(getFallbackRequirements())
      }
    } catch (error) {
      console.log('Using fallback requirements data')
      setRequirements(getFallbackRequirements())
    }
    setLoading(false)
  }

  const getFallbackRequirements = () => {
    // Fallback data based on UBC official requirements
    return {
      general_requirements: {
        requirements_list: [
          'Graduation from high school',
          'Minimum of 70% in Grade 11 or Grade 12 English (or their equivalents)',
          'At least six academic/non-academic Grade 12 courses (recommended, but not required)'
        ]
      },
      provinces: {
        'British Columbia': {
          name: 'British Columbia',
          general_requirements: {
            requirements_list: [
              'Graduation from high school',
              'Minimum of 70% in English Studies 12 or English First Peoples 12',
              'At least four additional Grade 12 courses'
            ]
          },
          degrees: {
            arts: {
              'Arts': {
                grade_12_requirements: ['English 12'],
                related_courses: [
                  'Language Arts',
                  'Mathematics and Computation',
                  'Second Languages',
                  'Social Studies',
                  'Visual and Performing Arts'
                ]
              }
            },
            science: {
              'Science': {
                grade_12_requirements: [
                  'English 12',
                  'Pre-Calculus 12 or Calculus 12',
                  'Chemistry 12',
                  'Physics 12'
                ],
                related_courses: [
                  'Mathematics',
                  'Chemistry',
                  'Physics',
                  'Biology'
                ]
              }
            },
            sauder: {
              'Commerce': {
                grade_12_requirements: [
                  'English 12',
                  'Pre-Calculus 12 or Calculus 12'
                ],
                related_courses: [
                  'Mathematics',
                  'Social Studies',
                  'Language Arts'
                ]
              }
            }
          }
        }
      }
    }
  }

  const getCurrentRequirements = () => {
    if (!requirements) return null

    const provinceData = requirements.provinces?.[selectedProvince]
    if (!provinceData) return null

    const facultyDegrees = provinceData.degrees?.[selectedFaculty]
    if (!facultyDegrees) return null

    // Get first degree if specific degree not found
    const degreeData = facultyDegrees[selectedDegree] || Object.values(facultyDegrees)[0]
    
    return {
      general: provinceData.general_requirements,
      degree: degreeData
    }
  }

  const currentReqs = getCurrentRequirements()

  if (loading) {
    return (
      <div className="requirements-section loading">
        <h2>Admission Requirements</h2>
        <p>Loading requirements...</p>
      </div>
    )
  }

  return (
    <div className="requirements-section">
      <div className="requirements-header">
        <h2>Admission Requirements</h2>
        <p className="requirements-subtitle">
          Based on official UBC admission standards for Canadian high school students
        </p>
      </div>

      <div className="province-selector-container">
        <label htmlFor="province-select">Select Your Province:</label>
        <select
          id="province-select"
          value={selectedProvince}
          onChange={(e) => setSelectedProvince(e.target.value)}
          className="province-select"
        >
          {provinces.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </div>

      {currentReqs && (
        <>
          {/* General Requirements */}
          <div className="requirements-card">
            <h3>
              <span className="requirement-icon">📋</span>
              General Admission Requirements
            </h3>
            <ul className="requirements-list">
              {(currentReqs.general?.requirements_list || requirements.general_requirements?.requirements_list || []).map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
            <div className="requirement-note">
              <strong>Note:</strong> UBC considers your grades in all academic Grade 11 and Grade 12 classes, paying special attention to courses that relate to the degree you're applying to.
            </div>
          </div>

          {/* Degree-Specific Requirements */}
          {currentReqs.degree && (
            <div className="requirements-card degree-specific">
              <h3>
                <span className="requirement-icon">🎓</span>
                Degree-Specific Requirements
              </h3>

              {currentReqs.degree.grade_12_requirements && currentReqs.degree.grade_12_requirements.length > 0 && (
                <div className="requirement-subsection">
                  <h4>Grade 12 Requirements</h4>
                  <ul className="requirements-list highlight">
                    {currentReqs.degree.grade_12_requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentReqs.degree.grade_11_requirements && currentReqs.degree.grade_11_requirements.length > 0 && (
                <div className="requirement-subsection">
                  <h4>Grade 11 Requirements</h4>
                  <ul className="requirements-list">
                    {currentReqs.degree.grade_11_requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentReqs.degree.related_courses && currentReqs.degree.related_courses.length > 0 && (
                <div className="requirement-subsection">
                  <h4>Related Courses</h4>
                  <p className="subsection-intro">
                    The following subject categories are particularly relevant for this degree. 
                    Consider taking courses in these areas in Grade 11 and Grade 12.
                  </p>
                  <ul className="requirements-list related">
                    {currentReqs.degree.related_courses.map((course, index) => (
                      <li key={index}>{course}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentReqs.degree.additional_info && (
                <div className="requirement-note">
                  {currentReqs.degree.additional_info}
                </div>
              )}
            </div>
          )}

          {/* Important Links */}
          <div className="requirements-card links-card">
            <h3>
              <span className="requirement-icon">🔗</span>
              Important Information
            </h3>
            <ul className="info-links">
              <li>
                <a 
                  href="https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Official UBC Admission Requirements →
                </a>
              </li>
              <li>
                <a 
                  href="https://you.ubc.ca/applying-ubc/requirements/english-language-competency/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  English Language Requirements →
                </a>
              </li>
              <li>
                <a 
                  href="https://you.ubc.ca/applying-ubc/how-to-apply/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  How to Apply to UBC →
                </a>
              </li>
            </ul>
            <div className="disclaimer">
              <strong>Disclaimer:</strong> Requirements shown are based on UBC's official admission standards. 
              Please visit the official UBC website for the most up-to-date information and to verify all requirements.
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default RequirementsSection

