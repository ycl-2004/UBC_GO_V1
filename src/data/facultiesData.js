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

// Admission data for different faculties
export const facultyAdmissionData = {
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

