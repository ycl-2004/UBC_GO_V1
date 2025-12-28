// Import scraped data
import scrapedPrereqs from './engineering_prereqs.json'

// Standard First Year Engineering Curriculum
export const standardFirstYearCourses = [
  { code: 'APSC 100', credits: 3, title: 'Intro to Engineering I', inTimetable: true },
  { code: 'APSC 101', credits: 3, title: 'Intro to Engineering II', inTimetable: true },
  { code: 'APSC 160', credits: 3, title: 'Intro to Computation', inTimetable: true },
  { code: 'CHEM 154', credits: 3, title: 'Chemistry for Engineering', inTimetable: true },
  { code: 'MATH 100', credits: 3, title: 'Differential Calculus', inTimetable: true },
  { code: 'MATH 101', credits: 3, title: 'Integral Calculus', inTimetable: true },
  { code: 'MATH 152', credits: 3, title: 'Linear Systems', inTimetable: true },
  { code: 'PHYS 157', credits: 3, title: 'Intro Physics I', inTimetable: true },
  { code: 'PHYS 158', credits: 3, title: 'Intro Physics II', inTimetable: true },
  { code: 'PHYS 159', credits: 1, title: 'Physics Lab', inTimetable: true },
  { code: 'PHYS 170', credits: 3, title: 'Mechanics 1', inTimetable: true },
  { code: 'WRDS 150', credits: 3, title: 'Strategies for University Writing', inTimetable: false },
  { code: 'Elective', credits: 3, title: 'Humanities/Social Science', inTimetable: false },
];

// Transform scraped data format to expected format
const transformScrapedData = (scrapedData) => {
  const transformed = {}
  
  for (const [majorCode, prereqs] of Object.entries(scrapedData)) {
    if (!prereqs || prereqs.length === 0) {
      transformed[majorCode] = {
        majorCode,
        majorName: getMajorName(majorCode),
        prerequisites: []
      }
      continue
    }
    
    // Transform each scraped entry to the expected format
    const prerequisites = prereqs.map(prereq => {
      // Parse affected courses - split by course code pattern (4 letters + space + numbers)
      let affectedCourses = []
      if (prereq.affected && prereq.affected.trim()) {
        const affectedText = prereq.affected.trim()
        
        // Split by course code pattern: 4 uppercase letters + space + digits
        // Example: "CIVL 210 (Term 2, CIVL 230 is pre-req) CIVL 231 (Term 2, CIVL 230 is pre-req)"
        // We want to split only when a course code represents a new entry:
        // - At the beginning of the string, OR
        // - Immediately after a closing parenthesis ) from the previous entry
        // This prevents splitting course codes mentioned inside descriptions
        
        // Use a regex that looks for Course Codes at the start, or following a closing paren.
        // Matches: 4 letters, space, digits, optional suffix (like 'EOSC 223*')
        // Lookbehind: Must be at start of string (^) OR preceded by a closing paren and optional space
        const courseCodeRegex = /(?:^|(?<=\)\s*))([A-Z]{4}\s+\d+[A-Z*]*)/g
        const positions = []
        let match
        while ((match = courseCodeRegex.exec(affectedText)) !== null) {
          positions.push(match.index)
        }
        
        if (positions.length > 0) {
          // Split the string at each course code position
          const parts = []
          for (let i = 0; i < positions.length; i++) {
            const start = positions[i]
            const end = i < positions.length - 1 ? positions[i + 1] : affectedText.length
            const part = affectedText.substring(start, end).trim()
            if (part) {
              parts.push(part)
            }
          }
          affectedCourses = parts
        } else {
          // No course codes found, use the whole string
          affectedCourses = [affectedText]
        }
      }
      
      return {
        firstYearCourse: prereq.course || '',
        directPrereqFor: prereq.direct || '',
        affectedCourses: affectedCourses
      }
    })
    
    transformed[majorCode] = {
      majorCode,
      majorName: getMajorName(majorCode),
      prerequisites
    }
  }
  
  return transformed
}

// Helper function to get major name
const getMajorName = (code) => {
  const names = {
    'BMEG': 'Biomedical Engineering',
    'CHBE': 'Chemical and Biological Engineering',
    'CIVL': 'Civil Engineering',
    'CPEN': 'Computer Engineering',
    'ELEC': 'Electrical Engineering',
    'ENPH': 'Engineering Physics',
    'ENVL': 'Environmental Engineering',
    'GEOE': 'Geological Engineering',
    'IGEN': 'Integrated Engineering',
    'MANU': 'Manufacturing Engineering',
    'MECH': 'Mechanical Engineering',
    'MINE': 'Mining Engineering',
    'MTRL': 'Materials Engineering',
  }
  return names[code] || code
}

// Major Prerequisites Data Structure
// Load from scraped data and merge with hardcoded data
const scrapedData = transformScrapedData(scrapedPrereqs)

// Base structure with all majors
const baseMajorPrerequisites = {
  BMEG: {
    majorCode: 'BMEG',
    majorName: 'Biomedical Engineering',
    prerequisites: [],
  },
  CHBE: {
    majorCode: 'CHBE',
    majorName: 'Chemical and Biological Engineering',
    prerequisites: [],
  },
  CIVL: {
    majorCode: 'CIVL',
    majorName: 'Civil Engineering',
    prerequisites: [],
  },
  CPEN: {
    majorCode: 'CPEN',
    majorName: 'Computer Engineering',
    prerequisites: [],
  },
  ELEC: {
    majorCode: 'ELEC',
    majorName: 'Electrical Engineering',
    prerequisites: [],
  },
  ENPH: {
    majorCode: 'ENPH',
    majorName: 'Engineering Physics',
    prerequisites: [],
  },
  ENVL: {
    majorCode: 'ENVL',
    majorName: 'Environmental Engineering',
    prerequisites: [],
  },
  GEOE: {
    majorCode: 'GEOE',
    majorName: 'Geological Engineering',
    prerequisites: [],
  },
  IGEN: {
    majorCode: 'IGEN',
    majorName: 'Integrated Engineering',
    prerequisites: [],
  },
  MANU: {
    majorCode: 'MANU',
    majorName: 'Manufacturing Engineering',
    prerequisites: [],
  },
  MECH: {
    majorCode: 'MECH',
    majorName: 'Mechanical Engineering',
    prerequisites: [],
  },
  MINE: {
    majorCode: 'MINE',
    majorName: 'Mining Engineering',
    prerequisites: [],
  },
  MTRL: {
    majorCode: 'MTRL',
    majorName: 'Materials Engineering',
    prerequisites: [],
  },
};

// Merge scraped data with base structure (scraped data takes precedence)
export const majorPrerequisites = {
  ...baseMajorPrerequisites,
  ...scrapedData
};

// Get all available majors
export const getAllMajors = () => {
  return Object.values(majorPrerequisites);
};

// Get major by code
export const getMajorByCode = (code) => {
  return majorPrerequisites[code];
};

