#!/usr/bin/env python3
"""
Fix Science degree requirements - should have compound science requirement
"""

import json

def fix_science_requirements():
    """Fix Science degree to have proper compound science requirement"""
    
    # Load data
    with open('../src/data/detailed_requirements_enhanced.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Mappings for compound science requirements (same as Applied Biology)
    science_mappings = {
        "Alberta": "Biology 30, Chemistry 30, or Physics 30",
        "British Columbia": "Anatomy and Physiology 12 (Biology 12), Chemistry 12, or Physics 12",
        "Manitoba": "Biology 40S, Chemistry 40S, or Physics 40S",
        "New Brunswick": "Biology 121 or Biology 122, Chemistry 121 or Chemistry 122, or Physics 121 or Physics 122",
        "Newfoundland & Labrador": "Biology 3201, Chemistry 3202, or Physics 3204",
        "Northwest Territories": "Biology 30, Chemistry 30, or Physics 30",
        "Nova Scotia": "Biology 12, Chemistry 12, or Physics 12",
        "Nunavut": "Biology 30, Chemistry 30, or Physics 30",
        "Ontario": "SBI4U (Biology), SCH4U (Chemistry), or SPH4U (Physics)",
        "Prince Edward Island": "BIO611 or BIO621, CHM611 or CHM621, or PHY611 or PHY621",
        "Quebec": "A CEGEP DEC or equivalent two-year pre-university program",
        "Saskatchewan": "Biology 30, Chemistry 30, or Physics 30",
        "Yukon": "Biology 12, Chemistry 12, or Physics 12",
    }
    
    fixes_applied = 0
    
    print("="*80)
    print("FIXING SCIENCE DEGREE REQUIREMENTS")
    print("="*80)
    
    # Fix each province
    for province_name, province_data in data.get('provinces', {}).items():
        if province_name not in science_mappings:
            continue
        
        if "Science" not in province_data.get('degrees', {}):
            continue
        
        degree_data = province_data['degrees']['Science']
        g12_reqs = degree_data.get('grade_12_requirements', [])
        
        # Find and replace science requirements
        new_g12 = []
        found_science = False
        
        for req in g12_reqs:
            # Skip Biology/Chemistry/Physics entries
            if any(x in req for x in ['Biology', 'Chemistry', 'Physics', 'Anatomy']):
                if not found_science:
                    # First occurrence - add the combined requirement
                    new_g12.append(science_mappings[province_name])
                    found_science = True
                    fixes_applied += 1
                    print(f"✓ {province_name} - Science")
                # Skip subsequent entries
            else:
                new_g12.append(req)
        
        if found_science:
            degree_data['grade_12_requirements'] = new_g12
    
    # Save
    with open('../src/data/detailed_requirements_enhanced.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"✅ Fixed {fixes_applied} Science degree requirements")
    print(f"{'='*80}")

if __name__ == "__main__":
    fix_science_requirements()

