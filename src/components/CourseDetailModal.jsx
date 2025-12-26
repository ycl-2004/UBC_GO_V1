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

  const courseTitle = course.title || course.name || course.code

  return (
    <>
      <div className="course-modal-overlay" onClick={onClose} />
      <div className="course-modal">
        <div className="course-modal-header">
          <h2 className="course-modal-title">
            {course.code} {courseTitle && `- ${courseTitle}`}
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

          <div className="course-modal-section">
            <h3 className="course-modal-section-title">Prerequisites</h3>
            <RequirementParser text={course.prerequisites} />
          </div>

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

