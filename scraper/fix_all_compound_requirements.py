#!/usr/bin/env python3
"""
Fix all compound requirements (X, Y, or Z format) across all provinces
Keep them as single line with proper province-specific course codes
"""

import json

def fix_compound_requirements():
    """Fix all compound requirements to stay on single line"""
    
    # Load data
    with open('../src/data/detailed_requirements_enhanced.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Mappings for compound science requirements
    # Original: "A Grade 12 Biology, a Grade 12 Chemistry, or a Grade 12 Physics"
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
        "Prince Edward Island": "Biology 621A, Chemistry 621A, or Physics 621A",
        "Quebec": "A CEGEP DEC or equivalent two-year pre-university program",
        "Saskatchewan": "Biology 30, Chemistry 30, or Physics 30",
        "Yukon": "Biology 30, Chemistry 30, or Physics 30",
    }
    
    # Degrees that have compound science requirements
    degrees_with_compound_science = [
        "Applied Biology",
        "Food, Nutrition, and Health",
        "Natural Resources",
        "Urban Forestry"
    ]
    
    fixes_applied = 0
    
    print("="*80)
    print("FIXING COMPOUND REQUIREMENTS")
    print("="*80)
    
    # Fix each province
    for province_name, province_data in data.get('provinces', {}).items():
        if province_name not in science_mappings:
            continue
        
        for degree_name in degrees_with_compound_science:
            if degree_name not in province_data.get('degrees', {}):
                continue
            
            degree_data = province_data['degrees'][degree_name]
            g12_reqs = degree_data.get('grade_12_requirements', [])
            
            # Find and replace compound requirements
            new_g12 = []
            found_compound = False
            
            for req in g12_reqs:
                # Check if this is part of the compound science requirement
                # (multiple separate Biology/Chemistry/Physics entries)
                if any(x in req for x in ['Biology', 'Chemistry', 'Physics', 'Anatomy']):
                    if not found_compound:
                        # First occurrence - add the combined requirement
                        if degree_name == "Natural Resources":
                            new_g12.append(f"{science_mappings[province_name]} (see Related courses below)")
                        else:
                            new_g12.append(science_mappings[province_name])
                        found_compound = True
                        fixes_applied += 1
                        print(f"✓ {province_name} - {degree_name}")
                    # Skip subsequent Biology/Chemistry/Physics entries
                else:
                    new_g12.append(req)
            
            if found_compound:
                degree_data['grade_12_requirements'] = new_g12
    
    # Save
    with open('../src/data/detailed_requirements_enhanced.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"✅ Fixed {fixes_applied} degree programs")
    print(f"{'='*80}")

if __name__ == "__main__":
    fix_compound_requirements()

