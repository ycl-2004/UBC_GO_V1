import React, { useState, useMemo } from 'react'
import Navigation from '../components/Navigation'
import { standardFirstYearCourses, getAllMajors, getMajorByCode } from '../data/firstYearRequirements'
import { getAllScienceMajors, getScienceMajorYearCourses } from '../data/scienceCurriculum'
import './FirstYearGuide.css'

// CollapsibleSection Component
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="collapsible-section">
      <div 
        className="collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
      >
        <h2 className="collapsible-title">{title}</h2>
        <span className={`chevron-icon ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </div>
      {isOpen && (
        <div className="collapsible-content">
          {children}
        </div>
      )}
    </div>
  )
}

const FirstYearGuide = () => {
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [selectedMajor, setSelectedMajor] = useState('CIVL')
  const majors = getAllMajors()
  const selectedMajorData = getMajorByCode(selectedMajor)
  
  // Science faculty state
  const [selectedScienceMajor, setSelectedScienceMajor] = useState(null)
  const [selectedYearTab, setSelectedYearTab] = useState(1)
  const [scienceMajorSearch, setScienceMajorSearch] = useState('')
  const [showCommRequirementTooltip, setShowCommRequirementTooltip] = useState(null)
  const [isMajorSelectorExpanded, setIsMajorSelectorExpanded] = useState(true)
  
  const scienceMajors = getAllScienceMajors()
  
  // Filter Science majors based on search
  const filteredScienceMajors = useMemo(() => {
    if (!scienceMajorSearch.trim()) {
      return scienceMajors
    }
    const searchLower = scienceMajorSearch.toLowerCase()
    return scienceMajors.filter(major => 
      major.toLowerCase().includes(searchLower)
    )
  }, [scienceMajors, scienceMajorSearch])
  
  // Get courses for selected Science major and year
  // Special handling for Biotechnology and merged years
  const getDisplayedCourses = () => {
    if (!selectedScienceMajor) return []
    
    // Special handling for Biotechnology
    if (selectedScienceMajor === "Biotechnology") {
      if (selectedYearTab === 2) {
        // Year 2 & 3 at BCIT - combine Year 2 and Year 3 data
        const year2Data = getScienceMajorYearCourses(selectedScienceMajor, 2)
        const year3Data = getScienceMajorYearCourses(selectedScienceMajor, 3)
        // If Year 3 is empty, Year 2 already contains merged data
        // Otherwise, combine them
        return year3Data.length === 0 ? year2Data : [...year2Data, ...year3Data]
      } else if (selectedYearTab === 4) {
        // Year 4 & 5 - show Year 4 data (Year 5 is identical or will be created from Year 4)
        return getScienceMajorYearCourses(selectedScienceMajor, 4)
      } else {
        return getScienceMajorYearCourses(selectedScienceMajor, selectedYearTab)
      }
    }
    
    // Standard handling: If Year 3 and 4 are identical, show Year 3 data when Year 4 is selected
    const year3Courses = getScienceMajorYearCourses(selectedScienceMajor, 3)
    const year4Courses = getScienceMajorYearCourses(selectedScienceMajor, 4)
    const areMerged = JSON.stringify(year3Courses) === JSON.stringify(year4Courses) && year3Courses.length > 0
    
    if (selectedYearTab === 4 && areMerged) {
      // Year 3 and 4 are identical, show Year 3 data
      return year3Courses
    }
    
    return getScienceMajorYearCourses(selectedScienceMajor, selectedYearTab)
  }
  
  const scienceYearCourses = getDisplayedCourses()

  const faculties = [
    { id: 'Applied Science', name: 'Applied Science', icon: '🔧', available: true },
    { id: 'Science', name: 'Science', icon: '🔬', available: true },
    { id: 'Arts', name: 'Arts', icon: 'palette', available: false },
    { id: 'Commerce', name: 'Commerce', icon: '💼', available: false },
  ]

  const handleBackToFaculties = () => {
    setSelectedFaculty(null)
    setSelectedScienceMajor(null)
    setScienceMajorSearch('')
    setSelectedYearTab(1)
    setIsMajorSelectorExpanded(true) // Reset to expanded when going back
  }
  
  const handleScienceMajorSelect = (majorName) => {
    setSelectedScienceMajor(majorName)
    setScienceMajorSearch('')
    setSelectedYearTab(1) // Reset to Year 1 when selecting a new major
    setIsMajorSelectorExpanded(false) // Collapse the grid when a major is selected
  }
  
  const handleChangeMajor = () => {
    setIsMajorSelectorExpanded(true) // Expand the grid to allow changing major
  }

  return (
    <div className="first-year-guide-page">
      <Navigation />
      <div className="first-year-container">
        <div className="first-year-header">
          <h1>First Year Guide</h1>
          <p className="subtitle">
            {selectedFaculty 
              ? `${selectedFaculty} - Standard First Year Curriculum and Second-Year Major Prerequisites`
              : 'Select your faculty to view first-year curriculum and prerequisites'
            }
          </p>
        </div>

        {/* Step 1: Faculty Selection View */}
        {!selectedFaculty && (
          <section className="faculty-selection-section">
            <h2>Choose Your Faculty</h2>
            <p className="section-description">
              Select a faculty to view the standard first-year curriculum and prerequisites for second-year specializations.
            </p>
            <div className="faculty-cards-grid">
              {faculties.map((faculty) => (
                <div
                  key={faculty.id}
                  className={`faculty-card ${faculty.available ? 'available' : 'coming-soon'}`}
                  onClick={() => faculty.available && setSelectedFaculty(faculty.id)}
                >
                  <div className="faculty-icon">{faculty.icon}</div>
                  <h3 className="faculty-name">{faculty.name}</h3>
                  {faculty.available ? (
                    <span className="faculty-status available-status">Available</span>
                  ) : (
                    <span className="faculty-status coming-soon-status">Coming Soon</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step 2: Faculty Details View */}
        {selectedFaculty === 'Applied Science' && (
          <>
            <button className="back-to-faculties-btn" onClick={handleBackToFaculties}>
              ← Back to Faculties
            </button>

            {/* Section 1: Standard Curriculum */}
            <CollapsibleSection title="Standard First Year Engineering Curriculum" defaultOpen={true}>
              <div className="curriculum-table-wrapper">
                <table className="curriculum-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Credits</th>
                      <th>Title</th>
                      <th>Included in Timetable?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standardFirstYearCourses.map((course, index) => (
                      <tr key={index}>
                        <td className="course-code">{course.code}</td>
                        <td className="course-credits">{course.credits} cr</td>
                        <td className="course-title">{course.title}</td>
                        <td className="course-timetable">
                          {course.inTimetable ? (
                            <span className="badge-yes">Yes</span>
                          ) : (
                            <span className="badge-no">No - Student must register</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleSection>

            {/* Section 2: Complementary Studies Info */}
            <section className="complementary-studies-section">
              <div className="info-card">
                <div className="info-card-header">
                  <h3>Humanities/Social Science Elective</h3>
                </div>
                <div className="info-card-body">
                  <p>
                    One course totalling <strong>3 credits</strong>. This is a non-scientific and non-technical course generally found in the Faculty of Arts.
                  </p>
                  <p className="recommendation">
                    <strong>Recommended:</strong> Select a 100-level course.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Second-Year Major Prerequisites */}
            <CollapsibleSection title="Second-Year Major Prerequisites" defaultOpen={false}>
              <p className="section-description">
                Select your target major to see which First Year courses are critical prerequisites for that specialization.
              </p>
              
              <div className="major-selector">
                <label htmlFor="major-select">Target Major:</label>
                <select
                  id="major-select"
                  value={selectedMajor}
                  onChange={(e) => setSelectedMajor(e.target.value)}
                  className="major-dropdown"
                >
                  {majors.map((major) => (
                    <option key={major.majorCode} value={major.majorCode}>
                      {major.majorName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMajorData && selectedMajorData.prerequisites.length > 0 ? (
                <div className="prerequisites-table-wrapper">
                  <h3 className="major-title">{selectedMajorData.majorName} Prerequisites</h3>
                  <table className="prerequisites-table">
                    <thead>
                      <tr>
                        <th>First-Year Course</th>
                        <th>Direct Pre-Req For...</th>
                        <th>Affected Courses (Chain Reaction)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMajorData.prerequisites.map((prereq, index) => (
                        <tr key={index}>
                          <td className="first-year-course">{prereq.firstYearCourse}</td>
                          <td className="direct-prereq">{prereq.directPrereqFor}</td>
                          <td className="affected-courses">
                            {prereq.affectedCourses && prereq.affectedCourses.length > 0 ? (
                              <ul>
                                {prereq.affectedCourses.map((course, idx) => (
                                  <li key={idx}>{course}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="no-affected">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-prerequisites-message">
                  <p>Prerequisites for {selectedMajorData?.majorName} are not yet available. Check back soon!</p>
                </div>
              )}
            </CollapsibleSection>
          </>
        )}

        {/* Science Faculty View */}
        {selectedFaculty === 'Science' && (
          <>
            <button className="back-to-faculties-btn" onClick={handleBackToFaculties}>
              ← Back to Faculties
            </button>

            {/* Major Selector */}
            <section className={`science-major-selector-section ${!isMajorSelectorExpanded ? 'collapsed' : ''}`}>
              <div className="science-major-header">
                <div className="science-major-header-content">
                  <h2>
                    {selectedScienceMajor ? `Selected: ${selectedScienceMajor}` : 'Select Your Science Major'}
                  </h2>
                  {selectedScienceMajor && (
                    <button 
                      className="change-major-button"
                      onClick={handleChangeMajor}
                    >
                      {isMajorSelectorExpanded ? 'Hide List' : 'Change Major'}
                    </button>
                  )}
                </div>
              </div>

              <div className={`science-major-selector-content ${isMajorSelectorExpanded ? 'expanded' : 'collapsed'}`}>
                <p className="section-description">
                  Choose a specialization to view the curriculum requirements for each year.
                </p>
                
                <div className="science-major-search-wrapper">
                  <input
                    type="text"
                    className="science-major-search"
                    placeholder="Search for a major (e.g., Computer Science, Biology)..."
                    value={scienceMajorSearch}
                    onChange={(e) => setScienceMajorSearch(e.target.value)}
                  />
                </div>

                {scienceMajorSearch && filteredScienceMajors.length === 0 && (
                  <p className="no-results-message">No majors found matching "{scienceMajorSearch}"</p>
                )}

                <div className="science-major-grid">
                  {filteredScienceMajors.map((major) => (
                    <button
                      key={major}
                      className={`science-major-button ${selectedScienceMajor === major ? 'selected' : ''}`}
                      onClick={() => handleScienceMajorSelect(major)}
                    >
                      {major}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Curriculum Display */}
            {selectedScienceMajor ? (
              <CollapsibleSection title={`${selectedScienceMajor} - Degree Requirements`} defaultOpen={true}>
                {/* Year Tabs */}
                <div className="year-tabs-container">
                  {(() => {
                    // Special handling for Biotechnology: Year 1, Year 2 & 3 (at BCIT), Year 4 & 5
                    if (selectedScienceMajor === "Biotechnology") {
                      const year2Data = getScienceMajorYearCourses(selectedScienceMajor, 2)
                      const year3Data = getScienceMajorYearCourses(selectedScienceMajor, 3)
                      const year4Data = getScienceMajorYearCourses(selectedScienceMajor, 4)
                      const year5Data = getScienceMajorYearCourses(selectedScienceMajor, 5)
                      
                      // Year 2 & 3 are merged (at BCIT campus)
                      // Show if Year 2 has data
                      const showYear2And3 = year2Data.length > 0
                      
                      // Year 4 & 5 are merged
                      // Show if Year 4 has data and (Year 5 exists and matches, OR Year 3 and Year 4 are identical)
                      const year4MatchesYear3 = year3Data.length > 0 && JSON.stringify(year4Data) === JSON.stringify(year3Data)
                      const year4MatchesYear5 = year5Data.length > 0 && JSON.stringify(year4Data) === JSON.stringify(year5Data)
                      const showYear4And5 = year4Data.length > 0 && (year4MatchesYear5 || (year5Data.length === 0 && year4MatchesYear3))
                      
                      return (
                        <>
                          {/* Year 1 - Always show */}
                          <button
                            key="year-1"
                            className={`year-tab ${selectedYearTab === 1 ? 'active' : ''}`}
                            onClick={() => setSelectedYearTab(1)}
                          >
                            Year 1
                          </button>
                          
                          {/* Year 2 & 3 at BCIT */}
                          {showYear2And3 && (
                            <button
                              key="year-2-3"
                              className={`year-tab ${selectedYearTab === 2 ? 'active' : ''}`}
                              onClick={() => setSelectedYearTab(2)}
                            >
                              Year 2 & 3 at BICT campus
                            </button>
                          )}
                          
                          {/* Year 4 & 5 */}
                          {showYear4And5 && (
                            <button
                              key="year-4-5"
                              className={`year-tab ${selectedYearTab === 4 ? 'active' : ''}`}
                              onClick={() => setSelectedYearTab(4)}
                            >
                              Year 4 & 5
                            </button>
                          )}
                        </>
                      )
                    }
                    
                    // Standard handling for other majors
                    return [1, 2, 3, 4].map((year) => {
                      // Check if this year should be merged with the next year
                      const majorData = getScienceMajorYearCourses(selectedScienceMajor, year)
                      const nextYearData = year < 4 ? getScienceMajorYearCourses(selectedScienceMajor, year + 1) : []
                      const isMerged = year === 3 && JSON.stringify(majorData) === JSON.stringify(nextYearData) && majorData.length > 0
                      const shouldHide = year === 4 && JSON.stringify(getScienceMajorYearCourses(selectedScienceMajor, 3)) === JSON.stringify(getScienceMajorYearCourses(selectedScienceMajor, 4)) && getScienceMajorYearCourses(selectedScienceMajor, 3).length > 0
                      
                      if (shouldHide) return null
                      
                      return (
                        <button
                          key={year}
                          className={`year-tab ${selectedYearTab === year ? 'active' : ''}`}
                          onClick={() => setSelectedYearTab(year)}
                        >
                          {isMerged ? `Year ${year} & ${year + 1}` : `Year ${year}`}
                        </button>
                      )
                    })
                  })()}
                </div>

                {/* Curriculum Table */}
                <div className="curriculum-table-wrapper science-curriculum-table">
                  {scienceYearCourses.length > 0 ? (
                    <table className="curriculum-table">
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Credits</th>
                          <th>Title / Notes</th>
                        </tr>
                      </thead>
                      <tbody 
                        key={`year-${selectedYearTab}`}
                        className="science-curriculum-tbody"
                      >
                        {scienceYearCourses.map((course, index) => (
                          <tr key={index} className="science-course-row">
                            <td className="course-code">
                              {course.code}
                              {course.code === 'Communication Requirement' || 
                               course.code === 'Additional Communication Requirement' ? (
                                <span 
                                  className="comm-req-info-icon"
                                  onMouseEnter={() => setShowCommRequirementTooltip(index)}
                                  onMouseLeave={() => setShowCommRequirementTooltip(null)}
                                >
                                  ℹ️
                                  {showCommRequirementTooltip === index && course.notes && (
                                    <div className="comm-req-tooltip">
                                      <div className="tooltip-arrow"></div>
                                      <div className="tooltip-content">
                                        <strong>Acceptable Courses:</strong>
                                        <div className="tooltip-courses">{course.notes}</div>
                                      </div>
                                    </div>
                                  )}
                                </span>
                              ) : null}
                              {course.code === 'Electives' && course.notes && (
                                <span 
                                  className="elective-info-icon"
                                  title={course.notes}
                                >
                                  ℹ️
                                </span>
                              )}
                            </td>
                            <td className="course-credits">{course.credits} cr</td>
                            <td className="course-title">
                              {course.title && <span className="course-title-text">{course.title}</span>}
                              {course.notes && course.code !== 'Communication Requirement' && 
                               course.code !== 'Additional Communication Requirement' && (
                                <span className="course-notes">{course.notes}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-courses-message">
                      <p>No courses found for Year {selectedYearTab} of {selectedScienceMajor}.</p>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            ) : (
              <section className="empty-state-section">
                <div className="empty-state-message">
                  <p>Select a specialization to view your path.</p>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FirstYearGuide

