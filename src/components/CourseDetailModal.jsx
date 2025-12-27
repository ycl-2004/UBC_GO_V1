import React from 'react'
import RequirementParser from './RequirementParser'
import './CourseDetailModal.css'

const CourseDetailModal = ({ course, isOpen, onClose }) => {
  if (!isOpen || !course) return null

  // Parse course code to extract subject and number for UBCGrades URL
  const parseCourseCode = (code) => {
    if (!code) return { subject: '', number: '' }
    const match = code.match(/^([A-Z]{2,4})\s+(\d{3}[A-Z]?)$/)
    if (match) {
      return {
        subject: match[1],
        number: match[2]
      }
    }
    return { subject: '', number: '' }
  }

  const { subject, number } = parseCourseCode(course.code)
  const ubcGradesUrl = subject && number 
    ? `https://ubcgrades.com/statistics/by-course/${subject}/${number}`
    : null

  // Check if prerequisites field already contains corequisites
  const prerequisitesText = course.prerequisites || ''
  const hasCorequisitesInPrereqs = prerequisitesText.toLowerCase().includes('corequisites:') || 
                                    prerequisitesText.toLowerCase().includes('co-requisites:')
  
  // Only show separate corequisites section if:
  // 1. corequisites field exists AND
  // 2. prerequisites field doesn't already contain corequisites
  const shouldShowSeparateCorequisites = course.corequisites && !hasCorequisitesInPrereqs

  return (
    <>
      <div className="course-modal-overlay" onClick={onClose} />
      <div className="course-modal">
        <div className="course-modal-header">
          <h2 className="course-modal-title">
            {course.code}
          </h2>
          <button className="course-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="course-modal-body">
          {course.description ? (
            <div className="course-modal-section">
              <h3 className="course-modal-section-title">Description</h3>
              <p className="course-modal-description">{course.description}</p>
            </div>
          ) : (
            <div className="course-modal-section">
              <p className="course-modal-description course-modal-no-data">
                No description available.
              </p>
            </div>
          )}

          {/* Prerequisites Section */}
          {course.prerequisites && (
            <div className="course-modal-section">
              <h3 className="course-modal-section-title">Prerequisites</h3>
              <RequirementParser text={course.prerequisites} />
            </div>
          )}

          {/* Corequisites Section - Show separately only if not already in prerequisites */}
          {shouldShowSeparateCorequisites && (
            <div className="course-modal-section">
              <h3 className="course-modal-section-title">Corequisites</h3>
              <RequirementParser text={course.corequisites} />
            </div>
          )}

          {/* If no prerequisites or corequisites, show message */}
          {!course.prerequisites && !shouldShowSeparateCorequisites && (
            <div className="course-modal-section">
              <h3 className="course-modal-section-title">Prerequisites</h3>
              <p className="text-gray-500 italic">None</p>
            </div>
          )}

          {ubcGradesUrl && (
            <div className="course-modal-section">
              <a
                href={ubcGradesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="course-modal-ubc-grades-btn"
              >
                Check Grades on UBCGrades
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CourseDetailModal