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

// Major Prerequisites Data Structure
export const majorPrerequisites = {
  CIVL: {
    majorCode: 'CIVL',
    majorName: 'Civil Engineering',
    prerequisites: [
      {
        firstYearCourse: 'APSC 100/101/160, CHEM 154',
        directPrereqFor: 'CIVL 204',
        affectedCourses: [],
      },
      {
        firstYearCourse: 'MATH 100/101',
        directPrereqFor: 'CIVL 230, MATH 253, STAT 251',
        affectedCourses: ['CIVL 210', 'CIVL 231 (require CIVL 230)'],
      },
      {
        firstYearCourse: 'MATH 152',
        directPrereqFor: 'CIVL 231, MATH 256',
        affectedCourses: [],
      },
      {
        firstYearCourse: 'PHYS 157/158/159/170',
        directPrereqFor: 'CIVL 230, CIVL 215',
        affectedCourses: ['EOSC 210 (requires CIVL 215)'],
      },
      {
        firstYearCourse: 'WRDS 150',
        directPrereqFor: 'CIVL 201',
        affectedCourses: ['CIVL 203 (Coreq)', 'CIVL 231'],
      },
    ],
  },
  // Placeholder structure for other majors - can be filled in later
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

// Get all available majors
export const getAllMajors = () => {
  return Object.values(majorPrerequisites);
};

// Get major by code
export const getMajorByCode = (code) => {
  return majorPrerequisites[code];
};

