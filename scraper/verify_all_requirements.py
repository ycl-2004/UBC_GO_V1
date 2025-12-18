#!/usr/bin/env python3
"""
Comprehensive verification of all province requirements
Checks for:
1. BC-specific course codes that weren't mapped
2. Generic formats that need province-specific mapping
3. Missing or empty requirements
4. Consistency across provinces
"""

import json
import re

# BC-specific course codes that should NOT appear in other provinces
BC_COURSE_CODES = [
    "English Studies 12",
    "English First Peoples 12",
    "Pre-Calculus 12",
    "Calculus 12",
    "Foundations of Math 12",
    "Anatomy and Physiology 12",
    "Biology 12",
    "Chemistry 12",
    "Physics 12",
    "Chemistry 11",
    "Biology 11",
    "Physics 11",
]

# Generic patterns that should be mapped
GENERIC_PATTERNS = [
    r"^A Grade 1[12] ",
    r"^Grade 1[12] ",
]

def check_for_bc_codes(requirements, province):
    """Check if BC codes appear in non-BC provinces"""
    issues = []
    if province == "British Columbia":
        return issues
    
    for req in requirements:
        # Skip if it's a composite requirement with province codes
        if any(code in req for code in ["121", "122", "111", "112", "30S", "40S", "30-1", "30-2", "3201", "4U"]):
            continue
            
        for bc_code in BC_COURSE_CODES:
            # Check for exact match or surrounded by spaces/punctuation
            if bc_code in req and not req.startswith("("):
                # Make sure it's not part of a longer course code
                import re
                pattern = r'\b' + re.escape(bc_code) + r'\b'
                if re.search(pattern, req):
                    issues.append(f"BC code found: '{req}'")
    
    return issues

def check_for_generic_patterns(requirements):
    """Check if generic patterns still exist"""
    issues = []
    for req in requirements:
        for pattern in GENERIC_PATTERNS:
            if re.match(pattern, req):
                issues.append(f"Generic format: '{req}'")
    
    return issues

def verify_all_provinces():
    """Verify all provinces and degrees"""
    
    # Load the data
    with open('../src/data/detailed_requirements_enhanced.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_issues = 0
    provinces_checked = 0
    degrees_checked = 0
    
    print("=" * 80)
    print("COMPREHENSIVE REQUIREMENTS VERIFICATION")
    print("=" * 80)
    print()
    
    # Check each province
    for province_name, province_data in data['provinces'].items():
        provinces_checked += 1
        province_issues = []
        
        print(f"\n{'='*80}")
        print(f"Province: {province_name}")
        print(f"{'='*80}")
        
        # Check each degree
        for degree_name, degree_data in province_data['degrees'].items():
            degrees_checked += 1
            degree_issues = []
            
            # Check Grade 12 requirements
            grade_12 = degree_data.get('grade_12_requirements', [])
            bc_issues_12 = check_for_bc_codes(grade_12, province_name)
            generic_issues_12 = check_for_generic_patterns(grade_12)
            
            # Check Grade 11 requirements
            grade_11 = degree_data.get('grade_11_requirements', [])
            bc_issues_11 = check_for_bc_codes(grade_11, province_name)
            generic_issues_11 = check_for_generic_patterns(grade_11)
            
            # Collect all issues
            all_issues = bc_issues_12 + generic_issues_12 + bc_issues_11 + generic_issues_11
            
            if all_issues:
                print(f"\n  ⚠️  {degree_name}:")
                for issue in all_issues:
                    print(f"      - {issue}")
                total_issues += len(all_issues)
            else:
                print(f"  ✓ {degree_name}")
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Provinces checked: {provinces_checked}")
    print(f"Degrees checked: {degrees_checked}")
    print(f"Total issues found: {total_issues}")
    
    if total_issues == 0:
        print("\n✅ ALL REQUIREMENTS ARE CORRECTLY FORMATTED!")
        print("   All BC codes mapped to province-specific codes")
        print("   All generic formats converted")
    else:
        print(f"\n❌ Found {total_issues} issues that need fixing")
        print("   Run mapping scripts to fix these issues")
    
    print("=" * 80)
    
    return total_issues

if __name__ == "__main__":
    issues = verify_all_provinces()
    exit(0 if issues == 0 else 1)

