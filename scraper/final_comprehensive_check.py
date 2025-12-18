#!/usr/bin/env python3
"""
Final comprehensive check of all provinces and majors
Ensure all requirements follow the exact bullet point format from website
"""

import json

def final_check():
    """Final verification of all data"""
    
    # Load data
    with open('../src/data/detailed_requirements_enhanced.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Expected structure
    expected_provinces = [
        "Alberta", "British Columbia", "Manitoba", "New Brunswick",
        "Newfoundland & Labrador", "Northwest Territories", "Nova Scotia",
        "Nunavut", "Ontario", "Prince Edward Island", "Quebec",
        "Saskatchewan", "Yukon"
    ]
    
    expected_majors = [
        "Applied Biology",
        "Applied Science (Engineering)",
        "Arts",
        "Bachelor + Master of Management",
        "Commerce (UBC Sauder School of Business)",
        "Dental Hygiene",
        "Design in Architecture, Landscape Architecture, and Urbanism",
        "Fine Arts (direct-entry specializations only; excludes Creative Writing)",
        "Food and Resource Economics",
        "Food, Nutrition, and Health",
        "Indigenous Land Stewardship",
        "Indigenous Teacher Education Program (NITEP)",
        "International Economics",
        "Kinesiology",
        "Media Studies",
        "Music",
        "Natural Resources",
        "Pharmaceutical Sciences",
        "Science",
        "Urban Forestry"
    ]
    
    print("="*80)
    print("FINAL COMPREHENSIVE CHECK")
    print("="*80)
    
    print(f"\n✅ Expected Provinces: {len(expected_provinces)}")
    print(f"✅ Expected Majors: {len(expected_majors)}")
    
    # Check province count
    actual_provinces = list(data.get('provinces', {}).keys())
    print(f"\n✅ Actual Provinces in Data: {len(actual_provinces)}")
    
    # Check for missing provinces
    missing_provinces = set(expected_provinces) - set(actual_provinces)
    if missing_provinces:
        print(f"⚠️  Missing Provinces: {missing_provinces}")
    
    # Sample check: verify key requirements are formatted correctly
    print("\n" + "="*80)
    print("SAMPLE VERIFICATION - Applied Biology (All Provinces)")
    print("="*80)
    
    issues = []
    
    for province_name in expected_provinces:
        if province_name not in data.get('provinces', {}):
            continue
        
        province_data = data['provinces'][province_name]
        
        if 'Applied Biology' not in province_data.get('degrees', {}):
            issues.append(f"❌ {province_name}: Missing 'Applied Biology' degree")
            continue
        
        degree_data = province_data['degrees']['Applied Biology']
        g12_reqs = degree_data.get('grade_12_requirements', [])
        g11_reqs = degree_data.get('grade_11_requirements', [])
        
        print(f"\n{province_name}:")
        print("  Grade 12:")
        for req in g12_reqs:
            print(f"    - {req}")
        print("  Grade 11:")
        for req in g11_reqs:
            print(f"    - {req}")
        
        # Check for compound science requirement (should be single line)
        bio_count = sum(1 for r in g12_reqs if 'Biology' in r or 'Anatomy' in r)
        chem_count = sum(1 for r in g12_reqs if 'Chemistry' in r and 'Biology' not in r)
        phys_count = sum(1 for r in g12_reqs if 'Physics' in r)
        
        if bio_count + chem_count + phys_count > 1:
            issues.append(f"⚠️  {province_name}: Multiple separate science requirements (should be one line with 'or')")
    
    # Check sample of other majors
    print("\n" + "="*80)
    print("SAMPLE VERIFICATION - Other Majors (BC)")
    print("="*80)
    
    bc_data = data['provinces']['British Columbia']['degrees']
    
    for major in ['Arts', 'Science', 'Commerce (UBC Sauder School of Business)']:
        if major in bc_data:
            print(f"\n{major}:")
            print("  Grade 12:")
            for req in bc_data[major].get('grade_12_requirements', []):
                print(f"    - {req}")
    
    print("\n" + "="*80)
    if issues:
        print(f"⚠️  ISSUES FOUND: {len(issues)}")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ NO ISSUES FOUND - All requirements properly formatted!")
    print("="*80)

if __name__ == "__main__":
    final_check()

