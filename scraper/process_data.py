"""
Process scraped course data and convert to frontend-friendly format
"""

import json
import os
from collections import defaultdict

def process_courses_for_frontend(input_file: str, output_file: str):
    """Process scraped courses and organize by faculty"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        courses = json.load(f)
    
    # Organize courses by faculty
    faculty_courses = defaultdict(list)
    
    for course in courses:
        faculty = course.get('faculty', 'Unknown')
        faculty_courses[faculty].append({
            'code': course['code'],
            'name': course['name'],
            'credits': course['credits'],
            'prerequisites': course.get('prerequisites', []),
            'corequisites': course.get('corequisites', []),
            'description': course.get('description', ''),
            'category': course.get('category', 'elective')
        })
    
    # Create structured output
    output = {
        'faculties': {}
    }
    
    for faculty, faculty_course_list in faculty_courses.items():
        # Determine faculty type
        if 'Arts' in faculty:
            faculty_key = 'arts'
            faculty_name = 'Faculty of Arts'
        elif 'Science' in faculty:
            faculty_key = 'science'
            faculty_name = 'Faculty of Science'
        elif 'Sauder' in faculty:
            faculty_key = 'sauder'
            faculty_name = 'Sauder School of Business'
        else:
            continue
        
        output['faculties'][faculty_key] = {
            'name': faculty_name,
            'courses': faculty_course_list
        }
    
    # Save processed data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"Processed {len(courses)} courses")
    print(f"Organized into {len(output['faculties'])} faculties")
    for faculty_key, faculty_data in output['faculties'].items():
        print(f"  - {faculty_data['name']}: {len(faculty_data['courses'])} courses")


if __name__ == "__main__":
    # Create data directory if it doesn't exist
    os.makedirs('scraper/data', exist_ok=True)
    
    # Process all courses if file exists
    if os.path.exists('scraper/data/all_courses.json'):
        process_courses_for_frontend('scraper/data/all_courses.json', 'src/data/courses.json')
    else:
        print("No scraped data found. Please run scrape_ubc_courses.py first.")

