// Arts Curriculum Data Module
// Provides helper functions to access Arts major curriculum data

import artsCurriculumData from './curriculum/arts/arts_curriculum.json'

/**
 * Get curriculum data for a specific Arts major
 * @param {string} majorName - The name of the major (e.g., "Anthropology")
 * @returns {Object|null} - Curriculum data with years 1-4, or null if not found
 */
export const getArtsMajor = (majorName) => {
  if (!artsCurriculumData || !artsCurriculumData[majorName]) {
    return null
  }
  
  return artsCurriculumData[majorName]
}

/**
 * Get all available Arts majors with curriculum data
 * @returns {Array<string>} - Array of major names
 */
export const getAllArtsMajorsWithCurriculum = () => {
  if (!artsCurriculumData) {
    return []
  }
  
  return Object.keys(artsCurriculumData).sort()
}

/**
 * Get courses for a specific major and year
 * @param {string} majorName - The name of the major
 * @param {number} year - The year (1, 2, 3, 4)
 * @returns {Array} - Array of course objects for that year
 */
export const getArtsMajorYearCourses = (majorName, year) => {
  const majorData = getArtsMajor(majorName)
  if (!majorData) {
    return []
  }
  
  const yearKey = String(year)
  return majorData[yearKey] || []
}

/**
 * Check if a major has curriculum data
 * @param {string} majorName - The name of the major
 * @returns {boolean} - True if major exists
 */
export const hasArtsMajor = (majorName) => {
  return artsCurriculumData && majorName in artsCurriculumData
}
