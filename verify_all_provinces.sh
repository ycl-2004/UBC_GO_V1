#!/bin/bash

# Verification script for all 13 provinces mapping

echo "========================================="
echo "Verifying All 13 Provinces Mapping"
echo "========================================="
echo ""

cd "$(dirname "$0")"

python3 << 'EOF'
import json
import sys

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def check_province_mappings():
    """Verify all 13 provinces have proper mappings"""
    
    # Load mappings file
    with open('scraper/province_course_mappings.json', 'r') as f:
        mappings_data = json.load(f)
    
    # Load enhanced data file
    with open('src/data/detailed_requirements_enhanced.json', 'r') as f:
        enhanced_data = json.load(f)
    
    expected_provinces = [
        'Alberta',
        'British Columbia',
        'Manitoba',
        'New Brunswick',
        'Newfoundland & Labrador',
        'Northwest Territories',
        'Nova Scotia',
        'Nunavut',
        'Ontario',
        'Prince Edward Island',
        'Quebec',
        'Saskatchewan',
        'Yukon'
    ]
    
    print(f"{BLUE}1. Checking Mapping Rules File...{RESET}")
    mapped_provinces = list(mappings_data['mappings'].keys())
    
    if len(mapped_provinces) == 13:
        print(f"{GREEN}   ✓ All 13 provinces have mapping rules{RESET}")
    else:
        print(f"{RED}   ✗ Only {len(mapped_provinces)}/13 provinces mapped{RESET}")
        return False
    
    print(f"\n{BLUE}2. Checking Enhanced Data File...{RESET}")
    data_provinces = list(enhanced_data['provinces'].keys())
    
    if len(data_provinces) == 13:
        print(f"{GREEN}   ✓ All 13 provinces in data file{RESET}")
    else:
        print(f"{RED}   ✗ Only {len(data_provinces)}/13 provinces in data{RESET}")
        return False
    
    print(f"\n{BLUE}3. Verifying Province-Specific Course Codes...{RESET}")
    
    test_cases = {
        'Alberta': {
            'expected': 'Math 30-1 or Math 31',
            'degree': 'Applied Biology'
        },
        'Ontario': {
            'expected': 'ENG4U',
            'degree': 'Applied Biology'
        },
        'Newfoundland & Labrador': {
            'expected': 'English 3201',
            'degree': 'Applied Biology'
        },
        'Prince Edward Island': {
            'expected': 'Pre-Calculus 621B',
            'degree': 'Applied Biology'
        }
    }
    
    all_passed = True
    for province, test in test_cases.items():
        degrees = enhanced_data['provinces'][province]['degrees']
        if test['degree'] in degrees:
            reqs = degrees[test['degree']]['grade_12_requirements']
            found = any(test['expected'] in req for req in reqs)
            if found:
                print(f"{GREEN}   ✓ {province}: Contains '{test['expected']}'{RESET}")
            else:
                print(f"{RED}   ✗ {province}: Missing '{test['expected']}'{RESET}")
                print(f"      Found: {reqs[:2]}")
                all_passed = False
    
    print(f"\n{BLUE}4. Checking Consolidated Format...{RESET}")
    
    # Check if requirements are consolidated (no separate lines for options)
    alberta_bio = enhanced_data['provinces']['Alberta']['degrees']['Applied Biology']
    grade_12 = alberta_bio['grade_12_requirements']
    
    # Should have consolidated format (3 lines, not 5+)
    if len(grade_12) <= 4:
        print(f"{GREEN}   ✓ Requirements are consolidated (not split){RESET}")
        print(f"      Example (Alberta Applied Biology): {len(grade_12)} requirements")
    else:
        print(f"{YELLOW}   ⚠ Requirements might not be consolidated{RESET}")
        print(f"      Found {len(grade_12)} requirements (expected ≤4)")
    
    print(f"\n{BLUE}5. Summary{RESET}")
    print(f"   Total Provinces Mapped: {len(mapped_provinces)}/13")
    print(f"   Total Mapping Rules: {sum(len(rules) for rules in mappings_data['mappings'].values())}")
    
    if all_passed and len(mapped_provinces) == 13:
        print(f"\n{GREEN}{'='*60}{RESET}")
        print(f"{GREEN}✓ ALL TESTS PASSED! All 13 provinces correctly mapped.{RESET}")
        print(f"{GREEN}{'='*60}{RESET}")
        return True
    else:
        print(f"\n{RED}{'='*60}{RESET}")
        print(f"{RED}✗ SOME TESTS FAILED. Please review the output above.{RESET}")
        print(f"{RED}{'='*60}{RESET}")
        return False

if __name__ == '__main__':
    success = check_province_mappings()
    sys.exit(0 if success else 1)
EOF

echo ""
echo "========================================="
echo "Verification Complete"
echo "========================================="

