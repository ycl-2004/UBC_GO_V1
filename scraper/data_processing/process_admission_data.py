"""
Process scraped admission requirements data and convert to frontend-friendly format
"""

import json
import os
from typing import Dict, List

def process_admission_requirements(input_file: str, output_file: str):
    """Process admission requirements for frontend use"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    processed_data = {
        'last_updated': '',
        'general_requirements': {},
        'faculties': {}
    }
    
    # Process general requirements
    if 'general' in data:
        general = data['general']
        processed_data['general_requirements'] = {
            'english_language': general.get('english_language', {}),
            'general_admission': general.get('general_admission', {})
        }
    
    # Process Vancouver degrees
    if 'vancouver_degrees' in data:
        for degree_name, degree_data in data['vancouver_degrees'].items():
            # Determine faculty from degree name
            faculty = determine_faculty(degree_name)
            
            if faculty not in processed_data['faculties']:
                processed_data['faculties'][faculty] = {
                    'name': faculty,
                    'campus': 'Vancouver',
                    'degrees': {}
                }
            
            processed_data['faculties'][faculty]['degrees'][degree_name] = {
                'name': degree_name,
                'required_courses': degree_data.get('required_courses', []),
                'recommended_courses': degree_data.get('recommended_courses', []),
                'minimum_grades': degree_data.get('minimum_grades', {}),
                'additional_requirements': degree_data.get('additional_requirements', []),
                'notes': degree_data.get('notes', '')
            }
    
    # Process Okanagan degrees
    if 'okanagan_degrees' in data:
        for degree_name, degree_data in data['okanagan_degrees'].items():
            faculty = determine_faculty(degree_name)
            
            # Check if faculty exists for Vancouver, if not create
            if faculty not in processed_data['faculties']:
                processed_data['faculties'][faculty] = {
                    'name': faculty,
                    'campuses': ['Okanagan'],
                    'degrees': {}
                }
            elif 'Okanagan' not in processed_data['faculties'][faculty].get('campuses', ['Vancouver']):
                if 'campuses' not in processed_data['faculties'][faculty]:
                    processed_data['faculties'][faculty]['campuses'] = ['Vancouver']
                processed_data['faculties'][faculty]['campuses'].append('Okanagan')
            
            # Add Okanagan prefix to degree name if needed
            okanagan_degree_name = f"{degree_name} (Okanagan)" if 'Okanagan' not in degree_name else degree_name
            
            processed_data['faculties'][faculty]['degrees'][okanagan_degree_name] = {
                'name': degree_name,
                'campus': 'Okanagan',
                'required_courses': degree_data.get('required_courses', []),
                'recommended_courses': degree_data.get('recommended_courses', []),
                'minimum_grades': degree_data.get('minimum_grades', {}),
                'additional_requirements': degree_data.get('additional_requirements', []),
                'notes': degree_data.get('notes', '')
            }
    
    # Save processed data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nProcessed admission requirements data")
    print(f"Faculties: {len(processed_data['faculties'])}")
    for faculty, faculty_data in processed_data['faculties'].items():
        print(f"  - {faculty}: {len(faculty_data['degrees'])} degrees")


def determine_faculty(degree_name: str) -> str:
    """Determine faculty based on degree name"""
    degree_lower = degree_name.lower()
    
    # Arts
    if any(keyword in degree_lower for keyword in ['arts', 'ba ', 'humanities', 'social science']):
        return 'Faculty of Arts'
    
    # Science
    if any(keyword in degree_lower for keyword in ['science', 'bsc', 'biology', 'chemistry', 'physics', 'mathematics']):
        return 'Faculty of Science'
    
    # Sauder (Commerce/Business)
    if any(keyword in degree_lower for keyword in ['commerce', 'business', 'sauder', 'management']):
        return 'Sauder School of Business'
    
    # Engineering
    if any(keyword in degree_lower for keyword in ['engineering', 'applied science']):
        return 'Faculty of Applied Science'
    
    # Kinesiology
    if 'kinesiology' in degree_lower:
        return 'Faculty of Education (Kinesiology)'
    
    # Education
    if any(keyword in degree_lower for keyword in ['education', 'teacher', 'teaching']):
        return 'Faculty of Education'
    
    # Land and Food Systems
    if any(keyword in degree_lower for keyword in ['food', 'nutrition', 'resource economics']):
        return 'Faculty of Land and Food Systems'
    
    # Forestry
    if any(keyword in degree_lower for keyword in ['forestry', 'natural resources']):
        return 'Faculty of Forestry'
    
    # Default
    return 'Other'


def update_calculator_data(admission_requirements_file: str, output_file: str):
    """Update calculator admission data based on scraped requirements"""
    
    with open(admission_requirements_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Extract minimum grade requirements for calculator
    calculator_data = {
        'faculties': {}
    }
    
    for faculty, faculty_data in data.get('faculties', {}).items():
        # Simplified faculty key for calculator
        faculty_key = faculty.lower().replace('faculty of ', '').replace('school of ', '').split()[0]
        
        calculator_data['faculties'][faculty_key] = {
            'name': faculty,
            'minimum_gpa': extract_minimum_gpa(faculty_data),
            'competitive_gpa': extract_competitive_gpa(faculty_data),
            'degrees': list(faculty_data.get('degrees', {}).keys())
        }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(calculator_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nUpdated calculator data: {output_file}")


def extract_minimum_gpa(faculty_data: Dict) -> int:
    """Extract minimum GPA from faculty data"""
    # Default minimum GPAs (can be updated based on scraped data)
    # These are rough estimates based on UBC's general requirements
    default_mins = {
        'arts': 70,
        'science': 70,
        'sauder': 70,
        'engineering': 70
    }
    
    # Try to extract from degree requirements
    for degree_data in faculty_data.get('degrees', {}).values():
        notes = degree_data.get('notes', '').lower()
        # Look for patterns like "minimum 70%" or "at least 75%"
        import re
        matches = re.findall(r'(?:minimum|at least)\s+(\d+)%', notes)
        if matches:
            return int(matches[0])
    
    return 70  # Default


def extract_competitive_gpa(faculty_data: Dict) -> int:
    """Extract competitive GPA from faculty data"""
    # Default competitive GPAs (estimates)
    min_gpa = extract_minimum_gpa(faculty_data)
    return min_gpa + 15  # Typically 15% above minimum


if __name__ == "__main__":
    # Create data directory if it doesn't exist
    os.makedirs('scraper/data', exist_ok=True)
    
    # Process admission requirements if file exists
    if os.path.exists('scraper/data/all_admission_requirements.json'):
        process_admission_requirements(
            'scraper/data/all_admission_requirements.json',
            'src/data/admission_requirements.json'
        )
        
        # Update calculator data
        update_calculator_data(
            'src/data/admission_requirements.json',
            'src/data/calculator_admission_data.json'
        )
    else:
        print("No admission requirements data found. Please run scrape_admission_requirements.py first.")

