// Science Curriculum Data Module
// Provides helper functions to access Science major curriculum data

import scienceCurriculumData from './curriculum/science/science_curriculum.json'

/**
 * Get curriculum data for a specific Science major
 * @param {string} majorName - The name of the major (e.g., "Computer Science")
 * @returns {Object|null} - Curriculum data with years 1-4, or null if not found
 */
export const getScienceMajor = (majorName) => {
  if (!scienceCurriculumData || !scienceCurriculumData[majorName]) {
    return null
  }
  
  return scienceCurriculumData[majorName]
}

/**
 * Get all available Science majors
 * @returns {Array<string>} - Array of major names
 */
export const getAllScienceMajors = () => {
  if (!scienceCurriculumData) {
    return []
  }
  
  return Object.keys(scienceCurriculumData).sort()
}

/**
 * Get courses for a specific major and year
 * @param {string} majorName - The name of the major
 * @param {number} year - The year (1, 2, 3, or 4)
 * @returns {Array} - Array of course objects for that year
 */
export const getScienceMajorYearCourses = (majorName, year) => {
  const majorData = getScienceMajor(majorName)
  if (!majorData) {
    return []
  }
  
  const yearKey = String(year)
  return majorData[yearKey] || []
}

/**
 * Check if a major exists
 * @param {string} majorName - The name of the major
 * @returns {boolean} - True if major exists
 */
export const hasScienceMajor = (majorName) => {
  return scienceCurriculumData && majorName in scienceCurriculumData
}

