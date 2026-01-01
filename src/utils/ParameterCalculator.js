/**
 * UBC Admission Model Parameter Calculator
 * Automatically calculates Sigmoid model parameters based on admission median GPA
 * Updated for 2025/2026 admission statistics
 */
class ParameterCalculator {
  /**
   * @param {number} medianGPA - Median GPA of admitted students (e.g., 97 for Engineering)
   * @param {number} competitiveness - Competition level (1-5), 5 = most competitive
   * @returns {Object} { targetScore, scale }
   */
  static getModelParams(medianGPA, competitiveness = 3) {
    // 1. Calculate targetScore (50% probability anchor point)
    // Level 5 (most competitive): offset = 2.5 (more aggressive)
    // Level 4: offset = 3.0
    // Level 3 and below: offset = 3.5
    let targetOffset;
    if (competitiveness >= 5) {
      targetOffset = 2.5; // More aggressive for top-tier programs
    } else if (competitiveness >= 4) {
      targetOffset = 3.0;
    } else {
      targetOffset = 3.5;
    }
    const targetScore = medianGPA - targetOffset;

    // 2. Calculate scale (controls curve steepness)
    // More competitive = steeper curve = smaller scale
    // Base calculation: 8.5 - (competitiveness * 0.6)
    let scale = 8.5 - (competitiveness * 0.6);
    
    // Hard cap for Level 5 programs: maximum sensitivity at high end (95-100% range)
    if (competitiveness >= 5) {
      scale = Math.min(scale, 6.0); // Hard cap at 6.0 for maximum sensitivity
    }
    
    // If median is very high (93+), further compress scale
    if (medianGPA >= 93) {
      scale = Math.min(scale, 6.2);
    }

    return {
      targetScore: parseFloat(targetScore.toFixed(1)),
      scale: parseFloat(scale.toFixed(1))
    };
  }
}

export default ParameterCalculator;

