import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import StepByStepRequirements from "../components/StepByStepRequirements";
import "./CalculatorPage.css";
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

const CalculatorPage = () => {
  const navigate = useNavigate();
  const [selectedMajor, setSelectedMajor] = useState("Arts");
  const [formData, setFormData] = useState({
    gpa: "",
    courseDifficulty: "regular",
    extracurriculars: 3,
    leadership: 3,
    volunteering: 3,
    supplementScore: 50, // For programs requiring portfolio/audition (0-100)
    // Course completion tracking (simplified - in real app, user would select courses)
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

  // Helper function: Check Gate requirements (hard threshold)
  const checkGateRequirements = (admissionData, completedCourses) => {
    if (!admissionData.requiredCourses || !admissionData.requiredCourses.gate) {
      return { passed: true, penalty: 0, missingCourses: [] };
    }

    const requiredCourses = admissionData.requiredCourses.gate;
    const missingCourses = [];
    
    // Handle special cases like "Science12_2" (need 2 science courses)
    for (const course of requiredCourses) {
      if (course === "Science12_2") {
        const scienceCount = (completedCourses.Physics12 ? 1 : 0) + 
                            (completedCourses.Chemistry12 ? 1 : 0) + 
                            (completedCourses.Biology12 ? 1 : 0);
        if (scienceCount < 2) {
          missingCourses.push("至少兩門 12 年級理科");
        }
      } else {
        // Direct course key match (e.g., "Math12", "English12")
        if (!completedCourses[course]) {
          missingCourses.push(course);
        }
      }
    }

    const penalty = missingCourses.length > 0 
      ? (admissionData.requiredCourses.penalty || -30) * missingCourses.length
      : 0;

    return {
      passed: missingCourses.length === 0,
      penalty,
      missingCourses
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
  const realTimeResult = useMemo(() => {
    if (!formData.gpa || formData.gpa === "") return null;
    
    const gpaNum = parseFloat(formData.gpa);
    if (!gpaNum || gpaNum < 0 || gpaNum > 100) return null;
    
    const admissionData = getAdmissionData(selectedMajor);
    
    // Stage 1: Gate Check (Hard Threshold)
    const gateCheck = checkGateRequirements(admissionData, formData.completedCourses);
    
    // Stage 2: Calculate component scores (0-100 each)
    const academicScore = calculateAcademicScore(
      formData.gpa, 
      formData.courseDifficulty, 
      admissionData
    );
    
    const profileScore = calculateProfileScore(
      formData.extracurriculars,
      formData.leadership,
      formData.volunteering
    );
    
    // Supplement score (for portfolio/audition programs)
    const supplementScore = admissionData.weights?.supplement > 0 
      ? parseFloat(formData.supplementScore) || 50
      : 0;
    
    // Stage 3: Weighted final score
    const weights = admissionData.weights || {
      academic: admissionData.gpaWeight || 0.7,
      profile: admissionData.personalProfileWeight || 0.3,
      supplement: admissionData.supplementWeight || 0.0
    };
    
    const finalScore = 
      academicScore * weights.academic +
      profileScore * weights.profile +
      supplementScore * weights.supplement +
      gateCheck.penalty; // Apply gate penalty
    
    // Stage 4: Convert to probability using sigmoid/logistic function
    const target = admissionData.targetScore || 80;
    const scale = admissionData.scale || 10;
    const rawProbability = sigmoid(finalScore, target, scale);
    
    // Convert to percentage (0-100%)
    const basePercentage = rawProbability * 100;
    
    // Add confidence interval (±5-10% depending on competitiveness)
    const competitivenessLevel = admissionData.competitivenessLevel || 3;
    const confidenceInterval = competitivenessLevel >= 4 ? 8 : 10;
    
    const percentageLow = Math.max(5, Math.min(95, Math.round(basePercentage - confidenceInterval)));
    const percentageHigh = Math.max(5, Math.min(95, Math.round(basePercentage + confidenceInterval)));
    const percentageMid = Math.round(basePercentage);
    
    // Determine chance level
    let chance = "Low";
    let color = "#dc3545";
    
    if (percentageMid >= 70) {
      chance = "High";
      color = "#28a745";
    } else if (percentageMid >= 40) {
      chance = "Medium";
      color = "#ffc107";
    } else {
      chance = "Low";
      color = "#dc3545";
    }
    
    return { 
      chance, 
      percentage: percentageMid,
      percentageRange: { low: percentageLow, high: percentageHigh },
      color, 
      finalScore: Math.round(finalScore * 100) / 100,
      academicScore: Math.round(academicScore * 100) / 100,
      profileScore: Math.round(profileScore * 100) / 100,
      supplementScore: weights.supplement > 0 ? Math.round(supplementScore * 100) / 100 : null,
      gateCheck,
      admissionData
    };
  }, [formData, selectedMajor]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle course completion checkboxes
      setFormData((prev) => ({
        ...prev,
        completedCourses: {
          ...prev.completedCourses,
          [name]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Get required courses for selected major
  const getRequiredCourses = () => {
    const admissionData = getAdmissionData(selectedMajor);
    if (!admissionData.requiredCourses || !admissionData.requiredCourses.gate || admissionData.requiredCourses.gate.length === 0) {
      return [];
    }
    
    const courses = admissionData.requiredCourses.gate;
    const courseLabels = {
      Math12: "Math 12 / Pre-Calculus 12",
      English12: "English 12",
      Physics12: "Physics 12",
      Chemistry12: "Chemistry 12",
      Biology12: "Biology 12",
      Geography12: "Geography 12",
      Science12_2: "至少兩門 12 年級理科 (Bio/Chem/Phys)",
    };
    
    return courses.map(course => ({
      key: course,
      label: courseLabels[course] || course,
      isMultiple: course === "Science12_2"
    }));
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
    <div className="calculator-page">
      <Navigation />
      <div className="calculator-container">
        {/* Step-by-Step Requirements Section */}
        <StepByStepRequirements />
        
        {/* Transition Layer */}
        <div className="transition-layer">
          <h2 className="transition-title">
            Based on your target program, let's calculate your chances.
          </h2>
        </div>

        {/* Calculator Section */}
        <div className="calculator-section" id="calculator-section">
          <div className="calculator-header">
            <h1>Admission Chance Calculator</h1>
            <p className="subtitle">Enter your information to see your admission probability</p>

            <div className="faculty-selector-calc">
              <label htmlFor="major-calc">Select Major:</label>
              <select
                id="major-calc"
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

          <div className="calculator-dashboard">
            {/* Left Side - Input Card */}
            <div className="calculator-input-card">
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
              </div>

              <div className="form-section">
                <h3 className="section-title">Required Courses</h3>
                <p className="section-description">
                  請選擇你已完成的必要課程（缺少必要課程會影響錄取機率）
                </p>
                
                {getRequiredCourses().length > 0 ? (
                  <div className="course-checkboxes">
                    {getRequiredCourses().map((course) => {
                      if (course.isMultiple) {
                        // Handle "Science12_2" - need at least 2 science courses
                        const scienceCount = 
                          (formData.completedCourses.Physics12 ? 1 : 0) +
                          (formData.completedCourses.Chemistry12 ? 1 : 0) +
                          (formData.completedCourses.Biology12 ? 1 : 0);
                        const isComplete = scienceCount >= 2;
                        
                        return (
                          <div key={course.key} className="course-checkbox-group">
                            <label className="course-checkbox-label">
                              <input
                                type="checkbox"
                                checked={isComplete}
                                disabled
                                className="course-checkbox"
                              />
                              <span className="checkbox-text">
                                {course.label}
                                {scienceCount > 0 && (
                                  <span className="course-count">
                                    ({scienceCount}/2)
                                  </span>
                                )}
                              </span>
                            </label>
                            <div className="sub-courses">
                              <label className="sub-course-checkbox">
                                <input
                                  type="checkbox"
                                  name="Physics12"
                                  checked={formData.completedCourses.Physics12}
                                  onChange={handleInputChange}
                                />
                                <span>Physics 12</span>
                              </label>
                              <label className="sub-course-checkbox">
                                <input
                                  type="checkbox"
                                  name="Chemistry12"
                                  checked={formData.completedCourses.Chemistry12}
                                  onChange={handleInputChange}
                                />
                                <span>Chemistry 12</span>
                              </label>
                              <label className="sub-course-checkbox">
                                <input
                                  type="checkbox"
                                  name="Biology12"
                                  checked={formData.completedCourses.Biology12}
                                  onChange={handleInputChange}
                                />
                                <span>Biology 12</span>
                              </label>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <label key={course.key} className="course-checkbox-label">
                            <input
                              type="checkbox"
                              name={course.key}
                              checked={formData.completedCourses[course.key] || false}
                              onChange={handleInputChange}
                              className="course-checkbox"
                            />
                            <span className="checkbox-text">{course.label}</span>
                          </label>
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

              </div>
            </div>

            {/* Right Side - Result Card */}
            <div className="calculator-result-card">
              <h2>Your Admission Chance</h2>
              
              {realTimeResult ? (
                <>
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
                      <div className="progress-badge" style={{ backgroundColor: realTimeResult.color }}>
                        {realTimeResult.chance}
                      </div>
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
                  </div>
                  
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
                  <p>Enter your GPA to see your admission chance</p>
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

export default CalculatorPage;
