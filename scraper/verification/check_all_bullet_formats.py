#!/usr/bin/env python3
"""
Check all provinces and majors for correct bullet point formatting
Rule: If website shows on same line with "or", keep as single array element
      If website shows as separate bullets, keep as separate array elements
"""

import json
import re

def load_original_data():
    """Load original scraped data to check format"""
    with open('data/vancouver_detailed_requirements.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def analyze_requirement(req_text):
    """Analyze if requirement contains multiple courses that should stay together"""
    # Pattern: "A Grade 12 X, a Grade 12 Y, or a Grade 12 Z"
    # This indicates they're in ONE bullet point with "or"
    patterns = [
        r'Grade 12 \w+,.*Grade 12 \w+,.*or.*Grade 12 \w+',  # X, Y, or Z
        r'Grade 12 \w+,.*or.*Grade 12 \w+',  # X or Y
        r'Grade 11 \w+,.*Grade 11 \w+,.*or.*Grade 11 \w+',  # Grade 11 version
        r'Grade 11 \w+,.*or.*Grade 11 \w+',
    ]
    
    for pattern in patterns:
        if re.search(pattern, req_text):
            return True, req_text
    
    return False, None

def check_all_formats():
    """Check all provinces and degrees for correct formatting"""
    
    original = load_original_data()
    issues = []
    
    print("="*80)
    print("CHECKING ALL PROVINCES AND MAJORS FOR BULLET POINT FORMAT")
    print("="*80)
    
    # Check each province
    for province_name, province_data in original.get('provinces', {}).items():
        province_issues = []
        
        for degree_name, degree_data in province_data.get('degrees', {}).items():
            if not isinstance(degree_data, dict):
                continue
            
            # Check Grade 12 requirements
            g12_reqs = degree_data.get('grade_12_requirements', [])
            for req in g12_reqs:
                is_compound, original_format = analyze_requirement(req)
                if is_compound:
                    province_issues.append({
                        'province': province_name,
                        'degree': degree_name,
                        'type': 'Grade 12',
                        'original': original_format,
                        'note': 'Should be kept as single line with "or"'
                    })
            
            # Check Grade 11 requirements
            g11_reqs = degree_data.get('grade_11_requirements', [])
            for req in g11_reqs:
                is_compound, original_format = analyze_requirement(req)
                if is_compound:
                    province_issues.append({
                        'province': province_name,
                        'degree': degree_name,
                        'type': 'Grade 11',
                        'original': original_format,
                        'note': 'Should be kept as single line with "or"'
                    })
        
        if province_issues:
            print(f"\n{'='*80}")
            print(f"Province: {province_name}")
            print(f"{'='*80}")
            for issue in province_issues:
                print(f"\n  Degree: {issue['degree']}")
                print(f"  Type: {issue['type']}")
                print(f"  Original format: {issue['original']}")
                print(f"  Note: {issue['note']}")
            issues.extend(province_issues)
    
    print(f"\n{'='*80}")
    print(f"SUMMARY: Found {len(issues)} requirements that need format checking")
    print(f"{'='*80}")
    
    return issues

if __name__ == "__main__":
    issues = check_all_formats()

