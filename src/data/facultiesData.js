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
}

/**
 * UBC Undergraduate Admission Data (Updated Dec 2025)
 * Based on historical trends and faculty-specific requirements.
 * This is the primary data source for major-specific admission calculations.
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
    
    // New model parameters
    competitivenessLevel: 5, // C(1-5), 5 = most competitive
    academicThreshold: { min: 80, ideal: 90 }, // 高 80 → 90+ 越穩
    requiredCourses: {
      gate: ["Math12", "Physics12", "Chemistry12"], // 硬性課程 Gate
      penalty: -40 // 缺一降很多 (-20 to -60)
    },
    weights: {
      academic: 0.65,
      profile: 0.35,
      supplement: 0.0
    },
    targetScore: 85, // Target for sigmoid calculation
    scale: 8, // Scale for sigmoid (smaller = steeper curve)
    
    core: "理科實力",
    focus: "強制看重 Math 12, Physics 12, Chemistry 12。",
    advice: "建議參加機器人社團 (Robotics) 或科學競賽來證明實踐能力。",
    evidenceRubric: "STEM 專題、機器人/程式/工程競賽、實作作品、研究/實習"
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
    requiredCourses: {
      gate: ["Math12", "Science12_2"], // 至少兩門 12 年級理科
      penalty: -30
    },
    weights: {
      academic: 0.70,
      profile: 0.30,
      supplement: 0.0
    },
    targetScore: 82,
    scale: 9,
    
    core: "學術廣度",
    focus: "至少修讀兩門 12 年級理科 (Bio/Chem/Phys)。",
    advice: "高分的數學與科學學分是核心，建議參加數學競賽 (AMC/COMC)。",
    evidenceRubric: "競賽、科展、研究、長期學術社團（不是只參加一次）"
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
    requiredCourses: {
      gate: ["English12", "Math12"], // Math12 偏好高
      penalty: -25
    },
    weights: {
      academic: 0.55,
      profile: 0.45,
      supplement: 0.0
    },
    targetScore: 88,
    scale: 7,
    
    core: "領導力與潛力",
    focus: "PP (個人簡介) 分數決定一切，重視領導經驗與商業意識。",
    advice: "強調 DECA 競賽、創業經驗或具備量化成果的領袖經歷。",
    evidenceRubric: "領導力/創業/社團成果、DECA、實際影響（量化：人數、金額、成果）"
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
    requiredCourses: {
      gate: [], // 依母學位
      penalty: -20
    },
    weights: {
      academic: 0.50,
      profile: 0.50,
      supplement: 0.0
    },
    targetScore: 90,
    scale: 6,
    
    core: "商業管理潛力",
    focus: "雙學位課程，PP 需體現極強的管理願望。",
    advice: "在 PP 中展示你如何平衡學術壓力與團隊管理能力。",
    evidenceRubric: "管理潛力：帶團隊、擴張成果、決策與協作案例"
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
    requiredCourses: {
      gate: ["English12"], // English12 很重要
      penalty: -30
    },
    weights: {
      academic: 0.60,
      profile: 0.40,
      supplement: 0.0
    },
    targetScore: 75,
    scale: 12,
    
    core: "人文素養",
    focus: "重視 English 12 成績及社會服務背景。",
    advice: "展現你的社區參與感，如校刊編輯、辯論隊或長期志工。",
    evidenceRubric: "校刊/辯論/志工、長期社會參與、寫作/思辨作品"
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
    academicThreshold: { min: 90, ideal: 95 }, // 90+ 更穩
    requiredCourses: {
      gate: ["Math12", "English12"], // Math12 很關鍵
      penalty: -50
    },
    weights: {
      academic: 0.70,
      profile: 0.30,
      supplement: 0.0
    },
    targetScore: 88,
    scale: 7,
    
    core: "數據分析能力",
    focus: "文學院最高門檻專業，極度看重 Math 12 分數。",
    advice: "雖然屬於文學院，但錄取標準接近理學院，數學必須極其優秀。",
    evidenceRubric: "數學/經濟相關競賽、分析作品（報告/研究/資料分析）"
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
    requiredCourses: {
      gate: ["English12"], // + 相關選修
      penalty: -25
    },
    weights: {
      academic: 0.55,
      profile: 0.45,
      supplement: 0.0
    },
    targetScore: 80,
    scale: 10,
    
    core: "創意表現",
    focus: "比一般 Arts 競爭更激烈，看重多媒體相關經歷。",
    advice: "建議在 PP 中提及媒體專案或相關志工經驗。",
    evidenceRubric: "作品集（文章/影片/專案）、媒體志工、策展/內容產出"
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
    academicThreshold: { min: 90, ideal: 95 }, // 90+ 更穩
    requiredCourses: {
      gate: ["Math12", "Chemistry12", "Biology12"], // 缺一大降
      penalty: -60
    },
    weights: {
      academic: 0.70,
      profile: 0.30,
      supplement: 0.10 // 若有面試表現單獨加分
    },
    targetScore: 92,
    scale: 5,
    
    core: "藥理科研潛力",
    focus: "UBC 最競爭專業之一，數理化缺一不可。",
    advice: "GPA 必須處於頂尖水平，且理科成績需無懈可擊。",
    evidenceRubric: "研究/醫療志工、科學成果、（若有）面試表現單獨加分"
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
    requiredCourses: {
      gate: ["Biology12", "Chemistry12", "English12"], // Bio/Chem 有更好
      penalty: -25
    },
    weights: {
      academic: 0.65,
      profile: 0.35,
      supplement: 0.0
    },
    targetScore: 82,
    scale: 9,
    
    core: "科學與運動背景",
    focus: "看重生物成績與對運動科學的熱情。",
    advice: "建議具備校隊運動經歷、教練經驗或醫護相關志工背景。",
    evidenceRubric: "校隊/運動成就、教練/帶隊、醫護/復健相關志工（真實時數+反思）"
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
    requiredCourses: {
      gate: ["Biology12", "Chemistry12", "English12"],
      penalty: -30
    },
    weights: {
      academic: 0.60,
      profile: 0.25,
      supplement: 0.15
    },
    targetScore: 83,
    scale: 8,
    
    core: "臨床責任感",
    focus: "需要展現極強的職業責任感與細緻度。",
    advice: "建議具備診所觀察實習經歷，並在 PP 中強調溝通能力。",
    evidenceRubric: "診所/臨床影子、責任感證據、服務品質（不是只拼時數）"
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
    academicThreshold: { min: 85, ideal: 90 },
    requiredCourses: {
      gate: [], // 可能有特定課程/申請材料
      penalty: -20
    },
    weights: {
      academic: 0.35,
      profile: 0.25,
      supplement: 0.40 // Creative test / video / 實作專案
    },
    targetScore: 80,
    scale: 9,
    
    core: "設計作品集 (Portfolio)",
    focus: "必須提交創意作品集，這比分數更重要。",
    advice: "GPA 達到門檻後，錄取與否幾乎完全取決於 Portfolio 的品質。",
    evidenceRubric: "Creative test / video / 實作專案（不要假設一定是 portfolio）"
  },

  "Fine Arts": {
    gpaWeight: 0.25,
    personalProfileWeight: 0.25,
    supplementWeight: 0.50,
    averageGPA: { high: 85, medium: 80 },
    courseDifficultyMultiplier: { regular: 1.0, ap: 1.03, ib: 1.05 },
    competitiveness: "medium",
    acceptanceRateRange: { low: 30, high: 45 },
    
    competitivenessLevel: 4,
    academicThreshold: { min: 75, ideal: 80 }, // 達門檻即可
    requiredCourses: {
      gate: ["English12"],
      penalty: -20
    },
    weights: {
      academic: 0.25,
      profile: 0.25,
      supplement: 0.50 // Portfolio/Audition
    },
    targetScore: 75,
    scale: 11,
    
    core: "藝術表現力",
    focus: "作品集 (Portfolio) 是核心評核標準。",
    advice: "分數過門檻後，重點在於個人作品的獨特性與藝術張力。",
    evidenceRubric: "Portfolio/Audition（作品深度、成熟度、敘事能力）"
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
    academicThreshold: { min: 75, ideal: 80 }, // 達門檻即可
    requiredCourses: {
      gate: [], // 可能有音樂課程/理論要求
      penalty: -15
    },
    weights: {
      academic: 0.20,
      profile: 0.20,
      supplement: 0.60 // Audition/試奏
    },
    targetScore: 72,
    scale: 12,
    
    core: "試奏/試唱 (Audition)",
    focus: "面試與 Audition 是主要評核標準。",
    advice: "分數僅為門檻，你的專業演奏/演唱水平決定一切。",
    evidenceRubric: "Audition/試奏（技術+音樂性）+ 面試表達"
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
    academicThreshold: { min: 80, ideal: 85 },
    requiredCourses: {
      gate: ["Biology12", "Chemistry12", "Math12"],
      penalty: -25
    },
    weights: {
      academic: 0.65,
      profile: 0.35,
      supplement: 0.0
    },
    targetScore: 75,
    scale: 11,
    
    core: "生物應用熱情",
    focus: "適合對可持續發展有興趣者，看重生物學分。",
    advice: "在 PP 中強調你對解決環境或食物問題的實踐與想法。",
    evidenceRubric: "社區服務、可持續發展專案、農食/健康領域實作"
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
    academicThreshold: { min: 80, ideal: 85 },
    requiredCourses: {
      gate: ["Biology12", "Chemistry12", "Math12"],
      penalty: -25
    },
    weights: {
      academic: 0.65,
      profile: 0.35,
      supplement: 0.0
    },
    targetScore: 77,
    scale: 10,
    
    core: "健康與營養意識",
    focus: "看重化學與生物成績。",
    advice: "建議具備社區服務背景或健康食品相關研究興趣。",
    evidenceRubric: "社區服務、可持續發展專案、農食/健康領域實作"
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
    academicThreshold: { min: 80, ideal: 85 },
    requiredCourses: {
      gate: ["Math12", "Biology12", "Chemistry12"], // FRE 更看重 Math
      penalty: -30
    },
    weights: {
      academic: 0.65,
      profile: 0.35,
      supplement: 0.0
    },
    targetScore: 77,
    scale: 10,
    
    core: "經濟與農業分析",
    focus: "結合商科與農業經濟，數學分數極其重要。",
    advice: "適合對農業資源配置感興趣的同學，數學需強。",
    evidenceRubric: "社區服務、可持續發展專案、農食/健康領域實作"
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
    academicThreshold: { min: 80, ideal: 85 },
    requiredCourses: {
      gate: ["Biology12", "Geography12", "Math12"], // 任一強就好
      penalty: -20
    },
    weights: {
      academic: 0.60,
      profile: 0.40,
      supplement: 0.0
    },
    targetScore: 72,
    scale: 12,
    
    core: "環保實踐",
    focus: "看重地理或生物學分。",
    advice: "建議有戶外實踐、露營經歷或環保組織工作背景。",
    evidenceRubric: "戶外實踐、環保志工、專案（監測/復育/社群活動）"
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
    academicThreshold: { min: 80, ideal: 85 },
    requiredCourses: {
      gate: ["Biology12", "Geography12", "Math12"],
      penalty: -20
    },
    weights: {
      academic: 0.60,
      profile: 0.40,
      supplement: 0.0
    },
    targetScore: 72,
    scale: 12,
    
    core: "城市生態基礎",
    focus: "看重數理基礎與對城市綠化的理解。",
    advice: "建議展示對城市可持續規劃的關注或參與相關志工。",
    evidenceRubric: "戶外實踐、環保志工、專案（監測/復育/社群活動）"
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
    academicThreshold: { min: 80, ideal: 85 },
    requiredCourses: {
      gate: ["English12"],
      penalty: -25
    },
    weights: {
      academic: 0.45,
      profile: 0.55,
      supplement: 0.0
    },
    targetScore: 70,
    scale: 13,
    
    core: "文化理解與實踐",
    focus: "看重對原住民文化的了解與社會實踐。",
    advice: "PP 中需體現對土地權利、文化傳承的深度思考。",
    evidenceRubric: "社區參與、文化理解、長期服務與真實反思"
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
    academicThreshold: { min: 80, ideal: 85 },
    requiredCourses: {
      gate: ["English12"],
      penalty: -25
    },
    weights: {
      academic: 0.45,
      profile: 0.55,
      supplement: 0.0
    },
    targetScore: 70,
    scale: 13,
    
    core: "教育使命感",
    focus: "看重社區服務背景，英語能力需過關。",
    advice: "強調你的教學或輔導經驗，以及對原住民教育的熱情。",
    evidenceRubric: "社區參與、文化理解、長期服務與真實反思"
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

