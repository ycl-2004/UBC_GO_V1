"""
Process detailed requirements data for frontend use
"""

import json
import os

def process_detailed_requirements():
    """Process scraped detailed requirements"""
    
    input_file = 'scraper/data/vancouver_detailed_requirements.json'
    output_file = 'src/data/detailed_requirements.json'
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found")
        print("Please run scrape_detailed_requirements.py first")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Organize for frontend
    processed = {
        'general_requirements': data.get('general_requirements', {}),
        'provinces': {}
    }
    
    for province_name, province_data in data.get('provinces', {}).items():
        province_info = {
            'name': province_name,
            'general_requirements': province_data.get('general_requirements', {}),
            'degrees': {}
        }
        
        # Organize degrees by faculty
        for degree_name, degree_data in province_data.get('degrees', {}).items():
            # Determine faculty
            faculty = determine_faculty_from_degree(degree_name)
            
            if faculty not in province_info['degrees']:
                province_info['degrees'][faculty] = {}
            
            province_info['degrees'][faculty][degree_name] = {
                'grade_12_requirements': degree_data.get('grade_12_requirements', []),
                'grade_11_requirements': degree_data.get('grade_11_requirements', []),
                'related_courses': degree_data.get('related_courses', []),
                'additional_info': degree_data.get('additional_info', '')
            }
        
        processed['provinces'][province_name] = province_info
    
    # Save processed data
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Processed requirements saved to {output_file}")
    print(f"  Provinces: {len(processed['provinces'])}")
    for province, pdata in processed['provinces'].items():
        total_degrees = sum(len(degrees) for degrees in pdata['degrees'].values())
        print(f"    - {province}: {total_degrees} degrees across {len(pdata['degrees'])} faculties")


def determine_faculty_from_degree(degree_name: str) -> str:
    """Determine faculty from degree name"""
    degree_lower = degree_name.lower()
    
    if any(k in degree_lower for k in ['arts', 'ba ', 'humanities', 'social science', 
                                        'psychology', 'economics', 'english', 'history']):
        return 'arts'
    
    if any(k in degree_lower for k in ['science', 'bsc', 'biology', 'chemistry', 
                                        'physics', 'mathematics', 'computer science']):
        return 'science'
    
    if any(k in degree_lower for k in ['commerce', 'business', 'sauder', 'management']):
        return 'sauder'
    
    if any(k in degree_lower for k in ['engineering', 'applied science']):
        return 'engineering'
    
    return 'other'


if __name__ == "__main__":
    process_detailed_requirements()

