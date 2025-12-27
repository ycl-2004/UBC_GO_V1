import React from 'react'

const RequirementParser = ({ text }) => {
  if (!text || !text.trim()) {
    return <p className="text-gray-500 italic">None</p>
  }

  // Course code pattern: 3-4 uppercase letters, optional space, 3 digits, optional letter
  const COURSE_CODE_PATTERN = /([A-Z]{3,4})\s?(\d{3}[A-Z]?)/g

  /**
   * Split text by course codes to separate individual courses in a "ONE of" group
   * Handles cases like "PHYS 108 – Title PHYS 118 – Title" by detecting course codes
   * Also handles comma-separated lists like "MATH_V 101, MATH_V 103, MATH_V 105"
   */
  const splitByCourseCodes = (text) => {
    // First, try splitting by comma if it looks like a comma-separated list
    // Pattern: course code, course code, course code (with optional spaces)
    const commaSeparatedPattern = /([A-Z]{2,4}_?V?\s+\d{3}[A-Z]?)\s*,\s*([A-Z]{2,4}_?V?\s+\d{3}[A-Z]?)/g
    if (commaSeparatedPattern.test(text)) {
      // Split by comma and clean up
      const parts = text.split(',').map(part => part.trim()).filter(part => part.length > 0)
      // If all parts look like course codes, return them
      const allAreCourseCodes = parts.every(part => COURSE_CODE_PATTERN.test(part.trim()))
      if (allAreCourseCodes && parts.length > 1) {
        return parts
      }
    }
    
    // Reset regex lastIndex
    COURSE_CODE_PATTERN.lastIndex = 0
    
    // Find all course code positions
    const matches = []
    let match
    while ((match = COURSE_CODE_PATTERN.exec(text)) !== null) {
      matches.push({
        index: match.index,
        fullMatch: match[0],
        subject: match[1],
        number: match[2]
      })
    }

    if (matches.length === 0) {
      return [text.trim()]
    }

    // If only one course code, return as-is
    if (matches.length === 1) {
      return [text.trim()]
    }

    // Split at each course code boundary
    const parts = []
    
    // Handle text before first course code
    if (matches[0].index > 0) {
      const beforeFirst = text.substring(0, matches[0].index).trim()
      if (beforeFirst) {
        parts.push(beforeFirst)
      }
    }

    // Extract each course with its description
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i]
      const nextMatch = matches[i + 1]
      
      const start = currentMatch.index
      const end = nextMatch ? nextMatch.index : text.length
      
      const courseText = text.substring(start, end).trim()
      if (courseText) {
        // Clean up: remove extra dashes, commas, and spaces
        const cleaned = courseText
          .replace(/\s*–\s*/g, ' – ') // Normalize em-dash
          .replace(/\s*-\s*/g, ' – ') // Normalize hyphen
          .replace(/,\s*$/, '') // Remove trailing comma
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim()
        if (cleaned) {
          parts.push(cleaned)
        }
      }
    }

    return parts.filter(p => p.length > 0)
  }

  /**
   * Parse a single requirement item (could be "ONE of" or regular requirement)
   */
  const parseRequirementItem = (item) => {
    const trimmed = item.trim()
    
    // Check if it's a "ONE of" requirement (case-insensitive)
    const oneOfMatch = trimmed.match(/^(ONE\s+of|One\s+of|one\s+of)\s+(.+)$/i)
    if (oneOfMatch) {
      const optionsText = oneOfMatch[2].trim()
      // Split by course codes to get individual options
      const options = splitByCourseCodes(optionsText)
      
      // If splitting didn't work well, try splitting by common separators
      if (options.length === 1 && optionsText.includes('–')) {
        // Try splitting by em-dash or hyphen
        const dashSplit = optionsText.split(/[–-]/).map(s => s.trim()).filter(s => s.length > 0)
        if (dashSplit.length > 1) {
          // Reconstruct: each part should start with a course code
          const reconstructed = []
          for (let i = 0; i < dashSplit.length; i += 2) {
            if (i + 1 < dashSplit.length) {
              reconstructed.push(`${dashSplit[i]} – ${dashSplit[i + 1]}`)
            } else {
              reconstructed.push(dashSplit[i])
            }
          }
          return {
            type: 'one-of',
            options: reconstructed.filter(opt => opt.length > 0)
          }
        }
      }
      
      return {
        type: 'one-of',
        options: options.map(opt => opt.trim()).filter(opt => opt.length > 0)
      }
    }

    // Regular requirement
    return {
      type: 'regular',
      text: trimmed
    }
  }

  /**
   * Parse the full prerequisites text
   */
  const parseRequirements = (text) => {
    const sections = []
    
    // Clean up text: remove common scraped artifacts
    // Remove patterns like "Course Descriptions\nIntroduction\nCourses by Subject..."
    let cleanedText = text
      .replace(/\nCourse Descriptions.*$/i, '')
      .replace(/\nIntroduction.*$/i, '')
      .replace(/\nCourses by Subject.*$/i, '')
      .replace(/\nCourses by Faculty.*$/i, '')
      .trim()

    // Check for section headers (Prerequisites, Corequisites, etc.)
    const sectionPattern = /(Prerequisites?|Corequisites?|Co-requisites?):\s*/gi
    const sectionMatches = []
    let match

    while ((match = sectionPattern.exec(cleanedText)) !== null) {
      sectionMatches.push({
        index: match.index,
        header: match[1],
        fullMatch: match[0]
      })
    }

    if (sectionMatches.length === 0) {
      // No explicit sections, treat entire text as prerequisites
      sections.push({
        header: 'Prerequisites',
        content: cleanedText
      })
    } else {
      // Handle text before the first section header (if any)
      const firstMatch = sectionMatches[0]
      if (firstMatch.index > 0) {
        // There's text before the first section header - treat it as Prerequisites
        const prereqText = cleanedText.substring(0, firstMatch.index).trim()
        if (prereqText) {
          sections.push({
            header: 'Prerequisites',
            content: prereqText
          })
        }
      }
      
      // Split into sections based on found headers
      for (let i = 0; i < sectionMatches.length; i++) {
        const sectionMatch = sectionMatches[i]
        const nextMatch = sectionMatches[i + 1]
        
        const start = sectionMatch.index + sectionMatch.fullMatch.length
        const end = nextMatch ? nextMatch.index : cleanedText.length
        
        const sectionContent = cleanedText.substring(start, end).trim()
        if (sectionContent) {
          sections.push({
            header: sectionMatch.header,
            content: sectionContent
          })
        }
      }
    }

    // Parse each section
    return sections.map(section => {
      // Split by "AND" or "and" (case-insensitive)
      // Special handling: "One of ... and one of ..." should be split into two separate "One of" groups
      // Pattern 1: Match "and one of" as a split point (this creates two "One of" groups)
      // Pattern 2: Match regular "and" (but not "and one of")
      const andOneOfPattern = /\s+and\s+(?=one\s+of)/gi
      const regularAndPattern = /\s+and\s+(?!one\s+of)/gi
      
      // First, split by "and one of" to separate multiple "One of" groups
      let items = section.content.split(andOneOfPattern).map(item => item.trim()).filter(item => item.length > 0)
      
      // If we split by "and one of", we need to add "one of" back to the second part
      if (items.length > 1) {
        items = items.map((item, index) => {
          if (index > 0 && !item.toLowerCase().startsWith('one of')) {
            return 'one of ' + item
          }
          return item
        })
      }
      
      // Then, for each item, split by regular "and" if needed
      const finalItems = []
      for (const item of items) {
        const subItems = item.split(regularAndPattern).map(subItem => subItem.trim()).filter(subItem => subItem.length > 0)
        finalItems.push(...subItems)
      }
      
      return {
        header: section.header,
        items: finalItems.map(parseRequirementItem)
      }
    })
  }

  const parsedSections = parseRequirements(text)

  return (
    <div className="requirement-parser">
      {parsedSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 capitalize">
            {section.header}:
          </h4>
          <ul className="requirement-list-main">
            {section.items.map((item, itemIndex) => {
              if (item.type === 'one-of') {
                return (
                  <li key={itemIndex} className="mb-2">
                    <span className="font-medium text-gray-800">One of:</span>
                    <ul className="requirement-list-sub">
                      {item.options.map((option, optIndex) => (
                        <li key={optIndex} className="text-sm text-gray-700">
                          {option}
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              } else {
                return (
                  <li key={itemIndex} className="text-gray-700">
                    {item.text}
                  </li>
                )
              }
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default RequirementParser