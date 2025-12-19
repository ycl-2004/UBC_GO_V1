import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import StepByStepRequirements from "../components/StepByStepRequirements";
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
  const [selectedMajor, setSelectedMajor] = useState("Arts");
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
  
  // LAYER 1: Gate Check (Hard Threshold) - Enhanced
  const checkGateRequirements = (admissionData, courseStatus, coreSubjectScores) => {
    const gates = admissionData.gates || {};
    const requiredCourses = gates.requiredCourses || admissionData.requiredCourses?.gate || [];
    const courseStatusPenalty = gates.courseStatus || { completed: 0, inProgress: -5, notTaken: -30 };
    
    let totalPenalty = 0;
    const missingCourses = [];
    const warnings = [];
    
    // Check required courses and their status
    for (const course of requiredCourses) {
      if (course === "Science12_2") {
        // Special case: need 2 science courses
        const scienceCourses = ["Physics12", "Chemistry12", "Biology12"];
        const completedCount = scienceCourses.filter(c => courseStatus[c] === "completed").length;
        const inProgressCount = scienceCourses.filter(c => courseStatus[c] === "inProgress").length;
        
        if (completedCount + inProgressCount < 2) {
          missingCourses.push("至少兩門 12 年級理科");
          totalPenalty += courseStatusPenalty.notTaken;
        } else if (completedCount < 2) {
          totalPenalty += courseStatusPenalty.inProgress * (2 - completedCount);
        }
      } else {
        const status = courseStatus[course] || "notTaken";
        if (status === "notTaken") {
          missingCourses.push(course);
          totalPenalty += courseStatusPenalty.notTaken;
        } else if (status === "inProgress") {
          totalPenalty += courseStatusPenalty.inProgress;
        }
      }
    }
    
    // Check core subject minimum scores
    const coreSubjects = gates.coreSubjects || [];
    const coreMinScore = gates.coreMinScore || 75;
    let corePenalty = 0;
    
    for (const subject of coreSubjects) {
      const score = parseFloat(coreSubjectScores[subject]);
      if (score && score < coreMinScore) {
        const deficit = coreMinScore - score;
        corePenalty += Math.min(deficit * 0.5, 15); // Max 15 penalty per subject
        warnings.push(`${subject} 分數 (${score}%) 低於建議最低分數 (${coreMinScore}%)`);
      }
    }
    
    // Check supplement requirement
    const supplementRequired = gates.supplementRequired || false;
    const supplementType = gates.supplementType || null;
    let supplementWarning = null;
    
    if (supplementRequired) {
      supplementWarning = admissionData.supplementWarning || 
        `⚠️ 此科系需要提交 ${supplementType || "補充材料"}。未提交將無法準確估算。`;
    }
    
    return {
      passed: missingCourses.length === 0 && corePenalty === 0,
      penalty: totalPenalty + corePenalty,
      missingCourses,
      warnings,
      supplementRequired,
      supplementType,
      supplementWarning,
      gateWarning: admissionData.gateWarning || null
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
    
    // Profile Score (0-100)
    const ec = parseInt(formData.extracurriculars) || 3;
    const leadership = parseInt(formData.leadership) || 3;
    const volunteering = parseInt(formData.volunteering) || 3;
    let profileScore = ((ec + leadership + volunteering) / 3 / 5) * 100;
    
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
    
    // Supplement Score (0-100) - only for programs that require it
    const supplementScore = parseFloat(formData.supplementScore) || 50;
    
    return {
      academicScore: Math.round(academicScore * 100) / 100,
      profileScore: Math.round(profileScore * 100) / 100,
      supplementScore: Math.round(supplementScore * 100) / 100
    };
  };
  
  // LAYER 3: Probability Calculation - Enhanced with cap and range
  const calculateProbability = (scores, gateCheck, admissionData, applicantType) => {
    const weights = admissionData.weights || {
      academic: admissionData.gpaWeight || 0.7,
      profile: admissionData.personalProfileWeight || 0.3,
      supplement: admissionData.supplementWeight || 0.0
    };
    
    // Calculate weighted final score
    let finalScore = 
      scores.academicScore * weights.academic +
      scores.profileScore * weights.profile +
      scores.supplementScore * weights.supplement +
      gateCheck.penalty;
    
    // Adjust for international applicants
    const intlAdjust = admissionData.internationalAdjustment || { targetBonus: 1, capReduction: 2 };
    let target = admissionData.targetScore || 80;
    let scale = admissionData.scale || 8;
    let capMaxProb = admissionData.capMaxProb || 90;
    
    if (applicantType === "international") {
      target += intlAdjust.targetBonus;
      capMaxProb -= intlAdjust.capReduction;
    }
    
    // Calculate raw probability using sigmoid
    const rawProbability = sigmoid(finalScore, target, scale) * 100;
    
    // Apply cap
    const cappedProbability = Math.min(rawProbability, capMaxProb);
    
    // Calculate confidence interval based on data completeness
    let confidenceWidth = 8;
    if (gateCheck.warnings.length > 0) confidenceWidth += 3;
    if (gateCheck.supplementRequired && weights.supplement > 0.2) confidenceWidth += 5;
    
    const percentageLow = Math.max(5, Math.round(cappedProbability - confidenceWidth));
    const percentageHigh = Math.min(capMaxProb, Math.round(cappedProbability + confidenceWidth));
    const percentageMid = Math.round(cappedProbability);
    
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
    
    return {
      finalScore: Math.round(finalScore * 100) / 100,
      rawProbability: Math.round(rawProbability * 100) / 100,
      percentage: percentageMid,
      percentageRange: { low: percentageLow, high: percentageHigh },
      chance,
      color,
      category, // Safety/Match/Reach
      confidenceWidth
    };
  };
  
  // LAYER 4: Explanation Generation
  const generateExplanation = (gateCheck, scores, probability, admissionData) => {
    const explanations = [];
    
    // Gate issues (most critical)
    if (gateCheck.gateWarning && gateCheck.missingCourses.length > 0) {
      explanations.push({
        type: "gate",
        severity: "critical",
        message: `🚫 課程不足：缺少 ${gateCheck.missingCourses.join(", ")}`,
        advice: admissionData.gateWarning
      });
    }
    
    // Supplement warning
    if (gateCheck.supplementWarning) {
      explanations.push({
        type: "supplement",
        severity: "warning",
        message: gateCheck.supplementWarning,
        advice: `此科系 ${admissionData.weights?.supplement > 0.3 ? "主要" : "部分"} 依賴補充材料評估。`
      });
    }
    
    // Core subject warnings
    for (const warning of gateCheck.warnings) {
      explanations.push({
        type: "core",
        severity: "warning",
        message: `⚠️ ${warning}`,
        advice: "提高核心科目分數可以顯著增加錄取機率。"
      });
    }
    
    // Score-based insights
    const weights = admissionData.weights || {};
    if (weights.academic > 0.5 && scores.academicScore < 85) {
      explanations.push({
        type: "score",
        severity: "info",
        message: `📚 學術成績 (${scores.academicScore.toFixed(1)}) 還有提升空間`,
        advice: "此科系學術權重較高，提高 GPA 是最直接的方式。"
      });
    }
    
    if (weights.profile > 0.35 && scores.profileScore < 80) {
      explanations.push({
        type: "score",
        severity: "info",
        message: `👤 個人簡介 (${scores.profileScore.toFixed(1)}) 可以加強`,
        advice: admissionData.advice || "展示更多相關活動和領導經驗。"
      });
    }
    
    // Top 2 improvement actions
    const actions = [];
    if (gateCheck.missingCourses.length > 0) {
      actions.push(`修讀缺少的課程：${gateCheck.missingCourses.slice(0, 2).join(", ")}`);
    }
    if (scores.academicScore < 90 && weights.academic > 0.5) {
      actions.push("提高 GPA 到 90+ 以上");
    }
    if (scores.profileScore < 85 && weights.profile > 0.3) {
      actions.push("增加相關課外活動深度");
    }
    if (gateCheck.supplementRequired && scores.supplementScore < 70) {
      actions.push(`準備高質量的 ${gateCheck.supplementType || "補充材料"}`);
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
      formData.coreSubjectScores
    );
    
    // LAYER 2: Score Calculation
    const scores = calculateScores(formData, admissionData);
    
    // LAYER 3: Probability Calculation
    const probability = calculateProbability(
      scores, 
      gateCheck, 
      admissionData, 
      formData.applicantType
    );
    
    // LAYER 4: Explanation Generation
    const explanation = generateExplanation(gateCheck, scores, probability, admissionData);
    
    // Get weights for display
    const weights = admissionData.weights || {
      academic: admissionData.gpaWeight || 0.7,
      profile: admissionData.personalProfileWeight || 0.3,
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
      supplementScore: weights.supplement > 0 ? scores.supplementScore : null,
      
      // Gate check results
      gateCheck,
      
      // Explanation
      explanation,
      
      // Admission data for display
      admissionData,
      weights
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
      Science12_2: "至少兩門 12 年級理科 (Bio/Chem/Phys)",
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
    const core = admissionData.core || "學術表現";
    const advice = admissionData.advice || "繼續保持學術表現並加強個人簡介。";

    // GPA-based recommendations
    if (gpa < mediumThreshold) {
      recommendations.push({
        type: "gpa",
        title: "提升學業成績",
        description: `你的 GPA (${gpa}%) 低於 ${majorName} 的平均要求。${admissionData.focus || "請專注於提升核心科目的成績。"}`,
        action: admissionData.advice || "考慮參加補習或學習小組來提升表現。",
      });
    }

    // Profile-based recommendations
    if (profileScore < 60) {
      const profileWeight = admissionData.personalProfileWeight || 0.25;
      if (profileWeight >= 0.3) {
        // High profile weight majors (e.g., Sauder, Design, Music)
        recommendations.push({
          type: "profile",
          title: "強化個人簡介",
          description: `${majorName} 非常重視個人簡介 (權重 ${Math.round(profileWeight * 100)}%)。${admissionData.focus || "你的課外活動和領導經驗需要加強。"}`,
          action: advice,
        });
      } else {
        recommendations.push({
          type: "profile",
          title: "加強個人簡介",
          description: "你的課外活動和領導經驗可以更強。",
          action: "參與社團、志工工作或擔任領導職位。",
        });
      }
    }

    // Course difficulty recommendations
    if (difficulty === "regular" && gpa >= 85) {
      recommendations.push({
        type: "courses",
        title: "考慮進階課程",
        description: "你在常規課程中表現良好。考慮修讀 AP 或 IB 課程來加強申請。",
        action: "進階課程展現學術嚴謹性，可以提升錄取機會。",
      });
    }

    // Core-specific recommendations
    if (admissionData.core && admissionData.core !== "學術表現") {
      recommendations.push({
        type: "core",
        title: `${majorName} 的核心要求`,
        description: `${majorName} 的核心是「${core}」。`,
        action: advice,
      });
    }

    // Success message
    if (finalScore >= highThreshold) {
      recommendations.push({
        type: "success",
        title: "申請競爭力強",
        description: `你的申請看起來很有競爭力！${majorName} 的核心是「${core}」，你已經展現了相關實力。`,
        action: "繼續保持成績並持續建立你的個人簡介。",
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
                    <span className="input-icon">📚</span>
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
                    Grade Trend (成績趨勢)
                  </label>
                  <select
                    id="gradeTrend"
                    name="gradeTrend"
                    value={formData.gradeTrend}
                    onChange={handleInputChange}
                  >
                    <option value="rising">Rising (上升)</option>
                    <option value="stable">Stable (穩定)</option>
                    <option value="declining">Declining (下降)</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Required Courses (必修課程)</h3>
                <p className="section-description">
                  選擇每門課程的狀態（已完成 ✓、修讀中 ⏳、未修 ✗）
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
                                ({completedCount}/2 完成)
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
                                    <option value="completed">✓ 已完成</option>
                                    <option value="inProgress">⏳ 修讀中</option>
                                    <option value="notTaken">✗ 未修</option>
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
                              {course.isCore && <span className="core-badge">核心</span>}
                            </span>
                            <select
                              name={`courseStatus_${course.key}`}
                              value={formData.courseStatus[course.key] || "notTaken"}
                              onChange={handleInputChange}
                              className="course-status-select"
                            >
                              <option value="completed">✓ 已完成</option>
                              <option value="inProgress">⏳ 修讀中</option>
                              <option value="notTaken">✗ 未修</option>
                            </select>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <p className="no-required-courses">
                    此專業沒有特定的硬性課程要求
                  </p>
                )}
              </div>
              
              {/* Core Subject Scores Section */}
              {getCoreSubjects().length > 0 && (
                <div className="form-section">
                  <h3 className="section-title">Core Subject Scores (核心科目分數)</h3>
                  <p className="section-description">
                    此科系特別看重以下科目的分數（建議至少 {getCoreSubjects()[0]?.minScore}%）
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
                            placeholder={`建議 ≥${subject.minScore}%`}
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

                <div className="form-group">
              <label htmlFor="extracurriculars">
                Extracurricular Activities (1-5)
                <span className="rating-value">
                  {formData.extracurriculars}
                </span>
              </label>
              <input
                type="range"
                id="extracurriculars"
                name="extracurriculars"
                value={formData.extracurriculars}
                onChange={handleInputChange}
                min="1"
                max="5"
                step="1"
              />
              <div className="rating-labels">
                <span>Minimal</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="leadership">
                Leadership Experience (1-5)
                <span className="rating-value">{formData.leadership}</span>
              </label>
              <input
                type="range"
                id="leadership"
                name="leadership"
                value={formData.leadership}
                onChange={handleInputChange}
                min="1"
                max="5"
                step="1"
              />
              <div className="rating-labels">
                <span>Minimal</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="volunteering">
                Volunteering / Community Service (1-5)
                <span className="rating-value">{formData.volunteering}</span>
              </label>
              <input
                type="range"
                id="volunteering"
                name="volunteering"
                value={formData.volunteering}
                onChange={handleInputChange}
                min="1"
                max="5"
                step="1"
              />
              <div className="rating-labels">
                <span>Minimal</span>
                <span>Excellent</span>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="activityRelevance">
                <span className="input-icon">🎯</span>
                Activity Relevance (活動相關性)
              </label>
              <select
                id="activityRelevance"
                name="activityRelevance"
                value={formData.activityRelevance}
                onChange={handleInputChange}
              >
                <option value="high">High - 與申請科系高度相關</option>
                <option value="medium">Medium - 部分相關</option>
                <option value="low">Low - 不太相關</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="roleDepth">
                <span className="input-icon">👑</span>
                Role Depth (參與深度)
              </label>
              <select
                id="roleDepth"
                name="roleDepth"
                value={formData.roleDepth}
                onChange={handleInputChange}
              >
                <option value="founder">Founder / President (創辦人/主席)</option>
                <option value="executive">Executive / Leader (幹部/領導)</option>
                <option value="member">Member / Participant (成員/參與者)</option>
              </select>
            </div>

              </div>
              
              {/* Supplement Section - only for programs that require it */}
              {getSupplementInfo().required && (
                <div className="form-section supplement-section">
                  <h3 className="section-title">
                    <span className="supplement-icon">🎨</span>
                    Supplement Material ({getSupplementInfo().type || "作品/面試"})
                  </h3>
                  <p className="section-description supplement-warning">
                    ⚠️ 此科系需要提交補充材料。權重：{Math.round((getSupplementInfo().weight || 0) * 100)}%
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
                      <span>未提交/低</span>
                      <span>非常優秀</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Result Card */}
            <div className="applyinfo-result-card">
              <h2>Your Admission Chance</h2>
              
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
                          {realTimeResult.category === "Reach" && "🚀 "}
                          {realTimeResult.category}
                        </div>
                      )}
                    </div>
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
                          <strong>缺少必要課程：</strong>
                          {realTimeResult.gateCheck.missingCourses.join(", ")}
                          <br />
                          <small>已應用 {Math.abs(realTimeResult.gateCheck.penalty)} 分懲罰</small>
                        </div>
                      </div>
                    )}
                    
                    {/* Component Scores */}
                    <div className="component-scores">
                      <h4>評分細項</h4>
                      <div className="score-item">
                        <span className="score-label">學術成績 (Academic):</span>
                        <span className="score-value">{realTimeResult.academicScore}/100</span>
                        <span className="score-weight">
                          ({Math.round((realTimeResult.admissionData.weights?.academic || 0.7) * 100)}%)
                        </span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">個人簡介 (Profile):</span>
                        <span className="score-value">{realTimeResult.profileScore}/100</span>
                        <span className="score-weight">
                          ({Math.round((realTimeResult.admissionData.weights?.profile || 0.3) * 100)}%)
                        </span>
                      </div>
                      {realTimeResult.supplementScore !== null && (
                        <div className="score-item">
                          <span className="score-label">補充材料 (Supplement):</span>
                          <span className="score-value">{realTimeResult.supplementScore}/100</span>
                          <span className="score-weight">
                            ({Math.round((realTimeResult.admissionData.weights?.supplement || 0) * 100)}%)
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
                        <span className="warning-icon">🎨</span>
                        <span>{realTimeResult.gateCheck.supplementWarning}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Explanation Section - Layer 4 Output */}
                  {realTimeResult.explanation && (
                    <div className="explanation-section">
                      <h4>💡 分析與建議</h4>
                      
                      {/* Top Actions */}
                      {realTimeResult.explanation.topActions && realTimeResult.explanation.topActions.length > 0 && (
                        <div className="top-actions">
                          <div className="actions-title">提升機率最快的方式：</div>
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
                            <div className="insight-label">核心要求</div>
                            <div className="insight-text">{realTimeResult.admissionData.core}</div>
                          </div>
                        </div>
                      )}
                      {realTimeResult.admissionData.focus && (
                        <div className="insight-item">
                          <span className="insight-icon">📋</span>
                          <div className="insight-content">
                            <div className="insight-label">重點關注</div>
                            <div className="insight-text">{realTimeResult.admissionData.focus}</div>
                          </div>
                        </div>
                      )}
                      {realTimeResult.admissionData.advice && (
                        <div className="insight-item">
                          <span className="insight-icon">💡</span>
                          <div className="insight-content">
                            <div className="insight-label">建議</div>
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
        </div>
      </div>
    </div>
  );
};

export default ApplyInfoPage;
