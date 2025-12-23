// Multi-faculty data structure
// This will be populated from scraped data or can be manually maintained

export const facultyRequirements = {
  arts: {
    faculty: "Faculty of Arts",
    totalCredits: 120,
    requirements: {
      major: {
        credits: 42,
        description: "Complete major-specific requirements",
      },
      breadth: {
        science: {
          credits: 6,
          description: "Science courses (at least 6 credits)",
        },
        literature: {
          credits: 6,
          description: "Literature courses (at least 6 credits)",
        },
        language: {
          credits: 0,
          description: "Language requirement (varies by major)",
        },
      },
      communication: {
        credits: 6,
        description: "Communication courses (WRDS 150 or equivalent)",
      },
      electives: {
        credits: 60,
        description: "Elective courses to reach 120 total credits",
      },
    },
  },
  science: {
    faculty: "Faculty of Science",
    totalCredits: 120,
    requirements: {
      major: {
        credits: 48,
        description: "Complete major-specific requirements",
      },
      breadth: {
        arts: {
          credits: 12,
          description: "Arts courses (at least 12 credits)",
        },
        science: {
          credits: 0,
          description: "Science courses (varies by major)",
        },
      },
      communication: {
        credits: 6,
        description: "Communication courses",
      },
      electives: {
        credits: 54,
        description: "Elective courses to reach 120 total credits",
      },
    },
  },
  sauder: {
    faculty: "Sauder School of Business",
    totalCredits: 120,
    requirements: {
      major: {
        credits: 60,
        description: "Complete Commerce major requirements",
      },
      breadth: {
        arts: {
          credits: 12,
          description: "Arts courses (at least 12 credits)",
        },
        science: {
          credits: 6,
          description: "Science courses (at least 6 credits)",
        },
      },
      communication: {
        credits: 6,
        description: "Communication courses",
      },
      electives: {
        credits: 36,
        description: "Elective courses to reach 120 total credits",
      },
    },
  },
  appliedScience: {
    faculty: "Faculty of Applied Science",
    totalCredits: 148,
    requirements: {
      major: {
        credits: 90,
        description: "Complete engineering major requirements",
      },
      communication: {
        credits: 6,
        description: "Communication courses",
      },
      electives: {
        credits: 52,
        description: "Technical and complementary electives",
      },
      breadth: {}
    },
  },
}

/**
 * UBC Undergraduate Admission Data (Updated Dec 2025)
 * Based on historical trends and faculty-specific requirements.
 * This is the primary data source for major-specific admission calculations.
 * 
 * New 4-Layer Model Configuration:
 * - Gate Layer: Hard requirements that must be met
 * - Score Layer: A/P/S weighted scores + small factors
 * - Probability Layer: sigmoid + cap + range
 * - Explanation Layer: Why and recommendations
 */
export const facultyAdmissionData = {
  // Engineering / Applied Science
  "Applied Science (Engineering)": {
    // Legacy fields (for backward compatibility)
    gpaWeight: 0.65,
    personalProfileWeight: 0.35,
    supplementWeight: 0.0,
    averageGPA: { high: 94, medium: 91 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.05, ib: 1.07 },
    competitiveness: "very_high",
    acceptanceRateRange: { low: 15, high: 25 },
    
    // New 4-Layer Model Parameters
    competitivenessLevel: 5, // C(1-5), 5 = most competitive
    academicThreshold: { min: 80, ideal: 90 },
    
    // Gate Layer Configuration
    gates: {
      requiredCourses: ["Math12", "Physics12", "Chemistry12"],
      courseStatus: { // Penalty for course status
        completed: 0,
        inProgress: -5,
        notTaken: -40
      },
      coreSubjects: ["Math12", "Physics12", "Chemistry12"], // Must have high scores
      coreMinScore: 85, // Minimum score for core subjects
      supplementRequired: false, // Does this program require supplement material?
      supplementType: null // Type: "audition", "portfolio", "video", "interview", null
    },
    
    // Score Layer Configuration
    weights: {
      academic: 0.65,
      profile: 0.35,
      supplement: 0.0
    },
    
    // Probability Layer Configuration
    targetScore: 86,
    scale: 6.5,
    capMaxProb: 88, // Maximum probability cap
    
    // Explanation Layer
    core: "理科實力",
    focus: "強制看重 Math 12, Physics 12, Chemistry 12。",
    advice: "建議參加機器人社團 (Robotics) 或科學競賽來證明實踐能力。",
    evidenceRubric: "STEM 專題、機器人/程式/工程競賽、實作作品、研究/實習",
    gateWarning: "此科系必須修讀 Math 12、Physics 12、Chemistry 12。缺少任一課程將大幅降低錄取機率。",
    
    // Small Factors
    smallFactors: {
      gradeTrend: { rising: 3, stable: 0, declining: -5 },
      activityRelevance: { high: 3, medium: 1, low: -2 },
      depthMultiplier: { founder: 1.2, executive: 1.1, member: 1.0 }
    },
    
    // For international applicants
    internationalAdjustment: { targetBonus: 2, capReduction: 3 }
  },
  
  // Science
  "Science": {
    gpaWeight: 0.70,
    personalProfileWeight: 0.30,
    supplementWeight: 0.0,
    averageGPA: { high: 93, medium: 89 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.05, ib: 1.07 },
    competitiveness: "very_high",
    acceptanceRateRange: { low: 20, high: 30 },
    
    competitivenessLevel: 4,
    academicThreshold: { min: 80, ideal: 90 },
    
    gates: {
      requiredCourses: ["Math12", "Science12_2"],
      courseStatus: { completed: 0, inProgress: -5, notTaken: -30 },
      coreSubjects: ["Math12"],
      coreMinScore: 80,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.70, profile: 0.30, supplement: 0.0 },
    targetScore: 84,
    scale: 7.2,
    capMaxProb: 90,
    
    core: "學術廣度",
    focus: "至少修讀兩門 12 年級理科 (Bio/Chem/Phys)。",
    advice: "高分的數學與科學學分是核心，建議參加數學競賽 (AMC/COMC)。",
    evidenceRubric: "競賽、科展、研究、長期學術社團（不是只參加一次）",
    gateWarning: "此科系需要 Math 12 以及至少兩門理科 (Bio/Chem/Phys)。",
    
    smallFactors: {
      gradeTrend: { rising: 3, stable: 0, declining: -4 },
      activityRelevance: { high: 2, medium: 1, low: -1 },
      depthMultiplier: { founder: 1.2, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 2 }
  },

  // Business / Sauder
  "Commerce (UBC Sauder School of Business)": {
    gpaWeight: 0.55,
    personalProfileWeight: 0.45,
    supplementWeight: 0.0,
    averageGPA: { high: 92, medium: 88 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "very_high",
    acceptanceRateRange: { low: 10, high: 20 },
    
    competitivenessLevel: 5,
    academicThreshold: { min: 80, ideal: 90 },
    
    gates: {
      requiredCourses: ["English12", "Math12"],
      courseStatus: { completed: 0, inProgress: -5, notTaken: -25 },
      coreSubjects: ["Math12"],
      coreMinScore: 85,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.55, profile: 0.45, supplement: 0.0 },
    targetScore: 87,
    scale: 6.0,
    capMaxProb: 88,
    
    core: "領導力與潛力",
    focus: "PP (個人簡介) 分數決定一切，重視領導經驗與商業意識。",
    advice: "強調 DECA 競賽、創業經驗或具備量化成果的領袖經歷。",
    evidenceRubric: "領導力/創業/社團成果、DECA、實際影響（量化：人數、金額、成果）",
    gateWarning: "此科系需要 English 12 和 Math 12，且非常看重個人簡介 (PP)。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -4 },
      activityRelevance: { high: 5, medium: 2, low: -2 },
      depthMultiplier: { founder: 1.3, executive: 1.15, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 2, capReduction: 3 }
  },

  "Bachelor + Master of Management": {
    gpaWeight: 0.50,
    personalProfileWeight: 0.50,
    supplementWeight: 0.0,
    averageGPA: { high: 92, medium: 88 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "very_high",
    acceptanceRateRange: { low: 8, high: 15 },
    
    competitivenessLevel: 5,
    academicThreshold: { min: 80, ideal: 90 },
    
    gates: {
      requiredCourses: ["English12", "Math12"],
      courseStatus: { completed: 0, inProgress: -5, notTaken: -20 },
      coreSubjects: ["Math12"],
      coreMinScore: 88,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.50, profile: 0.50, supplement: 0.0 },
    targetScore: 88,
    scale: 6.2,
    capMaxProb: 85,
    
    core: "商業管理潛力",
    focus: "雙學位課程，PP 需體現極強的管理願望。",
    advice: "在 PP 中展示你如何平衡學術壓力與團隊管理能力。",
    evidenceRubric: "管理潛力：帶團隊、擴張成果、決策與協作案例",
    gateWarning: "雙學位課程競爭極激烈，PP 必須展現極強的管理潛力。",
    
    smallFactors: {
      gradeTrend: { rising: 3, stable: 0, declining: -5 },
      activityRelevance: { high: 5, medium: 2, low: -3 },
      depthMultiplier: { founder: 1.3, executive: 1.15, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 2, capReduction: 4 }
  },

  // Arts & Economics
  "Arts": {
    gpaWeight: 0.60,
    personalProfileWeight: 0.40,
    supplementWeight: 0.0,
    averageGPA: { high: 88, medium: 84 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "moderate",
    acceptanceRateRange: { low: 45, high: 60 },
    
    competitivenessLevel: 3,
    academicThreshold: { min: 80, ideal: 85 },
    
    gates: {
      requiredCourses: ["English12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -25 },
      coreSubjects: ["English12"],
      coreMinScore: 80,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.60, profile: 0.40, supplement: 0.0 },
    targetScore: 81,
    scale: 8.0,
    capMaxProb: 92,
    
    core: "人文素養",
    focus: "重視 English 12 成績及社會服務背景。",
    advice: "展現你的社區參與感，如校刊編輯、辯論隊或長期志工。",
    evidenceRubric: "校刊/辯論/志工、長期社會參與、寫作/思辨作品",
    gateWarning: "此科系需要 English 12，建議有良好的寫作和表達能力。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -2 },
      activityRelevance: { high: 3, medium: 1, low: 0 },
      depthMultiplier: { founder: 1.15, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 2 }
  },

  "International Economics": {
    gpaWeight: 0.70,
    personalProfileWeight: 0.30,
    supplementWeight: 0.0,
    averageGPA: { high: 93, medium: 90 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.05, ib: 1.07 },
    competitiveness: "very_high",
    acceptanceRateRange: { low: 15, high: 25 },
    
    competitivenessLevel: 5,
    academicThreshold: { min: 90, ideal: 95 },
    
    gates: {
      requiredCourses: ["Math12", "English12"],
      courseStatus: { completed: 0, inProgress: -8, notTaken: -50 },
      coreSubjects: ["Math12"],
      coreMinScore: 90,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.70, profile: 0.30, supplement: 0.0 },
    targetScore: 88,
    scale: 6.0,
    capMaxProb: 85,
    
    core: "數據分析能力",
    focus: "文學院最高門檻專業，極度看重 Math 12 分數。",
    advice: "雖然屬於文學院，但錄取標準接近理學院，數學必須極其優秀。",
    evidenceRubric: "數學/經濟相關競賽、分析作品（報告/研究/資料分析）",
    gateWarning: "BIE 是 UBC 最競爭的科系之一。Math 12 分數必須極高 (90+)，否則機率大幅下降。",
    
    smallFactors: {
      gradeTrend: { rising: 3, stable: 0, declining: -5 },
      activityRelevance: { high: 3, medium: 1, low: -2 },
      depthMultiplier: { founder: 1.2, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 3, capReduction: 5 }
  },

  "Media Studies": {
    gpaWeight: 0.55,
    personalProfileWeight: 0.45,
    supplementWeight: 0.0,
    averageGPA: { high: 90, medium: 86 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "high",
    acceptanceRateRange: { low: 25, high: 35 },
    
    competitivenessLevel: 4,
    academicThreshold: { min: 85, ideal: 90 },
    
    gates: {
      requiredCourses: ["English12"],
      courseStatus: { completed: 0, inProgress: -5, notTaken: -25 },
      coreSubjects: ["English12"],
      coreMinScore: 85,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.55, profile: 0.45, supplement: 0.0 },
    targetScore: 84,
    scale: 6.8,
    capMaxProb: 90,
    
    core: "創意表現",
    focus: "比一般 Arts 競爭更激烈，看重多媒體相關經歷。",
    advice: "建議在 PP 中提及媒體專案或相關志工經驗。",
    evidenceRubric: "作品集（文章/影片/專案）、媒體志工、策展/內容產出",
    gateWarning: "此科系競爭較激烈，需要良好的 English 12 成績和媒體相關經歷。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -3 },
      activityRelevance: { high: 5, medium: 2, low: -1 },
      depthMultiplier: { founder: 1.2, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 2 }
  },

  // Specialized Health & Science
  "Pharmaceutical Sciences": {
    gpaWeight: 0.70,
    personalProfileWeight: 0.30,
    supplementWeight: 0.10,
    averageGPA: { high: 94, medium: 91 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.05, ib: 1.07 },
    competitiveness: "very_high",
    acceptanceRateRange: { low: 5, high: 12 },
    
    competitivenessLevel: 5,
    academicThreshold: { min: 90, ideal: 95 },
    
    gates: {
      requiredCourses: ["Math12", "Chemistry12", "Biology12"],
      courseStatus: { completed: 0, inProgress: -10, notTaken: -60 },
      coreSubjects: ["Chemistry12", "Biology12", "Math12"],
      coreMinScore: 90,
      supplementRequired: true,
      supplementType: "interview" // 可能有面試
    },
    
    weights: { academic: 0.70, profile: 0.20, supplement: 0.10 },
    targetScore: 89,
    scale: 5.8,
    capMaxProb: 82,
    
    core: "藥理科研潛力",
    focus: "UBC 最競爭專業之一，數理化缺一不可。",
    advice: "GPA 必須處於頂尖水平，且理科成績需無懈可擊。",
    evidenceRubric: "研究/醫療志工、科學成果、（若有）面試表現單獨加分",
    gateWarning: "藥學院是 UBC 最難進的科系之一。需要 Math 12、Chemistry 12、Biology 12，且分數必須極高。可能需要面試。",
    
    smallFactors: {
      gradeTrend: { rising: 3, stable: 0, declining: -6 },
      activityRelevance: { high: 4, medium: 1, low: -2 },
      depthMultiplier: { founder: 1.2, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 3, capReduction: 5 }
  },

  "Kinesiology": {
    gpaWeight: 0.65,
    personalProfileWeight: 0.35,
    supplementWeight: 0.0,
    averageGPA: { high: 90, medium: 86 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "high",
    acceptanceRateRange: { low: 20, high: 30 },
    
    competitivenessLevel: 4,
    academicThreshold: { min: 80, ideal: 90 },
    
    gates: {
      requiredCourses: ["Biology12", "English12"],
      courseStatus: { completed: 0, inProgress: -5, notTaken: -25 },
      coreSubjects: ["Biology12"],
      coreMinScore: 80,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.65, profile: 0.35, supplement: 0.0 },
    targetScore: 84,
    scale: 7.0,
    capMaxProb: 90,
    
    core: "科學與運動背景",
    focus: "看重生物成績與對運動科學的熱情。",
    advice: "建議具備校隊運動經歷、教練經驗或醫護相關志工背景。",
    evidenceRubric: "校隊/運動成就、教練/帶隊、醫護/復健相關志工（真實時數+反思）",
    gateWarning: "此科系需要 Biology 12 和 English 12，並看重運動相關經歷。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -3 },
      activityRelevance: { high: 5, medium: 2, low: 0 },
      depthMultiplier: { founder: 1.15, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 2 }
  },

  "Dental Hygiene": {
    gpaWeight: 0.60,
    personalProfileWeight: 0.25,
    supplementWeight: 0.15,
    averageGPA: { high: 88, medium: 84 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "high",
    acceptanceRateRange: { low: 25, high: 35 },
    
    competitivenessLevel: 5,
    academicThreshold: { min: 80, ideal: 90 },
    
    gates: {
      requiredCourses: ["Biology12", "Chemistry12", "English12"],
      courseStatus: { completed: 0, inProgress: -8, notTaken: -30 },
      coreSubjects: ["Biology12", "Chemistry12"],
      coreMinScore: 85,
      supplementRequired: true,
      supplementType: "interview"
    },
    
    weights: { academic: 0.60, profile: 0.25, supplement: 0.15 },
    targetScore: 88,
    scale: 5.8,
    capMaxProb: 85,
    
    core: "臨床責任感",
    focus: "需要展現極強的職業責任感與細緻度。",
    advice: "建議具備診所觀察實習經歷，並在 PP 中強調溝通能力。",
    evidenceRubric: "診所/臨床影子、責任感證據、服務品質（不是只拼時數）",
    gateWarning: "此科系通常需要面試或補充材料。需要 Biology 12、Chemistry 12、English 12。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -4 },
      activityRelevance: { high: 4, medium: 2, low: -1 },
      depthMultiplier: { founder: 1.2, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 2, capReduction: 3 }
  },

  // Creative Arts & Design
  "Design in Architecture, Landscape Architecture, and Urbanism": {
    gpaWeight: 0.35,
    personalProfileWeight: 0.25,
    supplementWeight: 0.40,
    averageGPA: { high: 86, medium: 82 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "high",
    acceptanceRateRange: { low: 15, high: 25 },
    
    competitivenessLevel: 5,
    academicThreshold: { min: 82, ideal: 88 },
    
    gates: {
      requiredCourses: ["English12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -15 },
      coreSubjects: [],
      coreMinScore: 75,
      supplementRequired: true, // 必須有 creative test/video
      supplementType: "creative_test" // creative test / video
    },
    
    weights: { academic: 0.35, profile: 0.25, supplement: 0.40 },
    targetScore: 85,
    scale: 5.6,
    capMaxProb: 88,
    
    core: "設計作品集 (Portfolio)",
    focus: "必須提交創意作品集，這比分數更重要。",
    advice: "GPA 達到門檻後，錄取與否幾乎完全取決於 Portfolio 的品質。",
    evidenceRubric: "Creative test / video / 實作專案（不要假設一定是 portfolio）",
    gateWarning: "⚠️ 此科系必須提交創意測試 (Creative Test) 或影片。沒有提交補充材料將無法估算錄取機率。",
    supplementWarning: "即使學術與活動滿分，如果創意測試/作品集表現不佳，錄取機率仍會很低。",
    
    smallFactors: {
      gradeTrend: { rising: 1, stable: 0, declining: -2 },
      activityRelevance: { high: 3, medium: 1, low: 0 },
      depthMultiplier: { founder: 1.1, executive: 1.05, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 2, capReduction: 3 }
  },

  "Fine Arts": {
    gpaWeight: 0.25,
    personalProfileWeight: 0.20,
    supplementWeight: 0.55,
    averageGPA: { high: 85, medium: 80 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "medium",
    acceptanceRateRange: { low: 30, high: 45 },
    
    competitivenessLevel: 4,
    academicThreshold: { min: 75, ideal: 80 },
    
    gates: {
      requiredCourses: ["English12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -15 },
      coreSubjects: [],
      coreMinScore: 70,
      supplementRequired: true,
      supplementType: "portfolio" // Portfolio/Audition
    },
    
    weights: { academic: 0.25, profile: 0.20, supplement: 0.55 },
    targetScore: 83,
    scale: 5.4,
    capMaxProb: 90,
    
    core: "藝術表現力",
    focus: "作品集 (Portfolio) 是核心評核標準。",
    advice: "分數過門檻後，重點在於個人作品的獨特性與藝術張力。",
    evidenceRubric: "Portfolio/Audition（作品深度、成熟度、敘事能力）",
    gateWarning: "⚠️ 此科系必須提交作品集 (Portfolio) 或參加試演 (Audition)。沒有提交將無法估算。",
    supplementWarning: "即使學術與活動滿分，如果作品集表現不佳，錄取機率仍會很低。",
    
    smallFactors: {
      gradeTrend: { rising: 1, stable: 0, declining: -1 },
      activityRelevance: { high: 3, medium: 1, low: 0 },
      depthMultiplier: { founder: 1.1, executive: 1.05, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 2 }
  },

  "Music": {
    gpaWeight: 0.20,
    personalProfileWeight: 0.20,
    supplementWeight: 0.60,
    averageGPA: { high: 84, medium: 80 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "medium",
    acceptanceRateRange: { low: 35, high: 50 },
    
    competitivenessLevel: 5,
    academicThreshold: { min: 75, ideal: 80 },
    
    gates: {
      requiredCourses: [],
      courseStatus: { completed: 0, inProgress: -2, notTaken: -10 },
      coreSubjects: [],
      coreMinScore: 70,
      supplementRequired: true, // 必須 Audition
      supplementType: "audition"
    },
    
    weights: { academic: 0.20, profile: 0.20, supplement: 0.60 },
    targetScore: 84,
    scale: 5.2,
    capMaxProb: 88,
    
    core: "試奏/試唱 (Audition)",
    focus: "面試與 Audition 是主要評核標準。",
    advice: "分數僅為門檻，你的專業演奏/演唱水平決定一切。",
    evidenceRubric: "Audition/試奏（技術+音樂性）+ 面試表達",
    gateWarning: "⚠️ 此科系必須通過試奏/試唱 (Audition)。沒有參加 Audition 將無法估算錄取機率。",
    supplementWarning: "即使學術與活動滿分，試奏未達標仍會大幅影響錄取。Audition 占比高達 60%。",
    
    smallFactors: {
      gradeTrend: { rising: 1, stable: 0, declining: -1 },
      activityRelevance: { high: 2, medium: 1, low: 0 },
      depthMultiplier: { founder: 1.05, executive: 1.02, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 2 }
  },

  // Land and Food Systems & Forestry
  "Applied Biology": {
    gpaWeight: 0.65,
    personalProfileWeight: 0.35,
    supplementWeight: 0.0,
    averageGPA: { high: 87, medium: 83 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "medium",
    acceptanceRateRange: { low: 40, high: 55 },
    
    competitivenessLevel: 3,
    academicThreshold: { min: 78, ideal: 85 },
    
    gates: {
      requiredCourses: ["Biology12", "Chemistry12", "Math12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -20 },
      coreSubjects: ["Biology12"],
      coreMinScore: 75,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.65, profile: 0.35, supplement: 0.0 },
    targetScore: 80,
    scale: 8.2,
    capMaxProb: 92,
    
    core: "生物應用熱情",
    focus: "適合對可持續發展有興趣者，看重生物學分。",
    advice: "在 PP 中強調你對解決環境或食物問題的實踐與想法。",
    evidenceRubric: "社區服務、可持續發展專案、農食/健康領域實作",
    gateWarning: "此科系需要 Biology 12、Chemistry 12 和 Math 12。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -2 },
      activityRelevance: { high: 3, medium: 1, low: 0 },
      depthMultiplier: { founder: 1.15, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 1 }
  },

  "Food, Nutrition, and Health": {
    gpaWeight: 0.65,
    personalProfileWeight: 0.35,
    supplementWeight: 0.0,
    averageGPA: { high: 88, medium: 84 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "medium",
    acceptanceRateRange: { low: 35, high: 50 },
    
    competitivenessLevel: 3,
    academicThreshold: { min: 78, ideal: 85 },
    
    gates: {
      requiredCourses: ["Biology12", "Chemistry12", "Math12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -20 },
      coreSubjects: ["Biology12", "Chemistry12"],
      coreMinScore: 75,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.65, profile: 0.35, supplement: 0.0 },
    targetScore: 81,
    scale: 8.0,
    capMaxProb: 92,
    
    core: "健康與營養意識",
    focus: "看重化學與生物成績。",
    advice: "建議具備社區服務背景或健康食品相關研究興趣。",
    evidenceRubric: "社區服務、可持續發展專案、農食/健康領域實作",
    gateWarning: "此科系需要 Biology 12、Chemistry 12 和 Math 12。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -2 },
      activityRelevance: { high: 3, medium: 1, low: 0 },
      depthMultiplier: { founder: 1.15, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 1 }
  },

  "Food and Resource Economics": {
    gpaWeight: 0.65,
    personalProfileWeight: 0.35,
    supplementWeight: 0.0,
    averageGPA: { high: 88, medium: 84 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "medium",
    acceptanceRateRange: { low: 40, high: 55 },
    
    competitivenessLevel: 3,
    academicThreshold: { min: 78, ideal: 85 },
    
    gates: {
      requiredCourses: ["Math12", "Biology12", "Chemistry12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -25 },
      coreSubjects: ["Math12"],
      coreMinScore: 80,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.65, profile: 0.35, supplement: 0.0 },
    targetScore: 81,
    scale: 8.0,
    capMaxProb: 92,
    
    core: "經濟與農業分析",
    focus: "結合商科與農業經濟，數學分數極其重要。",
    advice: "適合對農業資源配置感興趣的同學，數學需強。",
    evidenceRubric: "社區服務、可持續發展專案、農食/健康領域實作",
    gateWarning: "此科系需要 Math 12、Biology 12 和 Chemistry 12，特別看重 Math。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -2 },
      activityRelevance: { high: 3, medium: 1, low: 0 },
      depthMultiplier: { founder: 1.15, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 1, capReduction: 1 }
  },

  "Natural Resources": {
    gpaWeight: 0.60,
    personalProfileWeight: 0.40,
    supplementWeight: 0.0,
    averageGPA: { high: 86, medium: 82 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "moderate",
    acceptanceRateRange: { low: 45, high: 60 },
    
    competitivenessLevel: 3,
    academicThreshold: { min: 75, ideal: 82 },
    
    gates: {
      requiredCourses: ["Biology12", "Math12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -15 },
      coreSubjects: ["Biology12"],
      coreMinScore: 70,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.60, profile: 0.40, supplement: 0.0 },
    targetScore: 79,
    scale: 8.5,
    capMaxProb: 93,
    
    core: "環保實踐",
    focus: "看重地理或生物學分。",
    advice: "建議有戶外實踐、露營經歷或環保組織工作背景。",
    evidenceRubric: "戶外實踐、環保志工、專案（監測/復育/社群活動）",
    gateWarning: "此科系需要 Biology 12 和 Math 12。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -2 },
      activityRelevance: { high: 4, medium: 2, low: 0 },
      depthMultiplier: { founder: 1.15, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 0, capReduction: 1 }
  },

  "Urban Forestry": {
    gpaWeight: 0.60,
    personalProfileWeight: 0.40,
    supplementWeight: 0.0,
    averageGPA: { high: 86, medium: 82 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "moderate",
    acceptanceRateRange: { low: 45, high: 60 },
    
    competitivenessLevel: 3,
    academicThreshold: { min: 75, ideal: 82 },
    
    gates: {
      requiredCourses: ["Biology12", "Math12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -15 },
      coreSubjects: ["Biology12"],
      coreMinScore: 70,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.60, profile: 0.40, supplement: 0.0 },
    targetScore: 79,
    scale: 8.5,
    capMaxProb: 93,
    
    core: "城市生態基礎",
    focus: "看重數理基礎與對城市綠化的理解。",
    advice: "建議展示對城市可持續規劃的關注或參與相關志工。",
    evidenceRubric: "戶外實踐、環保志工、專案（監測/復育/社群活動）",
    gateWarning: "此科系需要 Biology 12 和 Math 12。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -2 },
      activityRelevance: { high: 4, medium: 2, low: 0 },
      depthMultiplier: { founder: 1.15, executive: 1.1, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 0, capReduction: 1 }
  },

  // Indigenous & Education
  "Indigenous Land Stewardship": {
    gpaWeight: 0.45,
    personalProfileWeight: 0.55,
    supplementWeight: 0.0,
    averageGPA: { high: 84, medium: 80 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "moderate",
    acceptanceRateRange: { low: 50, high: 65 },
    
    competitivenessLevel: 4,
    academicThreshold: { min: 78, ideal: 85 },
    
    gates: {
      requiredCourses: ["English12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -20 },
      coreSubjects: ["English12"],
      coreMinScore: 75,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.45, profile: 0.55, supplement: 0.0 },
    targetScore: 82,
    scale: 7.0,
    capMaxProb: 92,
    
    core: "文化理解與實踐",
    focus: "看重對原住民文化的了解與社會實踐。",
    advice: "PP 中需體現對土地權利、文化傳承的深度思考。",
    evidenceRubric: "社區參與、文化理解、長期服務與真實反思",
    gateWarning: "此科系需要 English 12，且非常看重個人簡介中的社區參與和文化理解。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -2 },
      activityRelevance: { high: 6, medium: 3, low: 0 },
      depthMultiplier: { founder: 1.2, executive: 1.15, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 0, capReduction: 1 }
  },

  "Indigenous Teacher Education Program (NITEP)": {
    gpaWeight: 0.45,
    personalProfileWeight: 0.55,
    supplementWeight: 0.0,
    averageGPA: { high: 84, medium: 80 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "moderate",
    acceptanceRateRange: { low: 50, high: 65 },
    
    competitivenessLevel: 4,
    academicThreshold: { min: 78, ideal: 85 },
    
    gates: {
      requiredCourses: ["English12"],
      courseStatus: { completed: 0, inProgress: -3, notTaken: -20 },
      coreSubjects: ["English12"],
      coreMinScore: 75,
      supplementRequired: false,
      supplementType: null
    },
    
    weights: { academic: 0.45, profile: 0.55, supplement: 0.0 },
    targetScore: 82,
    scale: 7.0,
    capMaxProb: 92,
    
    core: "教育使命感",
    focus: "看重社區服務背景，英語能力需過關。",
    advice: "強調你的教學或輔導經驗，以及對原住民教育的熱情。",
    evidenceRubric: "社區參與、文化理解、長期服務與真實反思",
    gateWarning: "此科系需要 English 12，且非常看重教學經驗和社區參與。",
    
    smallFactors: {
      gradeTrend: { rising: 2, stable: 0, declining: -2 },
      activityRelevance: { high: 6, medium: 3, low: 0 },
      depthMultiplier: { founder: 1.2, executive: 1.15, member: 1.0 }
    },
    internationalAdjustment: { targetBonus: 0, capReduction: 1 }
  },

  // Legacy faculty-based data (kept for backward compatibility)
  arts: {
    averageGPA: {
      low: 75,
      medium: 82,
      high: 88,
    },
    personalProfileWeight: 0.3,
    gpaWeight: 0.7,
    courseDifficultyMultiplier: {
      regular: 1.0,
      ap: 1.1,
      ib: 1.15,
    },
  },
  science: {
    averageGPA: {
      low: 85,
      medium: 90,
      high: 95,
    },
    personalProfileWeight: 0.25,
    gpaWeight: 0.75,
    courseDifficultyMultiplier: {
      regular: 1.0,
      ap: 1.15,
      ib: 1.2,
    },
  },
  sauder: {
    averageGPA: {
      low: 88,
      medium: 92,
      high: 96,
    },
    personalProfileWeight: 0.35,
    gpaWeight: 0.65,
    courseDifficultyMultiplier: {
      regular: 1.0,
      ap: 1.12,
      ib: 1.18,
    },
  },
}

// Try to load courses from JSON file, fallback to empty array
let allCourses = {}
try {
  // This will be populated when scraped data is available
  // import coursesData from './courses.json'
  // allCourses = coursesData.faculties || {}
} catch (error) {
  console.log('Course data file not found. Run scraper to generate courses.json')
}

export const getCoursesByFaculty = (facultyKey) => {
  return allCourses[facultyKey]?.courses || []
}

export const getAllFaculties = () => {
  return Object.keys(facultyRequirements)
}

