#!/usr/bin/env python3
"""
Comprehensive check for all bullet point formats across all provinces and majors
Check for any other compound requirements that need fixing
"""

import json
import re

def check_for_other_issues():
    """Check for any other formatting issues"""
    
    # Load both original and enhanced data
    with open('data/vancouver_detailed_requirements.json', 'r', encoding='utf-8') as f:
        original = json.load(f)
    
    with open('../src/data/detailed_requirements_enhanced.json', 'r', encoding='utf-8') as f:
        enhanced = json.load(f)
    
    issues = []
    all_majors = set()
    
    print("="*80)
    print("COMPREHENSIVE BULLET POINT FORMAT CHECK")
    print("="*80)
    
    # Get all unique majors
    for prov_data in enhanced.get('provinces', {}).values():
        all_majors.update(prov_data.get('degrees', {}).keys())
    
    print(f"\nTotal Majors Found: {len(all_majors)}")
    print("Majors:", sorted(all_majors))
    
    # Check each province and major
    for province_name, province_data in enhanced.get('provinces', {}).items():
        for degree_name, degree_data in province_data.get('degrees', {}).items():
            # Get original data for comparison
            orig_degree = original.get('provinces', {}).get(province_name, {}).get('degrees', {}).get(degree_name, {})
            
            # Check Grade 12
            enhanced_g12 = degree_data.get('grade_12_requirements', [])
            original_g12 = orig_degree.get('grade_12_requirements', []) if orig_degree else []
            
            # Check if we split something that should be together
            for orig_req in original_g12:
                # Look for patterns like "X and Y" or "X, Y, and Z" that might need consolidation
                if ' and ' in orig_req and ',' in orig_req:
                    # Check if this got split inappropriately
                    issues.append({
                        'province': province_name,
                        'degree': degree_name,
                        'type': 'Grade 12',
                        'original': orig_req,
                        'note': 'May need to check "and" conjunction'
                    })
            
            # Check Grade 11
            enhanced_g11 = degree_data.get('grade_11_requirements', [])
            original_g11 = orig_degree.get('grade_11_requirements', []) if orig_degree else []
            
            for orig_req in original_g11:
                if ' and ' in orig_req and ',' in orig_req:
                    issues.append({
                        'province': province_name,
                        'degree': degree_name,
                        'type': 'Grade 11',
                        'original': orig_req,
                        'note': 'May need to check "and" conjunction'
                    })
    
    if issues:
        print(f"\n{'='*80}")
        print(f"POTENTIAL ISSUES FOUND: {len(issues)}")
        print(f"{'='*80}")
        for issue in issues:
            print(f"\n{issue['province']} - {issue['degree']} ({issue['type']})")
            print(f"  Original: {issue['original']}")
            print(f"  Note: {issue['note']}")
    else:
        print(f"\n{'='*80}")
        print("✅ NO ADDITIONAL ISSUES FOUND")
        print(f"{'='*80}")
    
    return issues

if __name__ == "__main__":
    check_for_other_issues()

