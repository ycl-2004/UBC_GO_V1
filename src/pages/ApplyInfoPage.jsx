import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Book, Palette, Rocket, AlertCircle } from "lucide-react";
import Navigation from "../components/Navigation";
import StepByStepRequirements from "../components/StepByStepRequirements";
import ScenarioComparator from "../components/ScenarioComparator";
import MultiSelect from "../components/MultiSelect";
import ProfileActivitiesForm from "../components/ProfileActivitiesForm";
import { useAdmissionScenarios } from "../hooks/useAdmissionScenarios";
import { calculateProfileScoreV2 } from "../utils/profileScoringV2";
import "./ApplyInfoPage.css";
import {
  facultyAdmissionData,
  facultyRequirements,
  getAllFaculties,
} from "../data/facultiesData";

// 20 majors list
const majors = [
  "Applied Biology",
  "Applied Science (Engineering)",
  "Arts",
  "Bachelor + Master of Management",
  "Commerce (UBC Sauder School of Business)",
  "Dental Hygiene",
  "Design in Architecture, Landscape Architecture, and Urbanism",
  "Fine Arts",
  "Food and Resource Economics",
  "Food, Nutrition, and Health",
  "Indigenous Land Stewardship",
  "Indigenous Teacher Education Program (NITEP)",
  "International Economics",
  "Kinesiology",
  "Media Studies",
  "Music",
  "Natural Resources",
  "Pharmaceutical Sciences",
  "Science",
  "Urban Forestry",
];

// Helper function to get admission data for a major
// First tries major-specific data, then falls back to legacy faculty-based data
const getAdmissionData = (majorName) => {
  // Try major-specific data first
  if (facultyAdmissionData[majorName]) {
    return facultyAdmissionData[majorName];
  }
  
  // Fallback to legacy faculty-based mapping (for backward compatibility)
  const majorToFacultyMap = {
    "Applied Biology": "science",
    "Applied Science (Engineering)": "science",
    "Arts": "arts",
    "Bachelor + Master of Management": "sauder",
    "Commerce (UBC Sauder School of Business)": "sauder",
    "Dental Hygiene": "science",
    "Design in Architecture, Landscape Architecture, and Urbanism": "arts",
    "Fine Arts": "arts",
    "Food and Resource Economics": "science",
    "Food, Nutrition, and Health": "science",
    "Indigenous Land Stewardship": "arts",
    "Indigenous Teacher Education Program (NITEP)": "arts",
    "International Economics": "arts",
    "Kinesiology": "science",
    "Media Studies": "arts",
    "Music": "arts",
    "Natural Resources": "science",
    "Pharmaceutical Sciences": "science",
    "Science": "science",
    "Urban Forestry": "science",
  };
  
  const facultyKey = majorToFacultyMap[majorName] || "arts";
  return facultyAdmissionData[facultyKey] || facultyAdmissionData.arts;
};

const ApplyInfoPage = () => {
  const navigate = useNavigate();
  const { scenarios, createScenario, deleteScenario, duplicateScenario, loading: scenariosLoading } = useAdmissionScenarios();
  const [selectedMajor, setSelectedMajor] = useState("Arts");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [showScenariosList, setShowScenariosList] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [scenarioA, setScenarioA] = useState(null);
  const [scenarioB, setScenarioB] = useState(null);
  const [formData, setFormData] = useState({
    gpa: "",
    courseDifficulty: "regular",
    extracurriculars: 3,
    leadership: 3,
    volunteering: 3,
    supplementScore: 50, // For programs requiring portfolio/audition (0-100)
    
    // New: Applicant Type
    applicantType: "domestic", // "domestic" or "international"
    
    // New: Grade Trend
    gradeTrend: "stable", // "rising", "stable", "declining"
    
    // New: Activity Relevance
    activityRelevance: "medium", // "high", "medium", "low"
    
    // New: Role Depth
    roleDepth: "member", // "founder", "executive", "member"
    
    // AP Exams: Structured array with name and score (only score=5 provides insurance)
    apExams: [], // Array of { name: string, score: number }, e.g., [{ name: 'AP Calculus BC', score: 5 }]
    
    // New: Profile V2 - Structured activities (up to 8)
    activities: [], // Array of activity objects: { category, years, hoursPerWeek, role, relevance, impactEvidence }
    
    // Course completion tracking with status
    courseStatus: {
      Math12: "completed",     // "completed", "inProgress", "notTaken"
      English12: "completed",
      Physics12: "notTaken",
      Chemistry12: "notTaken",
      Biology12: "notTaken",
      Geography12: "notTaken",
    },
    
    // Core subject scores (for programs that care about specific subjects)
    coreSubjectScores: {
      Math12: "",
      English12: "",
      Physics12: "",
      Chemistry12: "",
      Biology12: "",
    },
    
    // Legacy - keep for backward compatibility
    completedCourses: {
      Math12: true,
      English12: true,
      Physics12: false,
      Chemistry12: false,
      Biology12: false,
      Geography12: false,
    },
  });
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  // Helper function: Sigmoid/logistic function for probability conversion
  const sigmoid = (x, target, scale) => {
    return 1 / (1 + Math.exp(-(x - target) / scale));
  };

  // ==================== 4-LAYER MODEL ====================
  
  // Helper function: Normalize AP exam name (trim + collapse spaces)
  // Used for robust matching against UI formatting variations
  const normalizeName = (name) => {
    if (!name || typeof name !== 'string') return '';
    return name.trim().replace(/\s+/g, ' ');
  };
  
  // LAYER 1: Gate Check (Hard Threshold) - Refactored to use caps and multipliers instead of score penalties
  const checkGateRequirements = (admissionData, courseStatus, coreSubjectScores, apExams = []) => {
    const gates = admissionData.gates || {};
    const requiredCourses = gates.requiredCourses || admissionData.requiredCourses?.gate || [];
    
    const missingCourses = [];
    const inProgressCourses = [];
    const warnings = [];
    
    // Check required courses and their status
    for (const course of requiredCourses) {
      if (course === "Science12_2") {
        // Special case: need 2 science courses
        const scienceCourses = ["Physics12", "Chemistry12", "Biology12"];
        const completedCount = scienceCourses.filter(c => courseStatus[c] === "completed").length;
        const inProgressCount = scienceCourses.filter(c => courseStatus[c] === "inProgress").length;
        
        if (completedCount + inProgressCount < 2) {
          missingCourses.push("At least 2 Grade 12 Science courses");
        } else if (completedCount < 2) {
          // Track in-progress courses for cap reduction
          const needed = 2 - completedCount;
          inProgressCourses.push(`At least ${needed} more Grade 12 Science course(s) in progress`);
        }
      } else {
        const status = courseStatus[course] || "notTaken";
        if (status === "notTaken") {
          missingCourses.push(course);
        } else if (status === "inProgress") {
          inProgressCourses.push(course);
        }
      }
    }
    
    // AP subject mapping: Maps core subjects to relevant AP exams (strict matching)
    const apSubjectMap = {
      'Math12': ['AP Calculus AB', 'AP Calculus BC', 'AP Statistics'],
      'Physics12': ['AP Physics 1', 'AP Physics 2', 'AP Physics C: Mechanics', 'AP Physics C: Electricity and Magnetism'],
      'Chemistry12': ['AP Chemistry'],
      'Biology12': ['AP Biology'],
      'English12': ['AP English Language and Composition', 'AP English Literature and Composition']
    };
    
    // Check core subject minimum scores - calculate effective deficit with AP insurance
    const coreSubjects = gates.coreSubjects || [];
    const coreMinScore = gates.coreMinScore || 75;
    let totalCoreDeficit = 0;
    let effectiveDeficit = 0;
    const insuredSubjects = []; // Track which subjects have AP insurance
    const uninsuredSubjects = []; // Track which subjects lack AP insurance
    
    for (const subject of coreSubjects) {
      const score = parseFloat(coreSubjectScores[subject]);
      if (score && score < coreMinScore) {
        const deficit = coreMinScore - score;
        totalCoreDeficit += deficit;
        
        // Check if this subject has AP insurance (strict: AP name matches AND score === 5)
        const relevantAPs = apSubjectMap[subject] || [];
        // Handle both old format (string[]) and new format (Array<{name, score}>)
        const apExamsArray = Array.isArray(apExams) ? apExams : [];
        const hasInsurance = relevantAPs.some(apName => {
          if (apExamsArray.length === 0) return false;
          const normalizedAPName = normalizeName(apName);
          // Check if old format (strings) or new format (objects)
          if (typeof apExamsArray[0] === 'string') {
            return apExamsArray.some(ap => normalizeName(ap) === normalizedAPName); // Old format: all assumed score 5
          } else {
            const apExam = apExamsArray.find(ap => ap && normalizeName(ap.name) === normalizedAPName && ap.score === 5);
            return apExam !== undefined;
          }
        });
        
        if (hasInsurance) {
          // Insured deficit: 50% reduction
          effectiveDeficit += deficit * 0.5;
          // Find the matching AP exam for display
          let matchingAP = null;
          if (typeof apExamsArray[0] === 'string') {
            const matchedAPName = relevantAPs.find(ap => apExamsArray.some(exam => normalizeName(exam) === normalizeName(ap)));
            matchingAP = matchedAPName ? { name: matchedAPName, score: 5 } : null;
          } else {
            matchingAP = apExamsArray.find(ap => ap && relevantAPs.some(apName => normalizeName(ap.name) === normalizeName(apName)) && ap.score === 5);
          }
          if (matchingAP) {
            insuredSubjects.push({ subject, deficit, apExam: matchingAP });
          }
        } else {
          // Uninsured deficit: full penalty
          effectiveDeficit += deficit;
          uninsuredSubjects.push({ subject, deficit });
        }
        
        warnings.push(`${subject} score (${score}%) is below recommended minimum (${coreMinScore}%)`);
      }
    }
    
    // Calculate gate cap reduction for in-progress courses (soft uncertainty)
    // If any required course is in progress, reduce cap to 70%
    // Note: 70% cap still allows Safety category (>=70 = Safety threshold)
    let gateCapMaxProb = null;
    if (inProgressCourses.length > 0) {
      gateCapMaxProb = 70;
      warnings.push(`Some required courses are in progress. Maximum probability capped at ${gateCapMaxProb}% due to uncertainty. Final category is determined by standard thresholds (>=70 = Safety).`);
    }
    
    // Calculate gate multiplier for core subject deficits (soft penalty)
    // Uses effective deficit (with AP insurance applied per subject)
    // multiplier = 1 - min(effectiveDeficit * 0.008, 0.25)  // max 25% reduction
    let gateMultiplier = 1.0;
    if (effectiveDeficit > 0) {
      gateMultiplier = 1 - Math.min(effectiveDeficit * 0.008, 0.25);
    }
    
    // Check supplement requirement
    const supplementRequired = gates.supplementRequired || false;
    const supplementType = gates.supplementType || null;
    let supplementWarning = null;
    
    if (supplementRequired) {
      supplementWarning = admissionData.supplementWarning || 
        `⚠️ This program requires ${supplementType || "supplement material"} submission. Without it, accurate estimation is not possible.`;
    }
    
    // Gate passed if no missing courses (hard failure)
    const passed = missingCourses.length === 0;
    
    return {
      passed,
      missingCourses,
      inProgressCourses,
      warnings,
      supplementRequired,
      supplementType,
      supplementWarning,
      gateWarning: admissionData.gateWarning || null,
      // New: Gate probability modifiers (instead of score penalty)
      gateCapMaxProb,  // Cap reduction for in-progress courses
      gateMultiplier,  // Multiplier for core subject deficits (uses effectiveDeficit)
      totalCoreDeficit,  // Total deficit (for display)
      effectiveDeficit,  // Effective deficit (with AP insurance applied)
      insuredSubjects,  // Subjects with AP insurance (for explanation)
      uninsuredSubjects,  // Subjects without AP insurance (for explanation)
      apSubjectMap  // AP mapping (for explanation)
    };
  };
  
  // LAYER 2: Score Calculation - Enhanced with small factors
  const calculateScores = (formData, admissionData) => {
    const gates = admissionData.gates || {};
    const smallFactors = admissionData.smallFactors || {};
    
    // Academic Score (0-100)
    let academicScore = parseFloat(formData.gpa) || 0;
    
    // Course rigor bonus
    const rigorBonus = { regular: 0, ap: 3, ib: 5 };
    academicScore += rigorBonus[formData.courseDifficulty] || 0;
    
    // Core subject boost/penalty
    const coreSubjects = gates.coreSubjects || [];
    let coreBoost = 0;
    for (const subject of coreSubjects) {
      const score = parseFloat(formData.coreSubjectScores[subject]);
      if (score) {
        const coreMin = gates.coreMinScore || 80;
        if (score >= coreMin + 5) {
          coreBoost += 2; // Boost for high core scores
        } else if (score < coreMin) {
          coreBoost -= 3; // Penalty for low core scores
        }
      }
    }
    academicScore = Math.min(100, Math.max(0, academicScore + coreBoost));
    
    // AP Rigor Bonus: For each AP exam with score of 5, add 0.75% to academicScore
    // This allows slight "rigor overage" up to 100.5% to recognize university-level achievement
    // Note: apExams is now structured Array<{ name: string, score: number }>
    // Backward compatibility: Handle old string[] format or apExamsCount
    const apExamsArray = formData.apExams || [];
    const apExamsWithScore5 = Array.isArray(apExamsArray) && apExamsArray.length > 0
      ? (typeof apExamsArray[0] === 'string' 
          ? apExamsArray.length  // Old format: string[] (all assumed score 5)
          : apExamsArray.filter(ap => ap.score === 5).length)  // New format: count score=5
      : 0;
    const apRigorBonus = apExamsWithScore5 * 0.75; // 0.75% per AP score of 5
    academicScore = Math.min(100.5, academicScore + apRigorBonus); // Cap at 100.5%
    
    // Profile Score (0-100) - Use Profile V2 if activities provided, else fallback to V1
    let profileScore;
    let profileMethod = 'v1';
    
    // Check if Profile V2 activities are provided
    if (formData.activities && formData.activities.length > 0) {
      // Use Profile V2: Evidence-based activity scoring
      const legacyRatings = {
        extracurriculars: formData.extracurriculars,
        leadership: formData.leadership,
        volunteering: formData.volunteering
      };
      const profileResult = calculateProfileScoreV2(formData.activities, legacyRatings);
      profileScore = profileResult.score;
      profileMethod = profileResult.method;
      
      // Apply grade trend adjustment (still applies in V2)
      const trendBonus = smallFactors.gradeTrend || { rising: 3, stable: 0, declining: -4 };
      profileScore += trendBonus[formData.gradeTrend] || 0;
      profileScore = Math.min(100, Math.max(0, profileScore));
    } else {
      // Fallback to Profile V1: Legacy 1-5 self-ratings
      const ec = parseInt(formData.extracurriculars) || 3;
      const leadership = parseInt(formData.leadership) || 3;
      const volunteering = parseInt(formData.volunteering) || 3;
      profileScore = ((ec + leadership + volunteering) / 3 / 5) * 100;
      
      // Small factors adjustments
      // Grade trend
      const trendBonus = smallFactors.gradeTrend || { rising: 3, stable: 0, declining: -4 };
      profileScore += trendBonus[formData.gradeTrend] || 0;
      
      // Activity relevance
      const relevanceBonus = smallFactors.activityRelevance || { high: 3, medium: 1, low: -1 };
      profileScore += relevanceBonus[formData.activityRelevance] || 0;
      
      // Role depth multiplier
      const depthMultiplier = smallFactors.depthMultiplier || { founder: 1.2, executive: 1.1, member: 1.0 };
      profileScore *= depthMultiplier[formData.roleDepth] || 1.0;
      
      profileScore = Math.min(100, Math.max(0, profileScore));
    }
    
    // Supplement Score (0-100) - only for programs that require it
    const supplementScore = parseFloat(formData.supplementScore) || 50;
    
    return {
      academicScore: Math.round(academicScore * 100) / 100,
      profileScore: Math.round(profileScore * 100) / 100,
      supplementScore: Math.round(supplementScore * 100) / 100,
      profileMethod: profileMethod // Track which method was used
    };
  };
  
  // Helper function: Linear-Sigmoid Hybrid for probability calculation
  // This function ensures granular probability changes while maintaining a realistic feel.
  // Safety Limit: Maximum probability change per GPA point is capped at 2% through:
  //   - Narrower scale (scale × 0.7) for higher sensitivity in the target range
  //   - Linear bonus (0.5% per point) for scores above target
  //   - These mechanisms naturally keep changes under 2% per GPA point
  const calculateFinalProbability = (finalScore, target, scale, capMaxProb) => {
    // 1. Base probability with narrower scale (0.7 multiplier) for higher sensitivity
    const adjustedScale = scale * 0.7;
    let rawProb = 1 / (1 + Math.exp(-(finalScore - target) / adjustedScale)) * 100;
    
    // 2. Linear polish for high scores (ensures 95 vs 97 vs 100 feels different)
    if (finalScore > target) {
      const bonus = (finalScore - target) * 0.5; // Every point above target adds 0.5%
      rawProb += bonus;
    }
    
    // 3. Safety Limit: Maximum probability change per GPA point ≤ 2%
    // The combination of 0.7 scale multiplier and 0.5% linear bonus ensures
    // that even at the steepest part of the curve, changes remain realistic
    
    return Math.min(rawProb, capMaxProb);
  };

  // LAYER 3: Probability Calculation - Enhanced with Academic Risk Escalation (Plan A) and Linear-Sigmoid Hybrid
  const calculateProbability = (scores, gateCheck, admissionData, applicantType, coreSubjectScores = {}, apExams = [], activities = [], supplementScore = null) => {
    // Get base program weights
    const baseWeights = admissionData.weights || {
      academic: admissionData.gpaWeight || 0.75,
      profile: admissionData.personalProfileWeight || 0.25,
      supplement: admissionData.supplementWeight || 0.0
    };
    
    // Academic Risk Escalation (Plan A) — increases profile weight up to 35% when academic risk exists.
    // academicRisk is true if ANY: totalCoreDeficit > 0, inProgressCourses.length > 0, or academicScore < 85
    const academicRisk = 
      (gateCheck.totalCoreDeficit > 0) ||
      (gateCheck.inProgressCourses && gateCheck.inProgressCourses.length > 0) ||
      (scores.academicScore < 85);
    
    let academicWeight = baseWeights.academic;
    let profileWeight = baseWeights.profile;
    const supplementWeight = baseWeights.supplement; // Unchanged
    
    if (academicRisk) {
      // Increase profile weight by +0.10, capped at 0.35
      profileWeight = Math.min(0.35, baseWeights.profile + 0.10);
      
      // Reduce academic weight accordingly to maintain sum = 1.0
      academicWeight = 1.0 - profileWeight - supplementWeight;
      
      // Guardrail: If academicWeight < 0.0, clamp it and adjust profileWeight
      if (academicWeight < 0.0) {
        academicWeight = 0.0;
        profileWeight = 1.0 - supplementWeight;
      }
      
      // Ensure weights sum to 1.0 within epsilon (renormalize if needed)
      const totalWeight = academicWeight + profileWeight + supplementWeight;
      if (Math.abs(totalWeight - 1.0) > 0.001) {
        const normalizationFactor = 1.0 / totalWeight;
        academicWeight *= normalizationFactor;
        profileWeight *= normalizationFactor;
        // supplementWeight remains unchanged conceptually, but we'll recalculate to ensure precision
      }
    }
    
    // Final weights object for use in calculation
    const weights = {
      academic: academicWeight,
      profile: profileWeight,
      supplement: supplementWeight
    };
    
    // Calculate weighted final score (NO gate penalties - gates affect probability via caps/multipliers)
    let finalScore = 
      scores.academicScore * weights.academic +
      scores.profileScore * weights.profile +
      scores.supplementScore * weights.supplement;
    
    // Adjust for international applicants
    const intlAdjust = admissionData.internationalAdjustment || { targetBonus: 1, capReduction: 2 };
    let target = admissionData.targetScore || 80;
    let scale = admissionData.scale || 8;
    let capMaxProb = admissionData.capMaxProb || 90;
    
    if (applicantType === "international") {
      target += intlAdjust.targetBonus;
      capMaxProb -= intlAdjust.capReduction;
    }
    
    // Apply gate cap reduction (for in-progress courses - soft uncertainty)
    // Note: 70% cap still allows Safety category (>=70 = Safety threshold)
    if (gateCheck.gateCapMaxProb !== null) {
      capMaxProb = Math.min(capMaxProb, gateCheck.gateCapMaxProb);
    }
    
    // Calculate raw probability using Linear-Sigmoid Hybrid
    let rawProbability = calculateFinalProbability(finalScore, target, scale, capMaxProb);
    
    // Apply penalty factors
    let adjustedProbability = rawProbability;
    
    // 1. High-End Dampening: If academic score < 93, reduce probability by 15%
    // This prevents scores below 93 from reaching "Safety" category too easily
    if (scores.academicScore < 93) {
      adjustedProbability = rawProbability * 0.85;
    }
    
    // 2. Gate Multiplier: Apply core subject deficit multiplier (from gateCheck)
    // Uses effective deficit calculated in gateCheck with per-subject AP insurance
    // multiplier = 1 - min(effectiveDeficit * 0.008, 0.25) - max 25% reduction
    // AP insurance is already applied per-subject in gateCheck (50% reduction per insured subject)
    if (gateCheck.gateMultiplier !== undefined && gateCheck.gateMultiplier < 1.0) {
      adjustedProbability = adjustedProbability * gateCheck.gateMultiplier;
    }
    
    // Apply cap (already handled in calculateFinalProbability, but keep for safety)
    const cappedProbability = Math.min(adjustedProbability, capMaxProb);
    
    // Calculate uncertainty-driven confidence interval width
    // Base width: 6
    let confidenceWidth = 6;
    const uncertaintyFactors = [];
    
    // 1. In-progress required courses: +1.0 per course
    if (gateCheck.inProgressCourses && gateCheck.inProgressCourses.length > 0) {
      const inProgressCount = gateCheck.inProgressCourses.length;
      confidenceWidth += inProgressCount * 1.0;
      if (inProgressCount === 1) {
        uncertaintyFactors.push('1 in-progress course');
      } else {
        uncertaintyFactors.push(`${inProgressCount} in-progress courses`);
      }
    }
    
    // 2. Missing core subject scores: +1.5 per missing score
    // Use strict empty/NaN detection: raw === null || raw === undefined || String(raw).trim()==='' || isNaN(Number(raw))
    const gates = admissionData.gates || {};
    const coreSubjects = gates.coreSubjects || [];
    let missingCoreScores = 0;
    for (const subject of coreSubjects) {
      const raw = coreSubjectScores[subject];
      if (raw === null || raw === undefined || String(raw).trim() === '' || isNaN(Number(raw))) {
        missingCoreScores++;
      }
    }
    if (missingCoreScores > 0) {
      confidenceWidth += missingCoreScores * 1.5;
      const missingSubjects = coreSubjects.filter(subject => {
        const raw = coreSubjectScores[subject];
        return raw === null || raw === undefined || String(raw).trim() === '' || isNaN(Number(raw));
      });
      if (missingSubjects.length === 1) {
        uncertaintyFactors.push(`missing ${missingSubjects[0]} score`);
      } else {
        uncertaintyFactors.push(`missing ${missingSubjects.length} core subject scores`);
      }
    }
    
    // 3. Supplement uncertainty: +3.0 if required but not provided
    // Use strict empty/NaN detection: raw === null || raw === undefined || String(raw).trim()==='' || isNaN(Number(raw))
    if (gateCheck.supplementRequired) {
      const raw = supplementScore;
      if (raw === null || raw === undefined || String(raw).trim() === '' || isNaN(Number(raw))) {
        confidenceWidth += 3.0;
        uncertaintyFactors.push('supplement material not provided');
      }
    }
    
    // 4. Profile input uncertainty
    if (!activities || activities.length === 0) {
      confidenceWidth += 2.0;
      uncertaintyFactors.push('no activities provided');
    } else {
      confidenceWidth += 0.5;
      // Don't add to factors list for activities present (minor uncertainty)
    }
    
    // Clamp confidence width between 6 and 14
    confidenceWidth = Math.max(6, Math.min(14, confidenceWidth));
    
    // Calculate confidence interval
    // Note: capMaxProb here is the FINAL value after all gate caps (international adjustment + gate cap reduction)
    const percentageMid = Math.round(cappedProbability);
    const percentageLow = Math.max(5, Math.round(percentageMid - confidenceWidth));
    const percentageHigh = Math.min(capMaxProb, Math.round(percentageMid + confidenceWidth));
    
    // Generate uncertainty explanation
    let uncertaintyExplanation = null;
    if (uncertaintyFactors.length > 0) {
      uncertaintyExplanation = `Wider range due to: ${uncertaintyFactors.join(', ')}.`;
    }
    
    // Determine chance level and Safety/Match/Reach
    let chance, color, category;
    
    if (percentageMid >= 70) {
      chance = "High";
      color = "#28a745";
      category = "Safety";
    } else if (percentageMid >= 45) {
      chance = "Medium";
      color = "#ffc107";
      category = "Match";
    } else {
      chance = "Low";
      color = "#dc3545";
      category = "Reach";
    }
    
    // Hard gate failure override: If missing required courses, force Reach + Low + cap <= 40%
    if (!gateCheck.passed) {
      const gateCap = Math.min(40, percentageMid);
      return {
        finalScore: Math.round(finalScore * 100) / 100,
        rawProbability: Math.round(rawProbability * 100) / 100,
        percentage: gateCap,
        percentageRange: {
          low: Math.max(5, Math.min(gateCap - 10, percentageLow)),
          high: Math.max(gateCap, Math.min(50, percentageHigh))
        },
        chance: "Low",
        color: "#dc3545",
        category: "Reach",
        confidenceWidth: 8, // Fixed width for gate failure
        uncertaintyExplanation: null, // No uncertainty explanation for hard gate failure
        gateFailure: true,  // Flag for explanation generation
        weightsUsed: weights  // Return adjusted weights
      };
    }
    
    return {
      finalScore: Math.round(finalScore * 100) / 100,
      rawProbability: Math.round(rawProbability * 100) / 100,
      percentage: percentageMid,
      percentageRange: { low: percentageLow, high: percentageHigh },
      chance,
      color,
      category, // Safety/Match/Reach
      confidenceWidth,
      uncertaintyExplanation,  // Explanation for wider CI
      weightsUsed: weights  // Return adjusted weights (may be modified by Plan A)
    };
  };
  
  // LAYER 4: Explanation Generation
  const generateExplanation = (gateCheck, scores, probability, admissionData, apExams = []) => {
    const explanations = [];
    
    // Gate issues (most critical)
    if (gateCheck.gateWarning && gateCheck.missingCourses.length > 0) {
      explanations.push({
        type: "gate",
        severity: "critical",
        message: `🚫 Missing Courses: ${gateCheck.missingCourses.join(", ")}`,
        advice: admissionData.gateWarning || "Complete all required courses to improve admission chances."
      });
    }
    
    // In-progress courses (soft uncertainty - cap reduction)
    // Note: 70% cap still allows Safety category (>=70 = Safety threshold)
    if (gateCheck.inProgressCourses && gateCheck.inProgressCourses.length > 0) {
      explanations.push({
        type: "gate",
        severity: "warning",
        message: `⏳ In-Progress Courses: ${gateCheck.inProgressCourses.join(", ")}`,
        advice: `Maximum probability capped at ${gateCheck.gateCapMaxProb}% due to in-progress course uncertainty. Final category is determined by standard thresholds (>=70 = Safety). Complete these courses to remove the cap.`
      });
    }
    
    // Core subject deficits (soft penalty - multiplier)
    if (gateCheck.totalCoreDeficit && gateCheck.totalCoreDeficit > 0) {
      const reductionPercent = Math.round((1 - gateCheck.gateMultiplier) * 100);
      let adviceMessage = `Probability reduced by ${reductionPercent}% due to core subject scores below minimum.`;
      
      // Show AP insurance details if applicable
      if (gateCheck.insuredSubjects && gateCheck.insuredSubjects.length > 0) {
        const insuredDetails = gateCheck.insuredSubjects.map(item => 
          `${item.subject} (${item.apExam.name} score 5)`
        ).join(', ');
        adviceMessage += ` AP insurance applied for: ${insuredDetails}.`;
      }
      
      // Show uninsured subjects if any
      if (gateCheck.uninsuredSubjects && gateCheck.uninsuredSubjects.length > 0) {
        const uninsuredDetails = gateCheck.uninsuredSubjects.map(item => item.subject).join(', ');
        adviceMessage += ` Uninsured subjects: ${uninsuredDetails}.`;
      }
      
      // Check if user has AP exams but none match weak subjects
      if (apExams && apExams.length > 0 && gateCheck.insuredSubjects && gateCheck.insuredSubjects.length === 0 && gateCheck.uninsuredSubjects && gateCheck.uninsuredSubjects.length > 0) {
        adviceMessage += ` AP exams provided, but none match the weak core subject(s).`;
      }
      
      explanations.push({
        type: "gate",
        severity: "warning",
        message: `⚠️ Core Subject Deficits: Total deficit of ${gateCheck.totalCoreDeficit.toFixed(1)}%`,
        advice: adviceMessage + ' Improve core subject grades to remove this penalty.'
      });
    }
    
    // Supplement warning
    if (gateCheck.supplementWarning) {
      explanations.push({
        type: "supplement",
        severity: "warning",
        message: gateCheck.supplementWarning,
        advice: `This program ${admissionData.weights?.supplement > 0.3 ? "primarily" : "partially"} relies on supplement material evaluation.`
      });
    }
    
    // Core subject warnings
    for (const warning of gateCheck.warnings) {
      explanations.push({
        type: "core",
        severity: "warning",
        message: `⚠️ ${warning}`,
        advice: "Improving core subject scores can significantly increase admission probability."
      });
    }
    
    // Score-based insights
    const weights = admissionData.weights || {};
    if (weights.academic > 0.5 && scores.academicScore < 85) {
      explanations.push({
        type: "score",
        severity: "info",
        message: `📚 Academic Score (${scores.academicScore.toFixed(1)}) has room for improvement`,
        advice: "This program has high academic weight; improving GPA is the most direct approach."
      });
    }
    
    if (weights.profile > 0.25 && scores.profileScore < 80) {
      explanations.push({
        type: "score",
        severity: "info",
        message: `👤 Personal Profile (${scores.profileScore.toFixed(1)}) can be strengthened`,
        advice: admissionData.advice || "Showcase more relevant activities and leadership experience."
      });
    }
    
    // Top 2 improvement actions
    const actions = [];
    if (gateCheck.missingCourses.length > 0) {
      actions.push(`Take missing courses: ${gateCheck.missingCourses.slice(0, 2).join(", ")}`);
    }
    if (scores.academicScore < 90 && weights.academic > 0.5) {
      actions.push("Improve GPA to 90+");
    }
    if (scores.profileScore < 85 && weights.profile > 0.2) {
      actions.push("Increase depth of relevant extracurricular activities");
    }
    if (gateCheck.supplementRequired && scores.supplementScore < 70) {
      actions.push(`Prepare high-quality ${gateCheck.supplementType || "supplement material"}`);
    }
    
    return {
      explanations,
      topActions: actions.slice(0, 2),
      overallAdvice: admissionData.advice,
      evidenceRubric: admissionData.evidenceRubric
    };
  };

  // Helper function: Calculate Academic Score (0-100)
  const calculateAcademicScore = (gpa, courseDifficulty, admissionData) => {
    const baseGPA = parseFloat(gpa);
    
    // Apply course rigor multiplier (small boost, +0 to +6 points)
    const rigorBonus = {
      regular: 0,
      ap: 3,
      ib: 6
    };
    const bonus = rigorBonus[courseDifficulty] || 0;
    
    // Cap at 100
    return Math.min(100, baseGPA + bonus);
  };

  // Helper function: Calculate Profile Score (0-100)
  const calculateProfileScore = (extracurriculars, leadership, volunteering) => {
    // Map 1-5 scale to 0-100
    // Average of three components, weighted equally
    const avg = (parseInt(extracurriculars) + parseInt(leadership) + parseInt(volunteering)) / 3;
    return (avg / 5) * 100;
  };

  // Real-time calculation using three-stage model
  // ==================== REAL-TIME CALCULATION (4-Layer Model) ====================
  const realTimeResult = useMemo(() => {
    if (!formData.gpa || formData.gpa === "") return null;
    
    const gpaNum = parseFloat(formData.gpa);
    if (!gpaNum || gpaNum < 0 || gpaNum > 100) return null;
    
    const admissionData = getAdmissionData(selectedMajor);
    
    // LAYER 1: Gate Check
    const gateCheck = checkGateRequirements(
      admissionData, 
      formData.courseStatus, 
      formData.coreSubjectScores,
      formData.apExams || []
    );
    
    // LAYER 2: Score Calculation
    const scores = calculateScores(formData, admissionData);
    
    // LAYER 3: Probability Calculation
    const probability = calculateProbability(
      scores, 
      gateCheck, 
      admissionData, 
      formData.applicantType,
      formData.coreSubjectScores,
      formData.apExams || [],
      formData.activities || [],
      formData.supplementScore
    );
    
    // LAYER 4: Explanation Generation
    const explanation = generateExplanation(gateCheck, scores, probability, admissionData, formData.apExams || []);
    
    // Get weights for display (use adjusted weights from probability calculation if available)
    const weightsUsed = probability.weightsUsed || admissionData.weights || {
      academic: admissionData.gpaWeight || 0.75,
      profile: admissionData.personalProfileWeight || 0.25,
      supplement: admissionData.supplementWeight || 0.0
    };
    
    return { 
      // Probability result
      chance: probability.chance,
      percentage: probability.percentage,
      percentageRange: probability.percentageRange,
      color: probability.color,
      category: probability.category, // Safety/Match/Reach
      confidenceWidth: probability.confidenceWidth,
      
      // Scores
      finalScore: probability.finalScore,
      academicScore: scores.academicScore,
      profileScore: scores.profileScore,
      supplementScore: weightsUsed.supplement > 0 ? scores.supplementScore : null,
      
      // Gate check results
      gateCheck,
      
      // Explanation
      explanation,
      
      // Admission data for display
      admissionData,
      weights: weightsUsed  // Use adjusted weights (may be modified by Plan A)
    };
  }, [formData, selectedMajor]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle course status changes (e.g., "courseStatus_Math12")
    if (name.startsWith("courseStatus_")) {
      const course = name.replace("courseStatus_", "");
      setFormData((prev) => ({
        ...prev,
        courseStatus: {
          ...prev.courseStatus,
          [course]: value,
        },
        // Also update legacy completedCourses for backward compatibility
        completedCourses: {
          ...prev.completedCourses,
          [course]: value === "completed",
        },
      }));
    }
    // Handle core subject score changes (e.g., "coreScore_Math12")
    else if (name.startsWith("coreScore_")) {
      const course = name.replace("coreScore_", "");
      setFormData((prev) => ({
        ...prev,
        coreSubjectScores: {
          ...prev.coreSubjectScores,
          [course]: value,
        },
      }));
    }
    // Handle checkbox (legacy)
    else if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        completedCourses: {
          ...prev.completedCourses,
          [name]: checked,
        },
      }));
    } 
    // Handle all other inputs
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Get required courses for selected major (enhanced)
  const getRequiredCourses = () => {
    const admissionData = getAdmissionData(selectedMajor);
    const gates = admissionData.gates || {};
    const requiredCourses = gates.requiredCourses || admissionData.requiredCourses?.gate || [];
    
    if (requiredCourses.length === 0) {
      return [];
    }
    
    const courseLabels = {
      Math12: "Math 12 / Pre-Calculus 12",
      English12: "English 12",
      Physics12: "Physics 12",
      Chemistry12: "Chemistry 12",
      Biology12: "Biology 12",
      Geography12: "Geography 12",
      Science12_2: "At least 2 Grade 12 Science courses (Bio/Chem/Phys)",
    };
    
    return requiredCourses.map(course => ({
      key: course,
      label: courseLabels[course] || course,
      isMultiple: course === "Science12_2",
      isCore: (gates.coreSubjects || []).includes(course),
      coreMinScore: gates.coreMinScore || 75
    }));
  };
  
  // Get core subjects that need score input
  const getCoreSubjects = () => {
    const admissionData = getAdmissionData(selectedMajor);
    const gates = admissionData.gates || {};
    const coreSubjects = gates.coreSubjects || [];
    
    const courseLabels = {
      Math12: "Math 12",
      English12: "English 12",
      Physics12: "Physics 12",
      Chemistry12: "Chemistry 12",
      Biology12: "Biology 12",
    };
    
    return coreSubjects.map(course => ({
      key: course,
      label: courseLabels[course] || course,
      minScore: gates.coreMinScore || 75
    }));
  };
  
  // Check if program requires supplement
  const getSupplementInfo = () => {
    const admissionData = getAdmissionData(selectedMajor);
    const gates = admissionData.gates || {};
    
    return {
      required: gates.supplementRequired || false,
      type: gates.supplementType || null,
      weight: admissionData.weights?.supplement || 0,
      warning: admissionData.supplementWarning || null
    };
  };

  const calculateAdmissionChance = () => {
    const {
      gpa,
      courseDifficulty,
      extracurriculars,
      leadership,
      volunteering,
    } = formData;

    // Get admission data for selected major
    const admissionData = getAdmissionData(selectedMajor);

    // Convert GPA to number
    const gpaNum = parseFloat(gpa);
    if (!gpaNum || gpaNum < 0 || gpaNum > 100) {
      alert("Please enter a valid GPA between 0 and 100");
      return;
    }

    // Calculate GPA score (0-100)
    const gpaScore = gpaNum;

    // Apply course difficulty multiplier
    const difficultyMultiplier =
      admissionData.courseDifficultyMultiplier[courseDifficulty] || 1.0;
    const adjustedGpaScore = gpaScore * difficultyMultiplier;

    // Calculate Personal Profile score (0-100)
    // Average of extracurriculars, leadership, and volunteering (each 1-5 scale, convert to 0-100)
    const profileScore =
      ((parseInt(extracurriculars) +
        parseInt(leadership) +
        parseInt(volunteering)) /
        3) *
      20;

    // Weighted calculation using major-specific weights
    const finalScore =
      adjustedGpaScore * admissionData.gpaWeight +
      profileScore * admissionData.personalProfileWeight;

    // Determine admission chance
    let chance = "Low";
    let percentage = 0;
    let color = "#dc3545";

    // Use the new averageGPA structure (high/medium) or fallback to old structure (high/medium/low)
    const highThreshold = admissionData.averageGPA.high || 95;
    const mediumThreshold = admissionData.averageGPA.medium || 85;

    // Get competitiveness and acceptance rate data
    const competitiveness = admissionData.competitiveness || "medium";
    const acceptanceRateRange = admissionData.acceptanceRateRange || { low: 30, high: 50 };
    
    // Calculate percentage ranges based on competitiveness and historical acceptance rates
    let lowRangeStart, lowRangeEnd, mediumRangeEnd, highRangeEnd;
    
    if (competitiveness === "very_high") {
      lowRangeStart = 5;
      lowRangeEnd = 30;
      mediumRangeEnd = 60;
      highRangeEnd = 85;
    } else if (competitiveness === "high") {
      lowRangeStart = 10;
      lowRangeEnd = 40;
      mediumRangeEnd = 70;
      highRangeEnd = 90;
    } else if (competitiveness === "medium") {
      lowRangeStart = 15;
      lowRangeEnd = 50;
      mediumRangeEnd = 75;
      highRangeEnd = 92;
    } else {
      lowRangeStart = 20;
      lowRangeEnd = 55;
      mediumRangeEnd = 80;
      highRangeEnd = 95;
    }
    
    // Calculate percentage with smooth scaling across ranges
    if (finalScore >= highThreshold) {
      chance = "High";
      const range = 100 - highThreshold;
      const progress = range > 0 ? (finalScore - highThreshold) / range : 0;
      percentage = mediumRangeEnd + progress * (highRangeEnd - mediumRangeEnd);
      color = "#28a745";
    } else if (finalScore >= mediumThreshold) {
      chance = "Medium";
      const range = highThreshold - mediumThreshold;
      const progress = range > 0 ? (finalScore - mediumThreshold) / range : 0;
      percentage = lowRangeEnd + progress * (mediumRangeEnd - lowRangeEnd);
      color = "#ffc107";
    } else {
      chance = "Low";
      const progress = mediumThreshold > 0 ? finalScore / mediumThreshold : 0;
      percentage = lowRangeStart + progress * (lowRangeEnd - lowRangeStart);
      color = "#dc3545";
    }

    percentage = Math.max(5, Math.min(95, Math.round(percentage)));

    // Generate recommendations
    const recommendations = generateRecommendations(
      finalScore,
      gpaNum,
      profileScore,
      courseDifficulty,
      admissionData,
      selectedMajor
    );

    setResult({
      chance,
      percentage: Math.round(percentage),
      color,
      finalScore: Math.round(finalScore),
      recommendations,
      admissionData, // Include admission data for display
    });
    setShowResult(true);
  };

  const generateRecommendations = (
    finalScore,
    gpa,
    profileScore,
    difficulty,
    admissionData,
    majorName
  ) => {
    const recommendations = [];
    const highThreshold = admissionData.averageGPA.high || 95;
    const mediumThreshold = admissionData.averageGPA.medium || 85;
    const core = admissionData.core || "Academic Performance";
    const advice = admissionData.advice || "Continue maintaining academic performance and strengthen your personal profile.";

    // GPA-based recommendations
    if (gpa < mediumThreshold) {
      recommendations.push({
        type: "gpa",
        title: "Improve Academic Performance",
        description: `Your GPA (${gpa}%) is below ${majorName}'s average requirement. ${admissionData.focus || "Please focus on improving core subject grades."}`,
        action: admissionData.advice || "Consider tutoring or study groups to improve performance.",
      });
    }

    // Profile-based recommendations
    if (profileScore < 60) {
      const profileWeight = admissionData.personalProfileWeight || 0.25;
      if (profileWeight >= 0.3) {
        // High profile weight majors (e.g., Sauder, Design, Music)
        recommendations.push({
          type: "profile",
          title: "Strengthen Personal Profile",
          description: `${majorName} highly values personal profile (weight ${Math.round(profileWeight * 100)}%). ${admissionData.focus || "Your extracurricular activities and leadership experience need strengthening."}`,
          action: advice,
        });
      } else {
        recommendations.push({
          type: "profile",
          title: "Enhance Personal Profile",
          description: "Your extracurricular activities and leadership experience can be stronger.",
          action: "Join clubs, volunteer work, or take on leadership positions.",
        });
      }
    }

    // Course difficulty recommendations
    if (difficulty === "regular" && gpa >= 85) {
      recommendations.push({
        type: "courses",
        title: "Consider Advanced Courses",
        description: "You're performing well in regular courses. Consider taking AP or IB courses to strengthen your application.",
        action: "Advanced courses demonstrate academic rigor and can improve admission chances.",
      });
    }

    // Core-specific recommendations
    if (admissionData.core && admissionData.core !== "Academic Performance") {
      recommendations.push({
        type: "core",
        title: `${majorName} Core Requirements`,
        description: `${majorName}'s core is "${core}".`,
        action: advice,
      });
    }

    // Success message
    if (finalScore >= highThreshold) {
      recommendations.push({
        type: "success",
        title: "Strong Application Competitiveness",
        description: `Your application looks very competitive! ${majorName}'s core is "${core}", and you've already demonstrated relevant strengths.`,
        action: "Continue maintaining your grades and keep building your personal profile.",
      });
    }

    return recommendations;
  };

  const handleReset = () => {
    setFormData({
      gpa: "",
      courseDifficulty: "regular",
      extracurriculars: 3,
      leadership: 3,
      volunteering: 3,
      supplementScore: 50,
      applicantType: "domestic",
      gradeTrend: "stable",
      activityRelevance: "medium",
      roleDepth: "member",
      apExams: [], // Structured: Array<{ name: string, score: number }>
      activities: [], // Profile V2 activities
      courseStatus: {
        Math12: "completed",
        English12: "completed",
        Physics12: "notTaken",
        Chemistry12: "notTaken",
        Biology12: "notTaken",
        Geography12: "notTaken",
      },
      coreSubjectScores: {
        Math12: "",
        English12: "",
        Physics12: "",
        Chemistry12: "",
        Biology12: "",
      },
      completedCourses: {
        Math12: true,
        English12: true,
        Physics12: false,
        Chemistry12: false,
        Biology12: false,
        Geography12: false,
      },
    });
    setResult(null);
    setShowResult(false);
  };

  // Generate automatic scenario name
  const generateScenarioName = () => {
    if (realTimeResult) {
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${selectedMajor} - ${realTimeResult.percentage}% - ${date}`;
    }
    return `${selectedMajor} - ${new Date().toLocaleDateString()}`;
  };

  // Handle save scenario
  const handleSaveScenario = async () => {
    if (!realTimeResult) {
      alert('Please enter your information and wait for calculation to complete.');
      return;
    }

    const name = scenarioName.trim() || generateScenarioName();
    
    try {
      // Prepare inputs JSON (exclude completedCourses legacy field)
      const inputsToSave = {
        gpa: formData.gpa,
        courseDifficulty: formData.courseDifficulty,
        applicantType: formData.applicantType,
        gradeTrend: formData.gradeTrend,
        activityRelevance: formData.activityRelevance,
        roleDepth: formData.roleDepth,
        courseStatus: formData.courseStatus,
        coreSubjectScores: formData.coreSubjectScores,
        extracurriculars: formData.extracurriculars,
        leadership: formData.leadership,
        volunteering: formData.volunteering,
        supplementScore: formData.supplementScore,
        apExams: formData.apExams || [], // Structured format
        activities: formData.activities || [], // Profile V2 activities
      };

      // Prepare results JSON
      const resultsToSave = {
        percentage: realTimeResult.percentage,
        percentageRange: realTimeResult.percentageRange,
        finalScore: realTimeResult.finalScore,
        academicScore: realTimeResult.academicScore,
        profileScore: realTimeResult.profileScore,
        supplementScore: realTimeResult.supplementScore,
        chance: realTimeResult.chance,
        category: realTimeResult.category,
        gateCheck: realTimeResult.gateCheck,
        explanation: realTimeResult.explanation,
      };

      await createScenario(name, selectedMajor, inputsToSave, resultsToSave);
      setShowSaveDialog(false);
      setScenarioName("");
    } catch (error) {
      console.error('Error saving scenario:', error);
    }
  };

  // Handle load scenario into form
  const handleLoadScenario = (scenario) => {
    const inputs = scenario.inputs_json || scenario.inputs;
    if (!inputs) return;

    setSelectedMajor(scenario.program_id);
    setFormData(prev => ({
      ...prev,
      gpa: inputs.gpa || "",
      courseDifficulty: inputs.courseDifficulty || "regular",
      applicantType: inputs.applicantType || "domestic",
      gradeTrend: inputs.gradeTrend || "stable",
      activityRelevance: inputs.activityRelevance || "medium",
      roleDepth: inputs.roleDepth || "member",
      courseStatus: inputs.courseStatus || prev.courseStatus,
      coreSubjectScores: inputs.coreSubjectScores || prev.coreSubjectScores,
      extracurriculars: inputs.extracurriculars || 3,
      leadership: inputs.leadership || 3,
      volunteering: inputs.volunteering || 3,
      supplementScore: inputs.supplementScore || 50,
      apExams: (() => {
        // Backward compatibility: Handle old string[] format
        const apExamsInput = inputs.apExams || [];
        if (Array.isArray(apExamsInput) && apExamsInput.length > 0) {
          if (typeof apExamsInput[0] === 'string') {
            // Old format: convert string[] to structured format
            return apExamsInput.map(name => ({ name, score: 5 }));
          }
          // New format: already structured
          return apExamsInput;
        }
        return [];
      })(),
      activities: inputs.activities || [], // Profile V2 activities
    }));
    setShowScenariosList(false);
  };

  // Handle duplicate scenario
  const handleDuplicateScenario = async (scenarioId) => {
    try {
      await duplicateScenario(scenarioId);
      setShowScenariosList(false);
    } catch (error) {
      console.error('Error duplicating scenario:', error);
    }
  };

  // Handle delete scenario
  const handleDeleteScenario = async (scenarioId) => {
    if (window.confirm('Are you sure you want to delete this scenario?')) {
      try {
        await deleteScenario(scenarioId);
        // Clear comparison if deleted scenario was selected
        if (scenarioA?.id === scenarioId) setScenarioA(null);
        if (scenarioB?.id === scenarioId) setScenarioB(null);
        if (!scenarioA || !scenarioB) setShowComparison(false);
      } catch (error) {
        console.error('Error deleting scenario:', error);
      }
    }
  };

  // Handle start comparison
  const handleStartComparison = () => {
    if (scenarioA && scenarioB) {
      setShowComparison(true);
    }
  };

  return (
    <div className="applyinfo-page">
      <Navigation />
      <div className="applyinfo-container">
        {/* Step-by-Step Requirements Section */}
        <StepByStepRequirements />
        
        {/* Transition Layer */}
        <div className="transition-layer">
          <h2 className="transition-title">
            Find admission requirements and check your chances
          </h2>
        </div>

        {/* Application Info Section */}
        <div className="applyinfo-section" id="applyinfo-section">
          <div className="applyinfo-header">
            <h1>Application Information</h1>
            <p className="subtitle">Check admission requirements and calculate your chances</p>

            <div className="faculty-selector-applyinfo">
              <label htmlFor="major-applyinfo">Select Major:</label>
              <select
                id="major-applyinfo"
                value={selectedMajor}
                onChange={(e) => {
                  setSelectedMajor(e.target.value);
                  setResult(null);
                  setShowResult(false);
                }}
              >
                {majors.map((major) => (
                  <option key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="applyinfo-dashboard">
            {/* Left Side - Input Card */}
            <div className="applyinfo-input-card">
              <h2>Enter Your Information</h2>
              
              <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                
                <div className="form-group">
                  <label htmlFor="gpa">
                    <span className="input-icon"><Book size={20} /></span>
                    High School Average / GPA (%)
                  </label>
                  <input
                    type="number"
                    id="gpa"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    placeholder="e.g., 85"
                    min="0"
                    max="100"
                    step="0.1"
                    className="gpa-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="courseDifficulty">Course Difficulty</label>
                  <select
                    id="courseDifficulty"
                    name="courseDifficulty"
                    value={formData.courseDifficulty}
                    onChange={handleInputChange}
                  >
                    <option value="regular">Regular</option>
                    <option value="ap">AP (Advanced Placement)</option>
                    <option value="ib">IB (International Baccalaureate)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label htmlFor="apExams">
                    <span className="input-icon">📚</span>
                    AP Exams (Score of 5)
                  </label>
                  <MultiSelect
                    options={[
                      'AP Calculus AB',
                      'AP Calculus BC',
                      'AP Statistics',
                      'AP Physics 1',
                      'AP Physics 2',
                      'AP Physics C: Mechanics',
                      'AP Physics C: Electricity and Magnetism',
                      'AP Chemistry',
                      'AP Biology',
                      'AP English Language and Composition',
                      'AP English Literature and Composition'
                    ]}
                    value={(formData.apExams || []).map(ap => typeof ap === 'string' ? ap : ap.name)}
                    onChange={(selectedNames) => {
                      // Convert to structured format: all selected are assumed score 5
                      const structured = selectedNames.map(name => ({ name, score: 5 }));
                      setFormData(prev => ({ ...prev, apExams: structured }));
                    }}
                    placeholder="Select AP exams with score of 5..."
                  />
                  <small style={{ display: 'block', marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
                    Each selected AP exam (score of 5) adds 0.75% to your academic score and can reduce core subject penalties for matching subjects.
                  </small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="applicantType">
                    <span className="input-icon">🌍</span>
                    Applicant Type
                  </label>
                  <select
                    id="applicantType"
                    name="applicantType"
                    value={formData.applicantType}
                    onChange={handleInputChange}
                  >
                    <option value="domestic">Domestic (Canadian)</option>
                    <option value="international">International</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="gradeTrend">
                    <span className="input-icon">📈</span>
                    Grade Trend
                  </label>
                  <select
                    id="gradeTrend"
                    name="gradeTrend"
                    value={formData.gradeTrend}
                    onChange={handleInputChange}
                  >
                    <option value="rising">Rising</option>
                    <option value="stable">Stable</option>
                    <option value="declining">Declining</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Required Courses</h3>
                <p className="section-description">
                  Select the status of each course (Completed ✓, In Progress ⏳, Not Taken ✗)
                </p>
                
                {getRequiredCourses().length > 0 ? (
                  <div className="course-status-list">
                    {getRequiredCourses().map((course) => {
                      if (course.isMultiple) {
                        // Handle "Science12_2" - need at least 2 science courses
                        const scienceCourses = ["Physics12", "Chemistry12", "Biology12"];
                        const completedCount = scienceCourses.filter(c => formData.courseStatus[c] === "completed").length;
                        const inProgressCount = scienceCourses.filter(c => formData.courseStatus[c] === "inProgress").length;
                        
                        return (
                          <div key={course.key} className="course-status-group">
                            <div className="course-status-header">
                              <span className="course-name">{course.label}</span>
                              <span className={`course-count ${completedCount >= 2 ? 'complete' : ''}`}>
                                ({completedCount}/2 completed)
                              </span>
                            </div>
                            <div className="sub-courses-status">
                              {scienceCourses.map(sc => (
                                <div key={sc} className="course-status-item">
                                  <span className="course-label">{sc.replace("12", " 12")}</span>
                                  <select
                                    name={`courseStatus_${sc}`}
                                    value={formData.courseStatus[sc] || "notTaken"}
                                    onChange={handleInputChange}
                                    className="course-status-select"
                                  >
                                    <option value="completed">✓ Completed</option>
                                    <option value="inProgress">⏳ In Progress</option>
                                    <option value="notTaken">✗ Not Taken</option>
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={course.key} className="course-status-item">
                            <span className="course-label">
                              {course.label}
                              {course.isCore && <span className="core-badge">Core</span>}
                            </span>
                            <select
                              name={`courseStatus_${course.key}`}
                              value={formData.courseStatus[course.key] || "notTaken"}
                              onChange={handleInputChange}
                              className="course-status-select"
                            >
                              <option value="completed">✓ Completed</option>
                              <option value="inProgress">⏳ In Progress</option>
                              <option value="notTaken">✗ Not Taken</option>
                            </select>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <p className="no-required-courses">
                    This program has no specific required courses
                  </p>
                )}
              </div>
              
              {/* Core Subject Scores Section */}
              {getCoreSubjects().length > 0 && (
                <div className="form-section">
                  <h3 className="section-title">Core Subject Scores</h3>
                  <p className="section-description">
                    This program particularly values scores in the following subjects (recommended at least {getCoreSubjects()[0]?.minScore}%)
                  </p>
                  
                  <div className="core-scores-list">
                    {getCoreSubjects().map(subject => (
                      <div key={subject.key} className="core-score-item">
                        <label htmlFor={`coreScore_${subject.key}`}>
                          {subject.label}
                        </label>
                        <div className="score-input-wrapper">
                          <input
                            type="number"
                            id={`coreScore_${subject.key}`}
                            name={`coreScore_${subject.key}`}
                            value={formData.coreSubjectScores[subject.key] || ""}
                            onChange={handleInputChange}
                            placeholder={`Recommended ≥${subject.minScore}%`}
                            min="0"
                            max="100"
                            className="core-score-input"
                          />
                          <span className="score-unit">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-section">
                <h3 className="section-title">Personal Profile</h3>

                {/* Activities Form */}
                <ProfileActivitiesForm
                  activities={formData.activities || []}
                  onChange={(activities) => setFormData(prev => ({ ...prev, activities }))}
                  legacyRatings={{
                    extracurriculars: formData.extracurriculars,
                    leadership: formData.leadership,
                    volunteering: formData.volunteering
                  }}
                  gradeTrend={formData.gradeTrend}
                />
              </div>
              
              {/* Supplement Section - only for programs that require it */}
              {getSupplementInfo().required && (
                <div className="form-section supplement-section">
                  <h3 className="section-title">
                    <span className="supplement-icon"><Palette size={20} /></span>
                    Supplement Material ({getSupplementInfo().type || "Portfolio/Interview"})
                  </h3>
                  <p className="section-description supplement-warning">
                    ⚠️ This program requires supplement material submission. Weight: {Math.round((getSupplementInfo().weight || 0) * 100)}%
                  </p>
                  
                  <div className="form-group">
                    <label htmlFor="supplementScore">
                      Supplement Score (0-100)
                      <span className="rating-value">{formData.supplementScore}</span>
                    </label>
                    <input
                      type="range"
                      id="supplementScore"
                      name="supplementScore"
                      value={formData.supplementScore}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      step="5"
                    />
                    <div className="rating-labels">
                      <span>Not Submitted/Low</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Result Card */}
            <div className="applyinfo-result-card">
              <div className="result-card-header">
                <h2>Your Admission Chance</h2>
                <div className="result-card-actions">
                  {realTimeResult && (
                    <button 
                      className="btn-save-scenario"
                      onClick={() => setShowSaveDialog(true)}
                      title="Save this scenario"
                    >
                      💾 Save Scenario
                    </button>
                  )}
                  <button 
                    className="btn-manage-scenarios"
                    onClick={() => setShowScenariosList(!showScenariosList)}
                    title="Manage saved scenarios"
                  >
                    📋 Scenarios ({scenarios.length})
                  </button>
                </div>
              </div>
              
              {realTimeResult ? (
                <>
                  <div className="circular-progress-wrapper">
                    <div className="circular-progress-container">
                      <svg className="circular-progress" viewBox="0 0 200 200">
                        <circle
                          className="progress-background"
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke="#e0e0e0"
                          strokeWidth="12"
                        />
                        <circle
                          className="progress-bar"
                          cx="100"
                          cy="100"
                          r="90"
                          fill="none"
                          stroke={realTimeResult.color}
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 85}`}
                          strokeDashoffset={`${2 * Math.PI * 85 * (1 - realTimeResult.percentage / 100)}`}
                          transform="rotate(-90 100 100)"
                          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                        />
                      </svg>
                      <div className="progress-content">
                        <div className="progress-percentage" style={{ color: realTimeResult.color }}>
                          {realTimeResult.percentage}%
                        </div>
                        <div className="progress-label">Admission Probability</div>
                        {realTimeResult.percentageRange && (
                          <div className="progress-range" style={{ color: realTimeResult.color }}>
                            {realTimeResult.percentageRange.low}% - {realTimeResult.percentageRange.high}%
                          </div>
                        )}
                        {realTimeResult.uncertaintyExplanation && (
                          <div className="uncertainty-explanation" style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            {realTimeResult.uncertaintyExplanation}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Badges moved outside circle for better mobile layout */}
                    <div className="progress-badges-wrapper">
                      <div className="progress-badge" style={{ backgroundColor: realTimeResult.color }}>
                        {realTimeResult.chance}
                      </div>
                      {realTimeResult.category && (
                        <div className={`category-badge ${realTimeResult.category.toLowerCase()}`}>
                          {realTimeResult.category === "Safety" && "🛡️ "}
                          {realTimeResult.category === "Match" && "🎯 "}
                          {realTimeResult.category === "Reach" && <><Rocket size={16} /> </>}
                          {realTimeResult.category}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Disclaimer: Official data vs estimation */}
                  <div className="admission-disclaimer">
                    <p className="disclaimer-main">
                      Requirements and course mappings are based on UBC public information (2025–2026).
                      <br />
                      Your admission chance is an estimate designed to help with planning and comparison.
                      It is generated from historical trends and your inputs, is not affiliated with UBC, and does not guarantee admission.
                    </p>
                    {realTimeResult.percentageRange && (
                      <p className="disclaimer-ci">
                        The probability range reflects uncertainty based on incomplete or in-progress information.
                      </p>
                    )}
                  </div>
                  
                  <div className="result-details">
                    <div className="detail-item">
                      <span className="detail-label">Final Score:</span>
                      <span className="detail-value">{realTimeResult.finalScore}/100</span>
                    </div>
                    
                    {/* Gate Check Warning */}
                    {realTimeResult.gateCheck && !realTimeResult.gateCheck.passed && (
                      <div className="gate-warning">
                        <span className="warning-icon">⚠️</span>
                        <div className="warning-content">
                          <strong>Missing Required Courses:</strong>
                          {realTimeResult.gateCheck.missingCourses.join(", ")}
                          <br />
                          <small>Hard gate failure: Probability capped at 40%, category forced to Reach</small>
                        </div>
                      </div>
                    )}
                    
                    {/* In-Progress Courses Warning */}
                    {realTimeResult.gateCheck && realTimeResult.gateCheck.inProgressCourses && realTimeResult.gateCheck.inProgressCourses.length > 0 && (
                      <div className="gate-warning" style={{ background: '#fff3e0', borderColor: '#ff9800' }}>
                        <span className="warning-icon">⏳</span>
                        <div className="warning-content">
                          <strong>In-Progress Courses:</strong>
                          {realTimeResult.gateCheck.inProgressCourses.join(", ")}
                          <br />
                          <small>Maximum probability capped at {realTimeResult.gateCheck.gateCapMaxProb}% due to uncertainty. Final category determined by standard thresholds (≥70 = Safety).</small>
                        </div>
                      </div>
                    )}
                    
                    {/* Core Subject Deficit Warning */}
                    {realTimeResult.gateCheck && realTimeResult.gateCheck.totalCoreDeficit && realTimeResult.gateCheck.totalCoreDeficit > 0 && (
                      <div className="gate-warning" style={{ background: '#fff3e0', borderColor: '#ff9800' }}>
                        <span className="warning-icon">📉</span>
                        <div className="warning-content">
                          <strong>Core Subject Deficits:</strong>
                          Total deficit of {realTimeResult.gateCheck.totalCoreDeficit.toFixed(1)}%
                          <br />
                          <small>
                            Probability reduced by {Math.round((1 - realTimeResult.gateCheck.gateMultiplier) * 100)}% (multiplier: {realTimeResult.gateCheck.gateMultiplier.toFixed(3)})
                            {realTimeResult.gateCheck.insuredSubjects && realTimeResult.gateCheck.insuredSubjects.length > 0 && (
                              <span style={{ display: 'block', marginTop: '0.25rem', color: '#2e7d32' }}>
                                ✓ AP insurance applied: {realTimeResult.gateCheck.insuredSubjects.map(item => `${item.subject} (${item.apExam.name})`).join(', ')}
                              </span>
                            )}
                            {realTimeResult.gateCheck.uninsuredSubjects && realTimeResult.gateCheck.uninsuredSubjects.length > 0 && (
                              <span style={{ display: 'block', marginTop: '0.25rem', color: '#c62828' }}>
                                ⚠ Uninsured: {realTimeResult.gateCheck.uninsuredSubjects.map(item => item.subject).join(', ')}
                              </span>
                            )}
                            {formData.apExams && formData.apExams.length > 0 && realTimeResult.gateCheck.insuredSubjects && realTimeResult.gateCheck.insuredSubjects.length === 0 && (
                              <span style={{ display: 'block', marginTop: '0.25rem', color: '#666', fontStyle: 'italic' }}>
                                Note: AP exams provided, but none match the weak core subject(s).
                              </span>
                            )}
                          </small>
                        </div>
                      </div>
                    )}
                    
                    {/* Component Scores */}
                    <div className="component-scores">
                      <h4>Score Breakdown</h4>
                      <div className="score-item">
                        <span className="score-label">Academic Score:</span>
                        <span className="score-value">{realTimeResult.academicScore}/100</span>
                        <span className="score-weight">
                          ({Math.round((realTimeResult.weights?.academic || 0.75) * 100)}%)
                        </span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">Personal Profile:</span>
                        <span className="score-value">{realTimeResult.profileScore}/100</span>
                        <span className="score-weight">
                          ({Math.round((realTimeResult.weights?.profile || 0.25) * 100)}%)
                        </span>
                      </div>
                      {realTimeResult.supplementScore !== null && (
                        <div className="score-item">
                          <span className="score-label">Supplement Material:</span>
                          <span className="score-value">{realTimeResult.supplementScore}/100</span>
                          <span className="score-weight">
                            ({Math.round((realTimeResult.weights?.supplement || 0) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Gate Check Warning - Enhanced */}
                    {realTimeResult.gateCheck && realTimeResult.gateCheck.warnings && realTimeResult.gateCheck.warnings.length > 0 && (
                      <div className="gate-warnings">
                        {realTimeResult.gateCheck.warnings.map((warning, idx) => (
                          <div key={idx} className="warning-item core-warning">
                            <span className="warning-icon">⚠️</span>
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Supplement Warning */}
                    {realTimeResult.gateCheck && realTimeResult.gateCheck.supplementWarning && (
                      <div className="supplement-warning-box">
                        <span className="warning-icon"><AlertCircle size={20} /></span>
                        <span>{realTimeResult.gateCheck.supplementWarning}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Explanation Section - Layer 4 Output */}
                  {realTimeResult.explanation && (
                    <div className="explanation-section">
                      <h4>💡 Analysis & Recommendations</h4>
                      
                      {/* Top Actions */}
                      {realTimeResult.explanation.topActions && realTimeResult.explanation.topActions.length > 0 && (
                        <div className="top-actions">
                          <div className="actions-title">Fastest Ways to Improve Chances:</div>
                          <ul className="actions-list">
                            {realTimeResult.explanation.topActions.map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Detailed Explanations */}
                      {realTimeResult.explanation.explanations && realTimeResult.explanation.explanations.length > 0 && (
                        <div className="detailed-explanations">
                          {realTimeResult.explanation.explanations.slice(0, 3).map((exp, idx) => (
                            <div key={idx} className={`explanation-item ${exp.severity}`}>
                              <div className="exp-message">{exp.message}</div>
                              {exp.advice && <div className="exp-advice">{exp.advice}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {realTimeResult.admissionData && (
                    <div className="major-insights">
                      {realTimeResult.admissionData.core && (
                        <div className="insight-item">
                          <span className="insight-icon">🎯</span>
                          <div className="insight-content">
                            <div className="insight-label">Core Requirements</div>
                            <div className="insight-text">{realTimeResult.admissionData.core}</div>
                          </div>
                        </div>
                      )}
                      {realTimeResult.admissionData.focus && (
                        <div className="insight-item">
                          <span className="insight-icon">📋</span>
                          <div className="insight-content">
                            <div className="insight-label">Key Focus</div>
                            <div className="insight-text">{realTimeResult.admissionData.focus}</div>
                          </div>
                        </div>
                      )}
                      {realTimeResult.admissionData.advice && (
                        <div className="insight-item">
                          <span className="insight-icon">💡</span>
                          <div className="insight-content">
                            <div className="insight-label">Recommendation</div>
                            <div className="insight-text">{realTimeResult.admissionData.advice}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="no-data-state">
                  <div className="empty-circle">
                    <span>?</span>
                  </div>
                  <p className="no-data-instruction">Enter your GPA to see your admission chance</p>
                  
                  {/* Major Information Display */}
                  {(() => {
                    const admissionData = getAdmissionData(selectedMajor);
                    // Try to get minimum grade: prefer academicThreshold.min, fallback to averageGPA.medium
                    const minGrade = admissionData?.academicThreshold?.min || 
                                    admissionData?.averageGPA?.medium || 
                                    null;
                    const acceptanceRate = admissionData?.acceptanceRateRange || null;
                    const competitivenessLevel = admissionData?.competitivenessLevel || 3;
                    
                    // Adjust displayed acceptance rate to be more conservative for competitive programs
                    let displayedAcceptanceRate = acceptanceRate;
                    if (acceptanceRate && competitivenessLevel >= 4) {
                      // For highly competitive programs, show slightly lower acceptance rate
                      // to reflect the difficulty more accurately
                      const adjustment = competitivenessLevel >= 5 ? 3 : 2; // Reduce by 2-3%
                      displayedAcceptanceRate = {
                        low: Math.max(5, acceptanceRate.low - adjustment),
                        high: Math.max(10, acceptanceRate.high - adjustment)
                      };
                    }
                    
                    return (
                      <div className="major-info-display">
                        <div className="info-section">
                          <div className="info-label">Minimum Required Grade</div>
                          <div className={`info-value ${!minGrade ? 'unknown' : ''}`}>
                            {minGrade ? `${minGrade}%` : "Not known yet"}
                          </div>
                        </div>
                        
                        <div className="info-section">
                          <div className="info-label">Past Year Acceptance Rate</div>
                          <div className={`info-value ${!displayedAcceptanceRate ? 'unknown' : ''}`}>
                            {displayedAcceptanceRate 
                              ? `${displayedAcceptanceRate.low}% - ${displayedAcceptanceRate.high}%`
                              : "Not known yet"}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {showResult && result && (
            <div className="recommendations-section">

              <div className="recommendations">
                <h3>Recommendations</h3>
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                    <p className="recommendation-action">{rec.action}</p>
                  </div>
                ))}
              </div>

              <div className="result-disclaimer">
                <p>
                  <strong>Disclaimer:</strong> This calculation is based on
                  historical data and trends. It does not guarantee admission.
                  UBC uses a holistic admission process that considers many
                  factors beyond what can be calculated here.
                </p>
              </div>
            </div>
          )}

          {/* Save Scenario Dialog */}
          {showSaveDialog && (
            <>
              <div className="modal-overlay" onClick={() => setShowSaveDialog(false)} />
              <div className="save-scenario-modal">
                <div className="modal-header">
                  <h3>Save Scenario</h3>
                  <button className="close-btn" onClick={() => setShowSaveDialog(false)}>×</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="scenarioName">Scenario Name</label>
                    <input
                      type="text"
                      id="scenarioName"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      placeholder={generateScenarioName()}
                      className="form-input"
                    />
                    <small>Leave empty to use auto-generated name</small>
                  </div>
                  {scenarios.length >= 3 && (
                    <div className="warning-message">
                      ⚠️ You have reached the maximum of 3 scenarios. Please delete one before saving a new scenario.
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn-cancel" 
                    onClick={() => {
                      setShowSaveDialog(false);
                      setScenarioName("");
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-save" 
                    onClick={handleSaveScenario}
                    disabled={scenarios.length >= 3}
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Scenarios List Sidebar */}
          {showScenariosList && (
            <>
              <div className="modal-overlay" onClick={() => setShowScenariosList(false)} />
              <div className="scenarios-sidebar">
                <div className="sidebar-header">
                  <h3>Saved Scenarios</h3>
                  <button className="close-btn" onClick={() => setShowScenariosList(false)}>×</button>
                </div>
                <div className="scenarios-list">
                  {scenarios.length === 0 ? (
                    <div className="no-scenarios">
                      <p>No saved scenarios yet.</p>
                      <p>Save your current calculation to create your first scenario.</p>
                    </div>
                  ) : (
                    scenarios.map(scenario => {
                      const results = scenario.results_json || scenario.results || {};
                      return (
                        <div key={scenario.id} className="scenario-item">
                          <div className="scenario-item-header">
                            <h4>{scenario.scenario_name}</h4>
                            <span className="scenario-program-badge">{scenario.program_id}</span>
                          </div>
                          <div className="scenario-item-details">
                            <div className="scenario-probability">
                              Probability: <strong>{results.percentage?.toFixed(1) || 'N/A'}%</strong>
                            </div>
                            <div className="scenario-date">
                              {new Date(scenario.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="scenario-item-actions">
                            <button 
                              className="btn-load"
                              onClick={() => handleLoadScenario(scenario)}
                            >
                              Load
                            </button>
                            <button 
                              className="btn-duplicate"
                              onClick={() => handleDuplicateScenario(scenario.id)}
                            >
                              Copy
                            </button>
                            <button 
                              className="btn-delete"
                              onClick={() => handleDeleteScenario(scenario.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {/* Comparison Section */}
          <div className="comparison-section">
            <div className="comparison-header">
              <h2>Compare Scenarios</h2>
              <p>Select two scenarios to compare and see what factors make the biggest difference</p>
            </div>
            <div className="comparison-selectors">
              <div className="comparison-selector">
                <label htmlFor="scenarioA">Scenario A:</label>
                <select
                  id="scenarioA"
                  value={scenarioA?.id || ""}
                  onChange={(e) => {
                    const selected = scenarios.find(s => s.id === e.target.value);
                    setScenarioA(selected || null);
                    if (!selected || !scenarioB) setShowComparison(false);
                  }}
                >
                  <option value="">Select scenario...</option>
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.scenario_name} ({s.program_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="comparison-selector">
                <label htmlFor="scenarioB">Scenario B:</label>
                <select
                  id="scenarioB"
                  value={scenarioB?.id || ""}
                  onChange={(e) => {
                    const selected = scenarios.find(s => s.id === e.target.value);
                    setScenarioB(selected || null);
                    if (!scenarioA || !selected) setShowComparison(false);
                  }}
                >
                  <option value="">Select scenario...</option>
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.scenario_name} ({s.program_id})
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-compare"
                onClick={handleStartComparison}
                disabled={!scenarioA || !scenarioB}
              >
                Compare
              </button>
              {showComparison && (
                <button
                  className="btn-clear-comparison"
                  onClick={() => {
                    setShowComparison(false);
                    setScenarioA(null);
                    setScenarioB(null);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            {showComparison && scenarioA && scenarioB && (
              <ScenarioComparator
                scenarioA={scenarioA}
                scenarioB={scenarioB}
                onClose={() => setShowComparison(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyInfoPage;
