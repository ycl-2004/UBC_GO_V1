/**
 * Profile Scoring V2 - Evidence-Based Activity Scoring
 * 
 * Replaces subjective 1-5 self-ratings with structured activity-based input.
 * Each activity is scored individually (max 20 points), then summed and capped at 100.
 * 
 * Scoring Components (per activity, max 20 points):
 * - Category base (EC/Work/Volunteer/Award/Research)
 * - Years of involvement (0-4)
 * - Hours per week (0-30, diminishing returns after 12)
 * - Role depth (member/executive/founder)
 * - Relevance (high/medium/low)
 * - Impact evidence bonus (optional)
 */

/**
 * Calculate profile score from structured activities
 * @param {Array} activities - Array of activity objects
 * @param {Object} legacyRatings - Optional legacy 1-5 ratings for fallback/adjustment
 * @returns {Object} { score: number, breakdown: Object, method: string }
 */
export function calculateProfileScoreV2(activities = [], legacyRatings = null) {
  // If no activities provided, fall back to legacy v1 system
  if (!activities || activities.length === 0) {
    if (legacyRatings) {
      return calculateProfileScoreV1(legacyRatings);
    }
    return {
      score: 50, // Default neutral score
      breakdown: { method: 'default', activities: [] },
      method: 'default'
    };
  }

  let totalScore = 0;
  const breakdown = {
    method: 'v2',
    activities: [],
    totalActivities: activities.length
  };

  // Score each activity (max 20 points each)
  activities.forEach((activity, index) => {
    const activityScore = scoreActivity(activity);
    totalScore += activityScore.points;
    
    breakdown.activities.push({
      index: index + 1,
      category: activity.category,
      points: activityScore.points,
      breakdown: activityScore.breakdown
    });
  });

  // Cap at 100 (even if 8 activities × 20 = 160 theoretical max)
  totalScore = Math.min(100, totalScore);

  // Apply legacy adjustment if provided (±3 points)
  let legacyAdjustment = 0;
  if (legacyRatings) {
    legacyAdjustment = calculateLegacyAdjustment(legacyRatings);
    totalScore += legacyAdjustment;
    totalScore = Math.min(100, Math.max(0, totalScore)); // Re-cap after adjustment
  }

  return {
    score: Math.round(totalScore * 100) / 100, // Round to 2 decimals
    breakdown: {
      ...breakdown,
      totalPoints: totalScore,
      legacyAdjustment: legacyAdjustment,
      finalScore: totalScore
    },
    method: 'v2'
  };
}

/**
 * Score a single activity (max 20 points)
 * @param {Object} activity - Activity object with category, years, hoursPerWeek, role, relevance, impactEvidence
 * @returns {Object} { points: number, breakdown: Object }
 */
function scoreActivity(activity) {
  let points = 0;
  const breakdown = {};

  // 1. Category Base Points (0-4 points)
  const categoryBase = {
    'EC': 2,           // Extracurricular
    'Work': 3,         // Work experience (more valuable)
    'Volunteer': 2,    // Volunteer work
    'Award': 4,        // Awards/achievements (high value)
    'Research': 4      // Research experience (high value)
  };
  const basePoints = categoryBase[activity.category] || 1;
  points += basePoints;
  breakdown.categoryBase = basePoints;

  // 2. Years of Involvement (0-5 points)
  // More years = more commitment and depth
  const yearsPoints = Math.min(5, activity.years || 0);
  points += yearsPoints;
  breakdown.years = yearsPoints;

  // 3. Hours Per Week (0-6 points, diminishing returns after 12 hours)
  // Formula: min(6, hours/2) for hours ≤ 12, then 6 + (hours-12)/6 for hours > 12
  const hours = Math.min(30, Math.max(0, activity.hoursPerWeek || 0));
  let hoursPoints;
  if (hours <= 12) {
    hoursPoints = hours / 2; // Linear up to 12 hours (max 6 points)
  } else {
    hoursPoints = 6 + (hours - 12) / 6; // Diminishing returns after 12
    hoursPoints = Math.min(6, hoursPoints); // Cap at 6 points
  }
  points += hoursPoints;
  breakdown.hours = Math.round(hoursPoints * 100) / 100;

  // 4. Role Depth (0-3 points)
  const rolePoints = {
    'member': 0,
    'executive': 2,
    'founder': 3
  };
  const roleScore = rolePoints[activity.role] || 0;
  points += roleScore;
  breakdown.role = roleScore;

  // 5. Relevance (0-2 points)
  const relevancePoints = {
    'high': 2,
    'medium': 1,
    'low': 0
  };
  const relevanceScore = relevancePoints[activity.relevance] || 0;
  points += relevanceScore;
  breakdown.relevance = relevanceScore;

  // 6. Impact Evidence Bonus (0-2 points, optional)
  if (activity.impactEvidence === true) {
    points += 2;
    breakdown.impactEvidence = 2;
  } else {
    breakdown.impactEvidence = 0;
  }

  // Cap this activity at 20 points
  points = Math.min(20, points);

  return {
    points: Math.round(points * 100) / 100,
    breakdown: breakdown
  };
}

/**
 * Calculate legacy adjustment from old 1-5 ratings (±3 points)
 * @param {Object} legacyRatings - { extracurriculars, leadership, volunteering } (1-5 each)
 * @returns {number} Adjustment between -3 and +3
 */
function calculateLegacyAdjustment(legacyRatings) {
  if (!legacyRatings) return 0;

  const ec = parseInt(legacyRatings.extracurriculars) || 3;
  const leadership = parseInt(legacyRatings.leadership) || 3;
  const volunteering = parseInt(legacyRatings.volunteering) || 3;

  // Average of three ratings (1-5 scale)
  const avg = (ec + leadership + volunteering) / 3;

  // Map to ±3 adjustment:
  // 1 → -3, 2 → -1.5, 3 → 0, 4 → +1.5, 5 → +3
  const adjustment = (avg - 3) * 1.5;
  
  return Math.max(-3, Math.min(3, adjustment));
}

/**
 * Fallback: Calculate Profile Score V1 (legacy system)
 * @param {Object} formData - Form data with extracurriculars, leadership, volunteering, etc.
 * @returns {Object} { score: number, breakdown: Object, method: string }
 */
function calculateProfileScoreV1(formData) {
  const ec = parseInt(formData.extracurriculars) || 3;
  const leadership = parseInt(formData.leadership) || 3;
  const volunteering = parseInt(formData.volunteering) || 3;
  
  let profileScore = ((ec + leadership + volunteering) / 3 / 5) * 100;
  
  // Apply small factors (if available)
  if (formData.gradeTrend) {
    const trendBonus = { rising: 3, stable: 0, declining: -4 };
    profileScore += trendBonus[formData.gradeTrend] || 0;
  }
  
  if (formData.activityRelevance) {
    const relevanceBonus = { high: 3, medium: 1, low: -1 };
    profileScore += relevanceBonus[formData.activityRelevance] || 0;
  }
  
  if (formData.roleDepth) {
    const depthMultiplier = { founder: 1.2, executive: 1.1, member: 1.0 };
    profileScore *= depthMultiplier[formData.roleDepth] || 1.0;
  }
  
  profileScore = Math.min(100, Math.max(0, profileScore));
  
  return {
    score: Math.round(profileScore * 100) / 100,
    breakdown: {
      method: 'v1',
      baseScore: ((ec + leadership + volunteering) / 3 / 5) * 100,
      adjustments: {
        gradeTrend: formData.gradeTrend || 'stable',
        activityRelevance: formData.activityRelevance || 'medium',
        roleDepth: formData.roleDepth || 'member'
      }
    },
    method: 'v1'
  };
}

/**
 * Validate activity object structure
 * @param {Object} activity - Activity to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateActivity(activity) {
  const errors = [];
  
  if (!activity.category || !['EC', 'Work', 'Volunteer', 'Award', 'Research'].includes(activity.category)) {
    errors.push('Invalid category. Must be: EC, Work, Volunteer, Award, or Research');
  }
  
  if (typeof activity.years !== 'number' || activity.years < 0 || activity.years > 4) {
    errors.push('Years must be a number between 0 and 4');
  }
  
  if (typeof activity.hoursPerWeek !== 'number' || activity.hoursPerWeek < 0 || activity.hoursPerWeek > 30) {
    errors.push('Hours per week must be a number between 0 and 30');
  }
  
  if (!activity.role || !['member', 'executive', 'founder'].includes(activity.role)) {
    errors.push('Invalid role. Must be: member, executive, or founder');
  }
  
  if (!activity.relevance || !['high', 'medium', 'low'].includes(activity.relevance)) {
    errors.push('Invalid relevance. Must be: high, medium, or low');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Create empty activity template
 * @returns {Object} Empty activity object with default values
 */
export function createEmptyActivity() {
  return {
    category: 'EC',
    years: 0,
    hoursPerWeek: 0,
    role: 'member',
    relevance: 'medium',
    impactEvidence: false
  };
}

