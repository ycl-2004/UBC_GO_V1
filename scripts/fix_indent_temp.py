#!/usr/bin/env python3
# Fix indentation in scrape_course_details.py

with open('scripts/scrape_course_details.py', 'r') as f:
    lines = f.readlines()

# Fix line 430 (index 429) - should have 28 spaces (7 levels * 4 spaces)
# Fix line 431 (index 430) - should have 28 spaces
for i, line in enumerate(lines):
    if i == 429:  # Line 430 (0-indexed)
        # Replace with correct indentation (28 spaces)
        if 'course_data[code] = course_info' in line:
            lines[i] = '                            course_data[code] = course_info\n'
    elif i == 430:  # Line 431
        if 'print(f"  Updated: {code}")' in line:
            lines[i] = '                            print(f"  Updated: {code}")\n'

with open('scripts/scrape_course_details.py', 'w') as f:
    f.writelines(lines)

print("Fixed indentation at lines 430-431")

