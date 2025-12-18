import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import StepByStepRequirements from "../components/StepByStepRequirements";
import "./CalculatorPage.css";
import {
  facultyAdmissionData,
  facultyRequirements,
  getAllFaculties,
} from "../data/facultiesData";

const CalculatorPage = () => {
  const navigate = useNavigate();
  const [selectedFaculty, setSelectedFaculty] = useState("arts");
  const [formData, setFormData] = useState({
    gpa: "",
    courseDifficulty: "regular",
    extracurriculars: 3,
    leadership: 3,
    volunteering: 3,
    targetProgram: "BA Arts",
  });
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    // Get admission data for selected faculty
    const admissionData =
      facultyAdmissionData[selectedFaculty] || facultyAdmissionData.arts;

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

    // Weighted calculation
    const finalScore =
      adjustedGpaScore * admissionData.gpaWeight +
      profileScore * admissionData.personalProfileWeight;

    // Determine admission chance
    let chance = "Low";
    let percentage = 0;
    let color = "#dc3545";

    if (finalScore >= admissionData.averageGPA.high) {
      chance = "High";
      percentage = 85 + Math.random() * 10; // 85-95%
      color = "#28a745";
    } else if (finalScore >= admissionData.averageGPA.medium) {
      chance = "Medium";
      percentage = 50 + Math.random() * 30; // 50-80%
      color = "#ffc107";
    } else {
      chance = "Low";
      percentage = 10 + Math.random() * 30; // 10-40%
      color = "#dc3545";
    }

    // Generate recommendations
    const recommendations = generateRecommendations(
      finalScore,
      gpaNum,
      profileScore,
      courseDifficulty,
      admissionData
    );

    setResult({
      chance,
      percentage: Math.round(percentage),
      color,
      finalScore: Math.round(finalScore),
      recommendations,
    });
    setShowResult(true);
  };

  const generateRecommendations = (
    finalScore,
    gpa,
    profileScore,
    difficulty,
    admissionData
  ) => {
    const recommendations = [];

    if (gpa < admissionData.averageGPA.medium) {
      recommendations.push({
        type: "gpa",
        title: "Improve Your Grades",
        description: `Your current GPA (${gpa}%) is below the average. Focus on improving your grades in core subjects.`,
        action: "Consider tutoring or study groups to boost your performance.",
      });
    }

    if (profileScore < 60) {
      recommendations.push({
        type: "profile",
        title: "Strengthen Your Personal Profile",
        description:
          "Your extracurricular activities and leadership experience could be stronger.",
        action:
          "Get involved in clubs, volunteer work, or leadership positions.",
      });
    }

    if (difficulty === "regular" && gpa >= 85) {
      recommendations.push({
        type: "courses",
        title: "Consider Advanced Courses",
        description:
          "You're doing well in regular courses. Consider taking AP or IB courses to strengthen your application.",
        action:
          "Advanced courses show academic rigor and can boost your admission chances.",
      });
    }

    if (finalScore >= admissionData.averageGPA.high) {
      recommendations.push({
        type: "success",
        title: "Strong Application",
        description: "Your application looks competitive!",
        action:
          "Continue maintaining your grades and keep building your profile.",
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
      targetProgram: "BA Arts",
    });
    setResult(null);
    setShowResult(false);
  };

  return (
    <div className="calculator-page">
      <Navigation />
      <div className="calculator-container">
        <div className="calculator-header">
          <h1>UBC Admission Chance Calculator</h1>
          <p className="subtitle">Calculate your admission probability</p>

          <div className="faculty-selector-calc">
            <label htmlFor="faculty-calc">Select Faculty:</label>
            <select
              id="faculty-calc"
              value={selectedFaculty}
              onChange={(e) => {
                setSelectedFaculty(e.target.value);
                setResult(null);
                setShowResult(false);
              }}
            >
              {getAllFaculties().map((facultyKey) => (
                <option key={facultyKey} value={facultyKey}>
                  {facultyRequirements[facultyKey].faculty}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="calculator-content">
          <div className="calculator-form">
            <h2>Enter Your Information</h2>

            <div className="form-group">
              <label htmlFor="gpa">High School Average / GPA (%)</label>
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
              <label htmlFor="targetProgram">Target Program</label>
              <select
                id="targetProgram"
                name="targetProgram"
                value={formData.targetProgram}
                onChange={handleInputChange}
              >
                <option value="BA Arts">BA Arts (General)</option>
                <option value="BA Psychology">BA Psychology</option>
                <option value="BA Economics">BA Economics</option>
                <option value="BA Political Science">
                  BA Political Science
                </option>
                <option value="BA English">BA English</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                onClick={calculateAdmissionChance}
                className="btn-calculate"
              >
                Calculate My Chance
              </button>
              {showResult && (
                <button onClick={handleReset} className="btn-reset">
                  Reset
                </button>
              )}
            </div>
          </div>

          {showResult && result && (
            <div className="calculator-result">
              <div className="result-header">
                <h2>Your Admission Chance</h2>
                <div
                  className="result-badge"
                  style={{ backgroundColor: result.color }}
                >
                  {result.chance}
                </div>
              </div>

              <div className="result-percentage">
                <div
                  className="percentage-circle"
                  style={{ borderColor: result.color }}
                >
                  <span style={{ color: result.color }}>
                    {result.percentage}%
                  </span>
                </div>
                <p className="percentage-label">
                  Estimated Admission Probability
                </p>
              </div>

              <div className="result-details">
                <div className="detail-item">
                  <span className="detail-label">Final Score:</span>
                  <span className="detail-value">{result.finalScore}/100</span>
                </div>
              </div>

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

        {/* Step-by-Step Requirements Section */}
        <StepByStepRequirements />
      </div>
    </div>
  );
};

export default CalculatorPage;
