import React, { useState } from 'react'
import Navigation from '../components/Navigation'
import { standardFirstYearCourses, getAllMajors, getMajorByCode } from '../data/firstYearRequirements'
import './FirstYearGuide.css'

const FirstYearGuide = () => {
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [selectedMajor, setSelectedMajor] = useState('CIVL')
  const majors = getAllMajors()
  const selectedMajorData = getMajorByCode(selectedMajor)

  const faculties = [
    { id: 'Applied Science', name: 'Applied Science', icon: '🔧', available: true },
    { id: 'Science', name: 'Science', icon: '🔬', available: false },
    { id: 'Arts', name: 'Arts', icon: '🎨', available: false },
    { id: 'Commerce', name: 'Commerce', icon: '💼', available: false },
  ]

  const handleBackToFaculties = () => {
    setSelectedFaculty(null)
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
            <section className="curriculum-section">
              <h2>Standard First Year Engineering Curriculum</h2>
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
            </section>

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
            <section className="prerequisites-section">
              <h2>Second-Year Major Prerequisites</h2>
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
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default FirstYearGuide

