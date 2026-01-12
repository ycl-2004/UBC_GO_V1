#!/usr/bin/env python3
"""
Script to fix Psychology curriculum by removing duplicate entries
and consolidating category-based course lists into single "Electives" entries.
"""

import sys
import os
import json
import re

# Add project root to path
script_path = os.path.abspath(__file__)
project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_path)))
sys.path.insert(0, project_root)

def fix_psychology_curriculum():
    """Fix Psychology curriculum by consolidating duplicate entries"""
    curriculum_file = os.path.join(project_root, 'src', 'data', 'curriculum', 'arts', 'arts_curriculum.json')
    
    # Load existing curriculum
    with open(curriculum_file, 'r', encoding='utf-8') as f:
        curriculum = json.load(f)
    
    if 'Psychology' not in curriculum:
        print("Psychology not found in curriculum")
        return
    
    psychology = curriculum['Psychology']
    fixed_psychology = {}
    
    for year_key in ['1', '2', '3', '4']:
        if year_key not in psychology:
            continue
        
        courses = psychology[year_key]
        fixed_courses = []
        seen_categories = {}
        
        for course in courses:
            code = course.get('code', '')
            notes = course.get('notes', '')
            
            # Check if this is a category-based course list (e.g., "Behavioural Neuroscience: PSYC_V 301, 304...")
            if ':' in notes and len(notes.split(':')) > 1:
                category = notes.split(':')[0].strip()
                course_list = notes.split(':', 1)[1].strip()
                
                # Check if this category already exists
                if category in seen_categories:
                    # Skip duplicate - already added as Electives entry
                    continue
                
                # Check if this note contains multiple courses
                course_codes = re.findall(r'([A-Z]{2,4}(?:_V)?)\s+(\d{3}[A-Z]?)', course_list)
                if len(course_codes) > 1:
                    # This is a category with multiple courses - create single Electives entry
                    seen_categories[category] = True
                    fixed_courses.append({
                        'code': 'Electives',
                        'credits': course.get('credits', 3),
                        'title': '',
                        'notes': notes
                    })
                    continue
            
            # Regular course - check if it's a duplicate
            # Check if we already have this course code
            is_duplicate = False
            for existing in fixed_courses:
                if existing.get('code') == code:
                    # Check if notes are the same (category-based)
                    if existing.get('notes') == notes and ':' in notes:
                        is_duplicate = True
                        break
            
            if not is_duplicate:
                fixed_courses.append(course)
        
        fixed_psychology[year_key] = fixed_courses
    
    # Update curriculum
    curriculum['Psychology'] = fixed_psychology
    
    # Save updated curriculum
    with open(curriculum_file, 'w', encoding='utf-8') as f:
        json.dump(curriculum, f, indent=2, ensure_ascii=False)
    
    print("✅ Fixed Psychology curriculum")
    print(f"   Year 3: {len(fixed_psychology.get('3', []))} courses (was {len(psychology.get('3', []))})")
    print(f"   Year 4: {len(fixed_psychology.get('4', []))} courses (was {len(psychology.get('4', []))})")

if __name__ == '__main__':
    fix_psychology_curriculum()
