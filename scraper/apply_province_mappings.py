#!/usr/bin/env python3
"""
Apply province-specific course code mappings to the scraped requirements
"""

import json
import re

def load_mappings():
    """Load province course mappings"""
    with open('scraper/province_course_mappings.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def map_requirement_to_province(requirement_text, province_name, mappings):
    """Map a generic requirement to province-specific course codes"""
    if province_name not in mappings['mappings']:
        return [requirement_text]  # Return as-is if province not mapped
    
    province_map = mappings['mappings'][province_name]
    
    # Try exact match first
    if requirement_text in province_map:
        return province_map[requirement_text]
    
    # Try partial matches
    for generic, specific in province_map.items():
        if generic.lower() in requirement_text.lower():
            # Replace the generic part with specific codes
            return specific
    
    # Return original if no mapping found
    return [requirement_text]

def apply_mappings_to_data(input_file, output_file, mappings):
    """Apply province mappings to the scraped data"""
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_mapped = 0
    
    # Process each province
    for province_name, province_data in data.get('provinces', {}).items():
        print(f"\nProcessing: {province_name}")
        
        # Check if degrees are nested under faculty or directly under province
        degrees_dict = province_data.get('degrees', {})
        
        # Handle two possible structures:
        # 1. degrees[degree_name] = degree_data (flat)
        # 2. degrees[faculty_name][degree_name] = degree_data (nested)
        
        # Try to determine structure
        if degrees_dict:
            first_value = next(iter(degrees_dict.values()))
            
            # If first value is a dict with 'grade_12_requirements', it's flat structure
            if isinstance(first_value, dict) and 'grade_12_requirements' in first_value:
                # Flat structure: process directly
                for degree_name, degree_data in degrees_dict.items():
                    if not isinstance(degree_data, dict):
                        continue
                    
                    # Map Grade 12 requirements
                    if degree_data.get('grade_12_requirements'):
                        new_g12 = []
                        for req in degree_data['grade_12_requirements']:
                            mapped = map_requirement_to_province(req, province_name, mappings)
                            if mapped != [req]:  # Something was mapped
                                total_mapped += 1
                                print(f"  ✓ {degree_name}: '{req}' → {mapped}")
                            new_g12.extend(mapped)
                        degree_data['grade_12_requirements'] = new_g12
                    
                    # Map Grade 11 requirements
                    if degree_data.get('grade_11_requirements'):
                        new_g11 = []
                        for req in degree_data['grade_11_requirements']:
                            mapped = map_requirement_to_province(req, province_name, mappings)
                            if mapped != [req]:
                                total_mapped += 1
                                print(f"  ✓ {degree_name}: '{req}' → {mapped}")
                            new_g11.extend(mapped)
                        degree_data['grade_11_requirements'] = new_g11
            else:
                # Nested structure: iterate through faculties first
                for faculty_name, faculty_degrees in degrees_dict.items():
                    if not isinstance(faculty_degrees, dict):
                        continue
                    for degree_name, degree_data in faculty_degrees.items():
                        if not isinstance(degree_data, dict):
                            continue
                        
                        # Map Grade 12 requirements
                        if degree_data.get('grade_12_requirements'):
                            new_g12 = []
                            for req in degree_data['grade_12_requirements']:
                                mapped = map_requirement_to_province(req, province_name, mappings)
                                if mapped != [req]:
                                    total_mapped += 1
                                    print(f"  ✓ {faculty_name}/{degree_name}: '{req}' → {mapped}")
                                new_g12.extend(mapped)
                            degree_data['grade_12_requirements'] = new_g12
                        
                        # Map Grade 11 requirements
                        if degree_data.get('grade_11_requirements'):
                            new_g11 = []
                            for req in degree_data['grade_11_requirements']:
                                mapped = map_requirement_to_province(req, province_name, mappings)
                                if mapped != [req]:
                                    total_mapped += 1
                                    print(f"  ✓ {faculty_name}/{degree_name}: '{req}' → {mapped}")
                                new_g11.extend(mapped)
                            degree_data['grade_11_requirements'] = new_g11
    
    # Save the enhanced data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n{'=' * 80}")
    print(f"✓ Applied {total_mapped} province-specific mappings")
    print(f"✓ Saved to: {output_file}")
    print(f"{'=' * 80}")

def main():
    print("=" * 80)
    print("Applying Province-Specific Course Code Mappings")
    print("=" * 80)
    
    mappings = load_mappings()
    print(f"\n✓ Loaded mappings for {len(mappings['mappings'])} provinces")
    
    # Apply to the raw scraped data
    apply_mappings_to_data(
        'scraper/data/vancouver_detailed_requirements.json',
        'scraper/data/vancouver_detailed_requirements_enhanced.json',
        mappings
    )
    
    # Also apply to the processed data if it exists
    try:
        apply_mappings_to_data(
            'src/data/detailed_requirements.json',
            'src/data/detailed_requirements_enhanced.json',
            mappings
        )
    except FileNotFoundError:
        print("\n⚠ src/data/detailed_requirements.json not found, skipping frontend enhancement")

if __name__ == "__main__":
    main()

