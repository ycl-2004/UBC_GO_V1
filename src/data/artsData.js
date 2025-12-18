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
