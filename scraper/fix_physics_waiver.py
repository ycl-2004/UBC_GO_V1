#!/usr/bin/env python3
"""
Fix Physics 11 requirement to include waiver clause
"""

import json

def fix_physics_waiver():
    """Add waiver clause to Physics 11 requirements"""
    
    # Load data
    with open('../src/data/detailed_requirements_enhanced.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Province-specific Physics 11 mappings with waiver clause
    physics_mappings = {
        "Alberta": "Physics 20 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "British Columbia": "Physics 11 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Manitoba": "Physics 30S (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "New Brunswick": "Physics 111 or Physics 112 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Newfoundland & Labrador": "Physics 2204 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Northwest Territories": "Physics 20 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Nova Scotia": "Physics 11 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Nunavut": "Physics 20 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Ontario": "SPH3U (Physics) (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Prince Edward Island": "Physics 521A (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Quebec": "A Grade 11 Physics (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Saskatchewan": "Physics 20 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
        "Yukon": "Physics 20 (may be waived with scores of 86% or higher in senior-level Math and junior-level or senior-level Chemistry, or scores of 5 or higher in IB Mathematics and IB Chemistry)",
    }
    
    # Degrees that have Physics 11 with waiver
    degrees_with_physics_waiver = [
        "Applied Biology",
        "Food, Nutrition, and Health"
    ]
    
    fixes_applied = 0
    
    print("="*80)
    print("FIXING PHYSICS 11 WAIVER CLAUSE")
    print("="*80)
    
    # Fix each province
    for province_name, province_data in data.get('provinces', {}).items():
        if province_name not in physics_mappings:
            continue
        
        for degree_name in degrees_with_physics_waiver:
            if degree_name not in province_data.get('degrees', {}):
                continue
            
            degree_data = province_data['degrees'][degree_name]
            g11_reqs = degree_data.get('grade_11_requirements', [])
            
            # Find and replace Physics requirement
            new_g11 = []
            found_physics = False
            
            for req in g11_reqs:
                # Check if this is the Physics requirement
                if 'Physics' in req and 'may be waived' not in req:
                    # Replace with version that includes waiver
                    new_g11.append(physics_mappings[province_name])
                    found_physics = True
                    fixes_applied += 1
                    print(f"✓ {province_name} - {degree_name}")
                else:
                    new_g11.append(req)
            
            if found_physics:
                degree_data['grade_11_requirements'] = new_g11
    
    # Save
    with open('../src/data/detailed_requirements_enhanced.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'='*80}")
    print(f"✅ Fixed {fixes_applied} Physics 11 requirements with waiver clause")
    print(f"{'='*80}")

if __name__ == "__main__":
    fix_physics_waiver()

