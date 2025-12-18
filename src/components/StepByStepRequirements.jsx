import React, { useState, useEffect } from "react";
import "./StepByStepRequirements.css";
import requirementsData from "../data/detailed_requirements_enhanced.json";

const StepByStepRequirements = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDegree, setSelectedDegree] = useState("");
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState(null);

  const provinces = [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland & Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ];

  const degrees = [
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

  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    setLoading(true);
    try {
      // Use imported JSON data directly
      if (requirementsData && requirementsData.provinces) {
        setRequirements(requirementsData);
        console.log(
          "✅ Loaded requirements data:",
          Object.keys(requirementsData.provinces)
        );
      } else {
        console.warn("⚠️ Requirements data structure invalid, using fallback");
        setRequirements(getFallbackRequirements());
      }
    } catch (error) {
      console.error("❌ Error loading requirements:", error);
      console.log("Using fallback requirements data");
      setRequirements(getFallbackRequirements());
    }
    setLoading(false);
  };

  const getFallbackRequirements = () => {
    return {
      general_requirements: {
        requirements_list: [
          "Graduation from high school",
          "Minimum of 70% in Grade 11 or Grade 12 English (or their equivalents)",
          "At least six academic/non-academic Grade 12 courses (recommended, but not required)",
        ],
      },
      provinces: {
        "British Columbia": {
          name: "British Columbia",
          degrees: {
            Arts: {
              grade_12_requirements: ["English 12"],
              grade_11_requirements: [],
              related_courses: [
                "Language Arts",
                "Mathematics and Computation",
                "Second Languages",
                "Social Studies",
                "Visual and Performing Arts",
              ],
            },
            Science: {
              grade_12_requirements: [
                "English 12",
                "Pre-Calculus 12 or Calculus 12",
                "Chemistry 12",
                "Physics 12",
              ],
              grade_11_requirements: [],
              related_courses: [
                "Mathematics",
                "Chemistry",
                "Physics",
                "Biology",
              ],
            },
          },
        },
        Ontario: {
          name: "Ontario",
          degrees: {
            Arts: {
              grade_12_requirements: ["ENG4U"],
              grade_11_requirements: [],
              related_courses: [
                "English",
                "Mathematics",
                "Languages",
                "Social Sciences and Humanities",
                "Arts",
              ],
            },
            Science: {
              grade_12_requirements: [
                "ENG4U",
                "MCV4U (Calculus and Vectors)",
                "SCH4U (Chemistry)",
                "SPH4U (Physics)",
              ],
              grade_11_requirements: [],
              related_courses: [
                "Mathematics",
                "Chemistry",
                "Physics",
                "Biology",
              ],
            },
          },
        },
      },
    };
  };

  const handleProvinceSelect = (province) => {
    setSelectedProvince(province);
    setCurrentStep(2);
    setSelectedDegree(""); // Reset degree selection
  };

  const handleDegreeSelect = (degree) => {
    setSelectedDegree(degree);
    setCurrentStep(3);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedProvince("");
    setSelectedDegree("");
    setExpandedCourse(null);
  };

  const getCurrentRequirements = () => {
    if (!requirements || !selectedProvince || !selectedDegree) {
      console.log("Missing data:", {
        requirements: !!requirements,
        selectedProvince,
        selectedDegree,
      });
      return null;
    }

    const provinceData = requirements.provinces?.[selectedProvince];
    if (!provinceData) {
      console.log(
        "Province not found:",
        selectedProvince,
        "Available:",
        Object.keys(requirements.provinces || {})
      );
      return null;
    }

    // 數據結構是扁平的：degrees[degreeName] = degreeData
    const degrees = provinceData.degrees || {};

    // 首先嘗試直接查找（扁平結構）
    let degreeData = degrees[selectedDegree];

    // 如果沒找到，嘗試遍歷所有 faculty（嵌套結構，用於兼容）
    if (!degreeData) {
      for (const facultyKey in degrees) {
        if (degrees[facultyKey] && typeof degrees[facultyKey] === "object") {
          if (degrees[facultyKey][selectedDegree]) {
            degreeData = degrees[facultyKey][selectedDegree];
            break;
          }
        }
      }
    }

    if (!degreeData) {
      console.log(
        "Degree not found:",
        selectedDegree,
        "Available degrees:",
        Object.keys(degrees)
      );
      return null;
    }

    console.log(
      "✅ Found requirements for:",
      selectedProvince,
      selectedDegree,
      degreeData
    );

    return {
      general: requirements.general_requirements,
      province: provinceData,
      degree: degreeData,
    };
  };

  const toggleCourse = (course) => {
    setExpandedCourse(expandedCourse === course ? null : course);
  };

  if (loading) {
    return (
      <div className="step-requirements loading">
        <div className="loading-spinner"></div>
        <p>Loading admission requirements...</p>
      </div>
    );
  }

  return (
    <div className="step-requirements">
      <div className="step-header">
        <h2>Find Your Admission Requirements</h2>
        <p className="step-subtitle">
          Get personalized admission requirements in 3 easy steps
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="progress-indicator">
        <div
          className={`progress-step ${currentStep >= 1 ? "active" : ""} ${
            currentStep > 1 ? "completed" : ""
          }`}
        >
          <div className="step-number">1</div>
          <div className="step-label">Province</div>
        </div>
        <div
          className={`progress-line ${currentStep > 1 ? "completed" : ""}`}
        ></div>
        <div
          className={`progress-step ${currentStep >= 2 ? "active" : ""} ${
            currentStep > 2 ? "completed" : ""
          }`}
        >
          <div className="step-number">2</div>
          <div className="step-label">Degree</div>
        </div>
        <div
          className={`progress-line ${currentStep > 2 ? "completed" : ""}`}
        ></div>
        <div className={`progress-step ${currentStep >= 3 ? "active" : ""}`}>
          <div className="step-number">3</div>
          <div className="step-label">Requirements</div>
        </div>
      </div>

      {/* Step 1: Province Selection */}
      {currentStep === 1 && (
        <div className="step-content step-1">
          <h3>Step 1: Select Your Province</h3>
          <p className="step-description">
            Choose the Canadian province where you're completing high school
          </p>
          <div className="selection-grid provinces-grid">
            {provinces.map((province) => {
              // Get province abbreviation
              const getProvinceAbbr = (provinceName) => {
                const abbreviations = {
                  "Alberta": "AB",
                  "British Columbia": "BC",
                  "Manitoba": "MB",
                  "New Brunswick": "NB",
                  "Newfoundland & Labrador": "NL",
                  "Northwest Territories": "NT",
                  "Nova Scotia": "NS",
                  "Nunavut": "NU",
                  "Ontario": "ON",
                  "Prince Edward Island": "PE",
                  "Quebec": "QC",
                  "Saskatchewan": "SK",
                  "Yukon": "YT"
                };
                return abbreviations[provinceName] || provinceName.substring(0, 2).toUpperCase();
              };
              
              const isSelected = selectedProvince === province;
              
              return (
                <button
                  key={province}
                  className={`selection-card province-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleProvinceSelect(province)}
                >
                  <div className="province-abbr">{getProvinceAbbr(province)}</div>
                  <span className="card-label">{province}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Degree Selection */}
      {currentStep === 2 && (
        <div className="step-content step-2">
          <div className="step-breadcrumb">
            <button
              onClick={() => setCurrentStep(1)}
              className="breadcrumb-link"
            >
              ← Change Province
            </button>
            <span className="breadcrumb-current">
              Selected: {selectedProvince}
            </span>
          </div>

          <h3>Step 2: Select Your Degree Program</h3>
          <p className="step-description">
            Choose the degree program you're interested in applying to
          </p>

          <div className="selection-grid degrees-grid">
            {degrees.map((degree) => (
              <button
                key={degree}
                className="selection-card degree-card"
                onClick={() => handleDegreeSelect(degree)}
              >
                <span className="card-icon">🎓</span>
                <span className="card-label">{degree}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Requirements Display */}
      {currentStep === 3 &&
        (() => {
          const currentReqs = getCurrentRequirements();

          return (
            <div className="step-content step-3">
              <div className="step-breadcrumb">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="breadcrumb-link"
                >
                  ← Change Degree
                </button>
                <span className="breadcrumb-current">
                  {selectedProvince} • {selectedDegree}
                </span>
                <button onClick={handleReset} className="reset-button">
                  Start Over
                </button>
              </div>

              <h3>Your Admission Requirements</h3>

              {currentReqs ? (
                <>
                  {/* General Requirements */}
                  <div className="requirements-card">
                    <h4>
                      <span className="req-icon">📋</span>
                      General Admission Requirements
                    </h4>
                    <ul className="requirements-list">
                      {currentReqs.general?.requirements_list?.map(
                        (req, index) => (
                          <li key={index}>{req}</li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Grade 12 Requirements */}
                  {currentReqs.degree?.grade_12_requirements &&
                    currentReqs.degree.grade_12_requirements.length > 0 && (
                      <div className="requirements-card highlight-card">
                        <h4>
                          <span className="req-icon">📚</span>
                          Grade 12 Requirements
                        </h4>
                        <p className="card-description">
                          You must complete these specific Grade 12 courses:
                        </p>
                        <ul className="requirements-list highlight">
                          {currentReqs.degree.grade_12_requirements.map(
                            (req, index) => (
                              <li key={index}>
                                {req}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* Grade 11 Requirements */}
                  {currentReqs.degree?.grade_11_requirements &&
                    currentReqs.degree.grade_11_requirements.length > 0 && (
                      <div className="requirements-card">
                        <h4>
                          <span className="req-icon">📖</span>
                          Grade 11 Requirements
                        </h4>
                        <ul className="requirements-list">
                          {currentReqs.degree.grade_11_requirements.map(
                            (req, index) => (
                              <li key={index}>{req}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* Related Courses */}
                  {currentReqs.degree?.related_courses &&
                    currentReqs.degree.related_courses.length > 0 && (
                      <div className="requirements-card">
                        <h4>
                          <span className="req-icon">💡</span>
                          Related Courses (Recommended)
                        </h4>
                        <p className="card-description">
                          Consider taking courses in these subject areas to
                          strengthen your application:
                        </p>
                        <div className="related-courses-list">
                          {currentReqs.degree.related_courses.map(
                            (course, index) => (
                              <div key={index} className="related-course-item">
                                <button
                                  className={`course-button ${
                                    expandedCourse === course ? "expanded" : ""
                                  }`}
                                  onClick={() => toggleCourse(course)}
                                >
                                  <span className="course-name">{course}</span>
                                  <span className="expand-icon">
                                    {expandedCourse === course ? "−" : "+"}
                                  </span>
                                </button>
                                {expandedCourse === course && (
                                  <div className="course-details">
                                    <p>
                                      Taking courses in {course} will help you
                                      build a strong foundation for the{" "}
                                      {selectedDegree} program at UBC.
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Additional Info */}
                  {currentReqs.degree?.additional_info && (
                    <div className="requirements-card info-card">
                      <h4>
                        <span className="req-icon">ℹ️</span>
                        Additional Information
                      </h4>
                      <p>{currentReqs.degree.additional_info}</p>
                    </div>
                  )}

                  {/* Important Links */}
                  <div className="requirements-card links-card">
                    <h4>
                      <span className="req-icon">🔗</span>
                      Official Resources
                    </h4>
                    <div className="links-grid">
                      <a
                        href={`https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/#${selectedProvince
                          .toLowerCase()
                          .replace(/ /g, "-")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-link"
                      >
                        <span className="link-icon">📄</span>
                        <span className="link-text">
                          <strong>{selectedProvince} Requirements</strong>
                          <small>Official UBC page</small>
                        </span>
                      </a>
                      <a
                        href="https://you.ubc.ca/applying-ubc/how-to-apply/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-link"
                      >
                        <span className="link-icon">📝</span>
                        <span className="link-text">
                          <strong>How to Apply</strong>
                          <small>Application guide</small>
                        </span>
                      </a>
                      <a
                        href="https://you.ubc.ca/applying-ubc/requirements/english-language-competency/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-link"
                      >
                        <span className="link-icon">🗣️</span>
                        <span className="link-text">
                          <strong>English Requirements</strong>
                          <small>Language competency</small>
                        </span>
                      </a>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="disclaimer-box">
                    <strong>⚠️ Important Disclaimer:</strong> This information
                    is based on UBC's official admission standards but may not
                    reflect the most recent updates. Always verify requirements
                    on the official UBC website before applying. Admission is
                    competitive and meeting minimum requirements does not
                    guarantee acceptance.
                  </div>
                </>
              ) : (
                <div className="no-data-message">
                  <p>
                    Requirements data for <strong>{selectedDegree}</strong> in{" "}
                    <strong>{selectedProvince}</strong> is not available yet.
                    Please check the official UBC website or try a different
                    combination.
                  </p>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="btn-secondary"
                  >
                    Choose Different Degree
                  </button>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
};

export default StepByStepRequirements;
