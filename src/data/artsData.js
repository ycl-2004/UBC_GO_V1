// Faculty of Arts - Course and Requirement Data
// This is initial mock data structure for Faculty of Arts

export const artsRequirements = {
  faculty: "Faculty of Arts",
  totalCredits: 120,
  requirements: {
    // Major requirements (varies by major)
    major: {
      credits: 42, // Minimum credits in major
      description: "Complete major-specific requirements",
    },
    // Breadth requirements
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
    // Communication requirement
    communication: {
      credits: 6,
      description: "Communication courses (WRDS 150 or equivalent)",
    },
    // Electives
    electives: {
      credits: 60,
      description: "Elective courses to reach 120 total credits",
    },
  },
};

// Sample courses for Faculty of Arts
export const artsCourses = [
  {
    code: "WRDS 150",
    name: "Research and Writing in the Disciplines",
    credits: 3,
    prerequisites: [],
    corequisites: [],
    description: "Introduction to academic writing and research methods",
    category: "communication",
  },
  {
    code: "ENGL 100",
    name: "Introduction to Literary Studies",
    credits: 3,
    prerequisites: [],
    corequisites: [],
    description: "Introduction to the study of literature",
    category: "literature",
  },
  {
    code: "PSYC 100",
    name: "Introduction to Psychology",
    credits: 3,
    prerequisites: [],
    corequisites: [],
    description: "Introduction to the scientific study of behavior",
    category: "science",
  },
  {
    code: "ECON 101",
    name: "Principles of Microeconomics",
    credits: 3,
    prerequisites: [],
    corequisites: [],
    description: "Introduction to microeconomic principles",
    category: "elective",
  },
  {
    code: "PHIL 100",
    name: "Introduction to Philosophy",
    credits: 3,
    prerequisites: [],
    corequisites: [],
    description: "Introduction to philosophical thinking",
    category: "elective",
  },
  {
    code: "HIST 102",
    name: "World History Since 1500",
    credits: 3,
    prerequisites: [],
    corequisites: [],
    description: "Survey of world history from 1500 to present",
    category: "elective",
  },
];

// Admission data for Faculty of Arts
export const artsAdmissionData = {
  averageGPA: {
    low: 75,
    medium: 82,
    high: 88,
  },
  personalProfileWeight: 0.3, // 30% weight on personal profile
  gpaWeight: 0.7, // 70% weight on GPA
  courseDifficultyMultiplier: {
    regular: 1.0,
    ap: 1.1,
    ib: 1.15,
  },
};

// BA Majors organized by category
export const baMajorsByCategory = {
  'Social Sciences': [
    'Anthropology',
    'Archaeology',
    'Economics',
    'Geography',
    'Human Geography',
    'International Relations',
    'Law and Society',
    'Linguistics',
    'Political Science',
    'Psychology',
    'Sociology',
    'Urban Studies',
  ],
  'Humanities': [
    'African Studies',
    'Ancient Mediterranean and Near Eastern Studies',
    'Art History',
    'Canadian Studies',
    'Classical Studies',
    'History',
    'Indigenous Land-Based Studies',
    'Jewish Studies',
    'Medieval Studies',
    'Middle East Studies',
    'Modern European Studies',
    'Museum Studies',
    'Philosophy',
    'Program in the Study of Religion',
    'United States Studies',
  ],
  'Languages & Literatures': [
    'Arabic',
    'Chinese',
    'Danish',
    'English',
    'French Language Literatures and Cultures',
    'German Studies',
    'Germanic Studies',
    'Greek',
    'Hebrew',
    'Hindi',
    'Indonesian',
    'Italian and Italian Studies',
    'Japanese',
    'Korean',
    'Latin',
    'Nordic Studies',
    'Portuguese',
    'Punjabi',
    'Romance Studies',
    'Sanskrit',
    'Spanish',
    'Swedish',
    'Urdu',
  ],
  'Creative & Performing Arts': [
    'Art History Visual Art and Theory',
    'Arts Studies',
    'Cinema Studies',
    'Creative Writing',
    'Film Production',
    'Music',
    'Theatre',
    'Visual Art',
    'Writing and Communication',
  ],
  'Interdisciplinary': [
    'Asian Canadian and Asian Migration Studies',
    'Asian Studies',
    'Cognitive Systems',
    'Computer Science',
    'Critical Studies in Sexuality',
    'Environment and Society',
    'Environment and Sustainability',
    'Family Studies',
    'First Nations and Endangered Languages',
    'First Nations and Indigenous Studies',
    'Gender Race Sexuality and Social Justice',
    'Geographic Information Science and Geographical Computation',
    'Health and Society',
    'Informatics',
    'Interdisciplinary Studies',
    'Latin American Studies',
    'Mathematics',
    'Science Studies',
    'Slavic and Eastern European Studies',
    'South Asian Studies',
    'Speech Sciences',
  ],
};

// Flat array of all BA majors (alphabetically sorted for search/display)
export const baMajors = Object.values(baMajorsByCategory)
  .flat()
  .sort();

export const baCategoryNames = Object.keys(baMajorsByCategory);

// Language Programs (usually part of Asian Studies or AMNE)
export const languagePrograms = [
  'Arabic',
  'Chinese',
  'Danish',
  'Greek',
  'Hebrew',
  'Hindi',
  'Indonesian',
  'Italian and Italian Studies',
  'Japanese',
  'Korean',
  'Latin',
  'Portuguese',
  'Punjabi',
  'Sanskrit',
  'Swedish',
  'Urdu',
];

// Interdisciplinary & Studies Programs (usually Minors or Second Degrees)
export const interdisciplinaryPrograms = [
  'African Studies',
  'Arts Studies',
  'Asian Canadian and Asian Migration Studies',
  'Health and Society',
  'Law and Society',
  'Middle East Studies',
  'Museum Studies',
  'Science Studies',
  'United States Studies',
  'Writing and Communication',
];

// Special cases that need different handling
export const specialCaseMajors = {
  'Archaeology': 'Requirements are listed as credit-based selections rather than year-by-year curriculum.',
  'Informatics': 'A newer program that may have a different page structure.',
  'Interdisciplinary Studies': 'Entirely customized by the student; there is no fixed year-by-year curriculum.',
  'Slavic and Eastern European Studies': 'Requirements are listed by category (Literature, History, Language) rather than by year.',
};

// Check if a major is a language program
export const isLanguageProgram = (majorName) => {
  return languagePrograms.includes(majorName);
};

// Check if a major is an interdisciplinary program
export const isInterdisciplinaryProgram = (majorName) => {
  return interdisciplinaryPrograms.includes(majorName);
};

// Get special case message
export const getSpecialCaseMessage = (majorName) => {
  return specialCaseMajors[majorName] || null;
};

// BFA Majors
export const bfaMajors = [
  'Acting',
  'Creative Writing (BFA)',
  'Film Production',
  'Theatre Design and Production',
  'Visual Art (BFA)',
].sort();

/**
 * Get all Arts majors for a specific category (BA or BFA)
 * @param {string} category - 'BA' or 'BFA'
 * @returns {Array<string>} - Array of major names
 */
export const getAllArtsMajors = (category) => {
  if (category === 'BA') {
    return baMajors;
  } else if (category === 'BFA') {
    return bfaMajors;
  }
  return [];
};

/**
 * Get BA majors organized by category
 * @returns {Object} - Object with category keys containing arrays of major names
 */
export const getBAMajorsByCategory = () => {
  return baMajorsByCategory;
};

/**
 * Get specific Arts major data (placeholder for future curriculum data)
 * @param {string} category - 'BA' or 'BFA'
 * @param {string} majorName - The name of the major
 * @returns {Object|null} - Major data or null if not found
 */
export const getArtsMajor = (category, majorName) => {
  // Placeholder for future implementation
  // This will be populated when curriculum data is available
  return null;
};
