/**
 * Utility functions for comparing admission scenarios
 * Provides sensitivity analysis and difference calculations
 * Supports both AI-powered analysis (Gemini) and fallback estimated analysis
 */

import { getAIComparison, isAIAvailable } from '../services/aiAnalysisService'

/**
 * Find differences between two input objects
 * @param {Object} inputsA - First scenario inputs
 * @param {Object} inputsB - Second scenario inputs
 * @returns {Object} Object containing all input differences
 */
export function findInputDifferences(inputsA, inputsB) {
  const differences = {}
  
  // Compare numeric values
  const numericFields = ['gpa', 'extracurriculars', 'leadership', 'volunteering', 'supplementScore']
  numericFields.forEach(field => {
    const valA = parseFloat(inputsA[field]) || 0
    const valB = parseFloat(inputsB[field]) || 0
    if (valA !== valB) {
      differences[field] = {
        from: valA,
        to: valB,
        delta: valB - valA
      }
    }
  })
  
  // Compare string/enum values
  const stringFields = ['courseDifficulty', 'applicantType', 'gradeTrend', 'activityRelevance', 'roleDepth']
  stringFields.forEach(field => {
    if (inputsA[field] !== inputsB[field]) {
      differences[field] = {
        from: inputsA[field],
        to: inputsB[field]
      }
    }
  })
  
  // Compare course status
  if (inputsA.courseStatus && inputsB.courseStatus) {
    const courseStatusDiff = {}
    const allCourses = new Set([
      ...Object.keys(inputsA.courseStatus || {}),
      ...Object.keys(inputsB.courseStatus || {})
    ])
    
    allCourses.forEach(course => {
      const statusA = inputsA.courseStatus[course]
      const statusB = inputsB.courseStatus[course]
      if (statusA !== statusB) {
        courseStatusDiff[course] = {
          from: statusA,
          to: statusB
        }
      }
    })
    
    if (Object.keys(courseStatusDiff).length > 0) {
      differences.courseStatus = courseStatusDiff
    }
  }
  
  // Compare core subject scores
  if (inputsA.coreSubjectScores && inputsB.coreSubjectScores) {
    const coreScoresDiff = {}
    const allSubjects = new Set([
      ...Object.keys(inputsA.coreSubjectScores || {}),
      ...Object.keys(inputsB.coreSubjectScores || {})
    ])
    
    allSubjects.forEach(subject => {
      const scoreA = parseFloat(inputsA.coreSubjectScores[subject]) || 0
      const scoreB = parseFloat(inputsB.coreSubjectScores[subject]) || 0
      if (scoreA !== scoreB) {
        coreScoresDiff[subject] = {
          from: scoreA,
          to: scoreB,
          delta: scoreB - scoreA
        }
      }
    })
    
    if (Object.keys(coreScoresDiff).length > 0) {
      differences.coreSubjectScores = coreScoresDiff
    }
  }
  
  return differences
}

/**
 * Calculate result differences between two scenarios
 * @param {Object} resultsA - First scenario results
 * @param {Object} resultsB - Second scenario results
 * @returns {Object} Object containing all result differences
 */
export function calculateResultDifferences(resultsA, resultsB) {
  return {
    probability: {
      from: resultsA.percentage || 0,
      to: resultsB.percentage || 0,
      delta: (resultsB.percentage || 0) - (resultsA.percentage || 0)
    },
    probabilityRange: {
      from: resultsA.percentageRange || { low: 0, high: 0 },
      to: resultsB.percentageRange || { low: 0, high: 0 }
    },
    finalScore: {
      from: resultsA.finalScore || 0,
      to: resultsB.finalScore || 0,
      delta: (resultsB.finalScore || 0) - (resultsA.finalScore || 0)
    },
    academicScore: {
      from: resultsA.academicScore || 0,
      to: resultsB.academicScore || 0,
      delta: (resultsB.academicScore || 0) - (resultsA.academicScore || 0)
    },
    profileScore: {
      from: resultsA.profileScore || 0,
      to: resultsB.profileScore || 0,
      delta: (resultsB.profileScore || 0) - (resultsA.profileScore || 0)
    },
    supplementScore: {
      from: resultsA.supplementScore || null,
      to: resultsB.supplementScore || null,
      delta: (resultsB.supplementScore || null) - (resultsA.supplementScore || null)
    },
    chance: {
      from: resultsA.chance || 'Low',
      to: resultsB.chance || 'Low'
    },
    category: {
      from: resultsA.category || 'Reach',
      to: resultsB.category || 'Reach'
    }
  }
}

/**
 * Identify the primary driver of change between scenarios
 * @param {Object} inputDiffs - Input differences
 * @param {Object} resultDiffs - Result differences
 * @returns {Object} Primary driver information
 */
export function identifyPrimaryDriver(inputDiffs, resultDiffs) {
  const drivers = []
  
  // Calculate impact of each input change on final score
  const finalScoreDelta = resultDiffs.finalScore.delta
  
  // GPA impact (usually highest weight)
  if (inputDiffs.gpa) {
    const gpaImpact = (inputDiffs.gpa.delta / 100) * 0.7 // Assuming 70% weight
    drivers.push({
      field: 'gpa',
      label: 'GPA / Average',
      inputDelta: inputDiffs.gpa.delta,
      estimatedImpact: gpaImpact,
      percentage: (gpaImpact / Math.abs(finalScoreDelta)) * 100
    })
  }
  
  // Core subject scores impact
  if (inputDiffs.coreSubjectScores) {
    Object.entries(inputDiffs.coreSubjectScores).forEach(([subject, diff]) => {
      const subjectImpact = (diff.delta / 100) * 0.3 // Rough estimate
      drivers.push({
        field: `core_${subject}`,
        label: `${subject} Score`,
        inputDelta: diff.delta,
        estimatedImpact: subjectImpact,
        percentage: (subjectImpact / Math.abs(finalScoreDelta)) * 100
      })
    })
  }
  
  // Profile scores impact
  const profileFields = ['extracurriculars', 'leadership', 'volunteering']
  profileFields.forEach(field => {
    if (inputDiffs[field]) {
      const profileImpact = (inputDiffs[field].delta / 5) * 0.1 // Rough estimate
      drivers.push({
        field: field,
        label: field.charAt(0).toUpperCase() + field.slice(1),
        inputDelta: inputDiffs[field].delta,
        estimatedImpact: profileImpact,
        percentage: (profileImpact / Math.abs(finalScoreDelta)) * 100
      })
    }
  })
  
  // Course difficulty impact
  if (inputDiffs.courseDifficulty) {
    const difficultyMap = { regular: 0, ap: 3, ib: 5 }
    const impact = (difficultyMap[inputDiffs.courseDifficulty.to] || 0) - 
                   (difficultyMap[inputDiffs.courseDifficulty.from] || 0)
    drivers.push({
      field: 'courseDifficulty',
      label: 'Course Difficulty',
      inputDelta: impact,
      estimatedImpact: impact * 0.05,
      percentage: (impact * 0.05 / Math.abs(finalScoreDelta)) * 100
    })
  }
  
  // Find primary driver (highest percentage impact)
  if (drivers.length === 0) {
    return null
  }
  
  const primaryDriver = drivers.reduce((max, driver) => 
    Math.abs(driver.percentage) > Math.abs(max.percentage) ? driver : max
  )
  
  return {
    ...primaryDriver,
    allDrivers: drivers.sort((a, b) => Math.abs(b.percentage) - Math.abs(a.percentage))
  }
}

/**
 * Generate recommendations based on comparison
 * @param {Object} primaryDriver - Primary driver information
 * @param {Object} resultDiffs - Result differences
 * @returns {Array} Array of recommendation strings
 */
export function generateRecommendations(primaryDriver, resultDiffs) {
  const recommendations = []
  
  if (!primaryDriver) {
    return recommendations
  }
  
  const probabilityDelta = resultDiffs.probability.delta
  
  if (probabilityDelta > 0) {
    // Improvement scenario
    if (primaryDriver.field === 'gpa') {
      recommendations.push(
        `GPA提升 ${primaryDriver.inputDelta.toFixed(1)}% 贡献了录取概率增长的 ${Math.abs(primaryDriver.percentage).toFixed(0)}%`
      )
    } else if (primaryDriver.field.startsWith('core_')) {
      const subject = primaryDriver.label
      recommendations.push(
        `${subject}提升 ${primaryDriver.inputDelta.toFixed(1)}% 贡献了录取概率增长的 ${Math.abs(primaryDriver.percentage).toFixed(0)}%`
      )
    } else {
      recommendations.push(
        `${primaryDriver.label}的改进贡献了录取概率增长的 ${Math.abs(primaryDriver.percentage).toFixed(0)}%`
      )
    }
  } else if (probabilityDelta < 0) {
    // Decline scenario
    recommendations.push(
      `${primaryDriver.label}的变化导致了录取概率下降 ${Math.abs(probabilityDelta).toFixed(1)}%`
    )
  }
  
  // Add secondary recommendations from other drivers
  if (primaryDriver.allDrivers && primaryDriver.allDrivers.length > 1) {
    const secondaryDrivers = primaryDriver.allDrivers.slice(1, 3) // Top 2-3 drivers
    secondaryDrivers.forEach(driver => {
      if (Math.abs(driver.percentage) > 10) { // Only show if > 10% impact
        recommendations.push(
          `${driver.label}的变化也有 ${Math.abs(driver.percentage).toFixed(0)}% 的影响`
        )
      }
    })
  }
  
  return recommendations
}

/**
 * Main function to calculate sensitivity analysis
 * Tries AI analysis first, falls back to estimated analysis if AI fails
 * @param {Object} scenarioA - First scenario (with inputs_json and results_json)
 * @param {Object} scenarioB - Second scenario (with inputs_json and results_json)
 * @returns {Promise<Object>} Complete comparison analysis with method indicator
 */
export async function calculateSensitivity(scenarioA, scenarioB) {
  // 1. Calculate input differences (always needed)
  const inputDiffs = findInputDifferences(
    scenarioA.inputs_json || scenarioA.inputs,
    scenarioB.inputs_json || scenarioB.inputs
  )
  
  // 2. Calculate result differences (always needed)
  const resultDiffs = calculateResultDifferences(
    scenarioA.results_json || scenarioA.results,
    scenarioB.results_json || scenarioB.results
  )
  
  // 3. Try AI analysis first (if available)
  let primaryDriver = null
  let recommendations = []
  let analysisMethod = 'estimated'
  
  if (isAIAvailable()) {
    try {
      const aiResult = await getAIComparison(scenarioA, scenarioB)
      
      if (aiResult && aiResult.primaryDriver) {
        // Use AI analysis result
        primaryDriver = {
          field: aiResult.primaryDriver.field,
          label: aiResult.primaryDriver.label,
          inputDelta: aiResult.primaryDriver.inputDelta,
          estimatedImpact: aiResult.primaryDriver.percentage / 100 * Math.abs(resultDiffs.finalScore.delta),
          percentage: aiResult.primaryDriver.percentage,
          impact: aiResult.primaryDriver.impact,
          reasoning: aiResult.primaryDriver.reasoning
        }
        recommendations = aiResult.insights || []
        analysisMethod = 'ai'
        
        console.log('✅ Using AI analysis (Gemini)')
      } else {
        // AI returned null, fall back to estimated
        console.log('⚠️ AI analysis returned null, using estimated analysis')
        primaryDriver = identifyPrimaryDriver(inputDiffs, resultDiffs)
        recommendations = generateRecommendations(primaryDriver, resultDiffs)
        analysisMethod = 'estimated'
      }
    } catch (error) {
      // AI call failed, fall back to estimated
      console.warn('⚠️ AI analysis failed, using estimated analysis:', error)
      primaryDriver = identifyPrimaryDriver(inputDiffs, resultDiffs)
      recommendations = generateRecommendations(primaryDriver, resultDiffs)
      analysisMethod = 'estimated'
    }
  } else {
    // AI not available, use estimated analysis
    console.log('ℹ️ AI not available, using estimated analysis')
    primaryDriver = identifyPrimaryDriver(inputDiffs, resultDiffs)
    recommendations = generateRecommendations(primaryDriver, resultDiffs)
    analysisMethod = 'estimated'
  }
  
  return {
    deltas: resultDiffs,
    inputDifferences: inputDiffs,
    primaryDriver,
    recommendations,
    analysisMethod, // 'ai' or 'estimated'
    summary: {
      probabilityChange: resultDiffs.probability.delta,
      finalScoreChange: resultDiffs.finalScore.delta,
      isImprovement: resultDiffs.probability.delta > 0
    }
  }
}

/**
 * Synchronous version for backward compatibility (uses estimated analysis only)
 * @param {Object} scenarioA - First scenario
 * @param {Object} scenarioB - Second scenario
 * @returns {Object} Complete comparison analysis (estimated)
 */
export function calculateSensitivitySync(scenarioA, scenarioB) {
  const inputDiffs = findInputDifferences(
    scenarioA.inputs_json || scenarioA.inputs,
    scenarioB.inputs_json || scenarioB.inputs
  )
  
  const resultDiffs = calculateResultDifferences(
    scenarioA.results_json || scenarioA.results,
    scenarioB.results_json || scenarioB.results
  )
  
  const primaryDriver = identifyPrimaryDriver(inputDiffs, resultDiffs)
  const recommendations = generateRecommendations(primaryDriver, resultDiffs)
  
  return {
    deltas: resultDiffs,
    inputDifferences: inputDiffs,
    primaryDriver,
    recommendations,
    analysisMethod: 'estimated',
    summary: {
      probabilityChange: resultDiffs.probability.delta,
      finalScoreChange: resultDiffs.finalScore.delta,
      isImprovement: resultDiffs.probability.delta > 0
    }
  }
}

