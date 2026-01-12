"""
UBC Arts Curriculum Scraper
Scrapes curriculum data for UBC Arts majors from the Academic Calendar.
Uses sibling traversal logic because Arts requirements are structured as headers and text paragraphs, not tables.

Usage:
    python scraper/curriculum/scrape_arts_curriculum.py
    python scraper/curriculum/scrape_arts_curriculum.py --major "Anthropology"
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os
import sys
from typing import Dict, List, Optional
from urllib.parse import urljoin, urlparse

class UBCArtsCurriculumScraper:
    def __init__(self):
        self.base_url = "https://vancouver.calendar.ubc.ca"
        self.ba_url = f"{self.base_url}/faculties-colleges-and-schools/faculty-arts/bachelor-arts"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Output directory
        script_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.output_dir = os.path.join(script_dir, 'src', 'data', 'curriculum', 'arts')
        os.makedirs(self.output_dir, exist_ok=True)
        
        self.main_curriculum_file = os.path.join(self.output_dir, 'arts_curriculum.json')
    
    def extract_credits(self, text: str) -> int:
        """Extract credit value from text - looks for (3) pattern after course code"""
        # Look for pattern like "ANTH_V 100 (3)" - credits in parentheses after course code
        match = re.search(r'\((\d+)\)', text)
        if match:
            return int(match.group(1))
        # Also check for "3 credits" pattern
        match = re.search(r'(\d+)\s+credits?', text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 3  # Default to 3 credits
    
    def parse_course_from_text(self, text: str) -> List[Dict]:
        """Parse courses from text - returns list of courses (handles "or" and comma-separated lists)"""
        text = text.strip()
        if not text:
            return []
        
        courses = []
        
        # Handle "or" options: "ARCL_V 103 (3) or ARCL_V 140 (3)"
        # Store first course in code, "or" option in notes
        if ' or ' in text:
            parts = re.split(r'\s+or\s+', text, flags=re.IGNORECASE)
            first_course = None
            or_options = []
            
            for part in parts:
                part = part.strip()
                # Parse each option
                code_match = re.search(r'([A-Z]{2,4}(?:_V)?)\s+(\d{3}[A-Z]?)', part)
                if code_match:
                    course_code = f"{code_match.group(1)} {code_match.group(2)}"
                    credits = self.extract_credits(part)
                    
                    if first_course is None:
                        first_course = {
                            'code': course_code,
                            'credits': credits if credits > 0 else 3
                        }
                    else:
                        # Build the "or" part: "or ARCL_V 140 (3)"
                        or_text = f"or {course_code}"
                        if credits > 0:
                            or_text += f" ({credits})"
                        or_options.append(or_text)
            
            if first_course:
                # Combine all "or" options
                or_notes = ' '.join(or_options)
                return [{
                    'code': first_course['code'],
                    'credits': first_course['credits'],
                    'title': '',
                    'notes': or_notes
                }]
        
        # Handle descriptive requirements first (before parsing course lists)
        # Like "6 credits chosen from other ANTH_V or ARCL_V courses at the 200-level"
        if 'credits' in text.lower() and ('chosen' in text.lower() or 'from' in text.lower() or 'at the' in text.lower()):
            # Check if it contains course codes - if so, it might be a list
            has_course_codes = bool(re.search(r'[A-Z]{2,4}(?:_V)?\s+\d{3}', text))
            if not has_course_codes:
                # Pure descriptive requirement without specific courses
                return [{
                    'code': 'Electives',
                    'credits': self.extract_credits(text) if self.extract_credits(text) > 0 else 0,
                    'title': '',
                    'notes': text
                }]
        
        # Handle comma-separated course lists with description prefix
        # Like "3 credits in research methods and techniques: ANTH_V 317, 407, 408, 409..."
        # Or "Behavioural Neuroscience: PSYC_V 301, 304, 306..."
        # Check if text contains a colon followed by course codes
        if ':' in text:
            parts = text.split(':', 1)
            prefix = parts[0].strip()
            course_list_text = parts[1].strip() if len(parts) > 1 else ''
            
            # Extract all course codes from the part after colon
            # Handle both comma-separated and semicolon-separated lists
            # Pattern: "ANTH_V 317, 407, 408" or "ANTH_V 317, 407; ARCL_V 306, 345"
            # Also handle cases where course numbers are listed without prefix: "ANTH_V 317, 407, 408"
            current_prefix = None
            all_course_codes = []
            
            # Split by semicolon first to handle different prefixes
            sections = re.split(r';\s*', course_list_text)
            for section in sections:
                # Find all explicit course codes with prefix: "ANTH_V 317"
                explicit_codes = re.findall(r'([A-Z]{2,4}(?:_V)?)\s+(\d{3}[A-Z]?)', section)
                
                # Also find standalone numbers that follow a prefix: "317, 407, 408"
                # These should use the last seen prefix
                for code_match in explicit_codes:
                    current_prefix = code_match[0]  # Update current prefix
                    all_course_codes.append((code_match[0], code_match[1]))
                
                # Now find standalone numbers (without prefix) that should use current_prefix
                # Pattern: after a course code, find numbers like ", 407, 408"
                standalone_numbers = re.findall(r',\s*(\d{3}[A-Z]?)', section)
                for num in standalone_numbers:
                    if current_prefix:
                        all_course_codes.append((current_prefix, num))
            
            if len(all_course_codes) > 0:
                # Check if this is a category/requirement with multiple courses
                # Cases:
                # 1. "X credits from..." - prefix contains "credits"
                # 2. "Category Name: COURSE1, COURSE2..." - category name followed by course list (e.g., "Behavioural Neuroscience:", "Cognitive Science:")
                # 3. Single course - just return that course
                
                # If multiple courses, create single "Electives" entry
                if len(all_course_codes) > 1:
                    # Check if prefix contains "credits" to extract credit value
                    credits = self.extract_credits(prefix)
                    if credits == 3:  # Default, try to extract from text
                        credits = self.extract_credits(text)
                    
                    return [{
                        'code': 'Electives',
                        'credits': credits if credits > 0 else 3,
                        'title': '',
                        'notes': text  # Store full requirement text as note
                    }]
                # If only one course, treat it as a regular course entry
                else:
                    course_code = f"{all_course_codes[0][0]} {all_course_codes[0][1]}"
                    credits = self.extract_credits(text)
                    return [{
                        'code': course_code,
                        'credits': credits if credits > 0 else 3,
                        'title': '',
                        'notes': prefix  # Store the description prefix as note
                    }]
        
        # Handle comma-separated course lists without prefix: "ANTH_V 317, 407, 408, 409..."
        all_codes = re.findall(r'([A-Z]{2,4}(?:_V)?)\s+(\d{3}[A-Z]?)', text)
        if len(all_codes) > 1:
            # This is a list of courses
            for code_match in all_codes:
                course_code = f"{code_match[0]} {code_match[1]}"
                # Try to find credits for this specific course in the text
                course_pattern = re.escape(course_code) + r'\s*(?:\((\d+)\))?'
                credit_match = re.search(course_pattern, text)
                credits = int(credit_match.group(1)) if credit_match and credit_match.group(1) else 3
                
                courses.append({
                    'code': course_code,
                    'credits': credits,
                    'title': '',
                    'notes': text  # Store full requirement text as note
                })
            if courses:
                return courses
        
        # Single course: "ANTH_V 100 (3)" or "An undergraduate Honours thesis: ANTH_V 449 (6)"
        code_match = re.search(r'([A-Z]{2,4}(?:_V)?)\s+(\d{3}[A-Z]?)', text)
        if code_match:
            course_code = f"{code_match.group(1)} {code_match.group(2)}"
            credits = self.extract_credits(text)
            
            # Extract title/description (text before or after course code)
            # For "An undergraduate Honours thesis: ANTH_V 449 (6)", keep the prefix
            title = ''
            if ':' in text:
                colon_pos = text.index(':')
                code_pos = text.index(course_code)
                if colon_pos < code_pos:
                    # Description before course code (e.g., "An undergraduate Honours thesis: ANTH_V 449 (6)")
                    title = text[:colon_pos].strip()
                else:
                    # Description after course code
                    title_text = re.sub(r'[A-Z]{2,4}(?:_V)?\s+\d{3}[A-Z]?\s*(?:\(\d+\))?\s*', '', text).strip()
                    title = title_text if title_text and len(title_text) < 200 else ''
            else:
                # No colon, try to extract description after course code
                title_text = re.sub(r'[A-Z]{2,4}(?:_V)?\s+\d{3}[A-Z]?\s*(?:\(\d+\))?\s*', '', text).strip()
                title_text = re.sub(r'^(Students must|including|from|chosen from|plus|Required courses|credits chosen|credits in)\s*:?\s*', '', title_text, flags=re.IGNORECASE)
                title = title_text if title_text and len(title_text) < 200 else ''
            
            courses.append({
                'code': course_code,
                'credits': credits if credits > 0 else 3,
                'title': title,
                'notes': ''
            })
            return courses
        
        # If no course code found, check if it's a descriptive requirement
        if 'credits' in text.lower():
            return [{
                'code': 'Electives',
                'credits': self.extract_credits(text) if self.extract_credits(text) > 0 else 0,
                'title': '',
                'notes': text
            }]
        
        return []
    
    def scrape_major_requirements(self, major_url: str, major_name: str) -> Optional[Dict]:
        """
        Scrape requirements for a single major using sibling traversal.
        Looks for h4 headers with "requirements" and collects following p and ul elements.
        """
        try:
            print(f"  Scraping {major_name}...")
            response = self.session.get(major_url, timeout=15)
            response.raise_for_status()
            
            # Try lxml first, fallback to html.parser
            try:
                soup = BeautifulSoup(response.content, 'lxml')
            except Exception:
                soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find the main content container - look for div with field__item class
            # The actual class is: "clearfix text-formatted field field--name-body field--type-text-with-summary field--label-hidden field__item"
            content_div = soup.find('div', class_='field__item')
            if not content_div:
                # Try alternative selectors
                content_div = soup.find('div', class_='field--item')
            if not content_div:
                # Try finding by field--name-body
                content_div = soup.find('div', class_='field--name-body')
            if not content_div:
                print(f"    ⚠️  Could not find content container")
                return None
            
            curriculum = {
                '1': [],  # Lower-level requirements (Years 1 & 2)
                '2': [],
                '3': [],  # Upper-level requirements (Years 3 & 4)
                '4': []
            }
            
            # Find all h4 headers and also p tags with strong tags containing "requirements"
            headers = content_div.find_all(['h4', 'p'])
            
            for header in headers:
                # Check if this is a p tag with strong tag containing requirements
                if header.name == 'p':
                    strong_tag = header.find('strong')
                    if not strong_tag:
                        continue
                    header_text = strong_tag.get_text(strip=True).lower()
                    if 'requirements' not in header_text:
                        continue
                else:
                    # It's an h4 tag
                    header_text = header.get_text(strip=True).lower()
                    if 'requirements' not in header_text:
                        continue
                
                # Check if this is under "Major in" section (ignore Honours, Minor sections for now)
                parent_section = header.find_previous('h3')
                if parent_section:
                    parent_text = parent_section.get_text(strip=True).lower()
                    # Only process if it's under "Major in" section (not Honours or Minor)
                    # Check for "major in" specifically, not just "major"
                    if 'major in' not in parent_text or 'honours' in parent_text or 'minor' in parent_text:
                        continue
                
                # Also check if there's an h4 "Major in Political Science" before this
                # Sometimes the structure is: h4 "Major in X" followed by p>strong "Lower-level Requirements"
                prev_h4 = header.find_previous('h4')
                if prev_h4 and 'major in' in prev_h4.get_text(strip=True).lower():
                    # This is good - it's under a "Major in" h4
                    pass
                elif not parent_section or 'major in' not in parent_text:
                    # Skip if not under Major in section
                    continue
                
                # Get display text (from strong tag if it's a p tag, otherwise from header itself)
                if header.name == 'p' and header.find('strong'):
                    display_text = header.find('strong').get_text(strip=True)
                else:
                    display_text = header.get_text(strip=True)
                
                print(f"    Found header: {display_text}")
                
                # Determine which years this applies to
                year_keys = []
                if 'lower' in header_text or 'lower-level' in header_text:
                    year_keys = ['1', '2']
                elif 'upper' in header_text or 'upper-level' in header_text:
                    year_keys = ['3', '4']
                elif 'first' in header_text or 'year 1' in header_text:
                    year_keys = ['1']
                elif 'second' in header_text or 'year 2' in header_text:
                    year_keys = ['2']
                elif 'third' in header_text or 'year 3' in header_text:
                    year_keys = ['3']
                elif 'fourth' in header_text or 'year 4' in header_text:
                    year_keys = ['4']
                else:
                    # Default: if it says "requirements" without level, assume lower-level
                    year_keys = ['1', '2']
                
                # Traverse siblings until next h3, h4, or end
                courses_for_section = []
                description = ''
                found_ul = False
                
                for sibling in header.find_next_siblings():
                    # Stop at next h3, h4, or p with strong tag containing "requirements"
                    if sibling.name == 'h3':
                        break
                    if sibling.name == 'h4':
                        # Check if it's another requirements header
                        if 'requirements' in sibling.get_text(strip=True).lower():
                            break
                    if sibling.name == 'p':
                        strong_in_sibling = sibling.find('strong')
                        if strong_in_sibling and 'requirements' in strong_in_sibling.get_text(strip=True).lower():
                            break
                    
                    # Skip anchor tags with name attributes (they're just anchors)
                    if sibling.name == 'p' and sibling.find('a', {'name': True}) and not sibling.find('a', {'name': True}).find_next_sibling():
                        # This is just an anchor paragraph, skip it
                        continue
                    
                    # Collect description from p tags (but skip anchor-only paragraphs)
                    if sibling.name == 'p':
                        p_text = sibling.get_text(strip=True)
                        # Skip empty paragraphs
                        if not p_text or p_text.strip() == '':
                            continue
                        # Skip paragraphs that are just anchor tags
                        if p_text.strip().startswith('Students must') or 'including' in p_text.lower():
                            description = p_text
                        # Don't parse courses from p tags - wait for ul/li
                    
                    # Collect courses from ul/li tags - this is the main source
                    elif sibling.name == 'ul':
                        found_ul = True
                        for li in sibling.find_all('li', recursive=False):
                            li_text = li.get_text(strip=True)
                            if li_text:
                                parsed_courses = self.parse_course_from_text(li_text)
                                for course in parsed_courses:
                                    if course and course.get('code'):
                                        # Add description as note if available (but don't overwrite existing notes)
                                        if description and not course.get('notes'):
                                            course['notes'] = description
                                        # For courses with notes already (like research methods list), keep the full text
                                        # Avoid duplicates by code
                                        existing_codes = [c['code'] for c in courses_for_section]
                                        if course['code'] not in existing_codes:
                                            courses_for_section.append(course)
                        # Once we find the ul, we can break (next ul would be for different section)
                        break
                    
                    # Also check nested structures (in case ul is nested)
                    elif sibling.name in ['div', 'section']:
                        # Look for ul/li within divs
                        for ul in sibling.find_all('ul', recursive=True):
                            found_ul = True
                            for li in ul.find_all('li', recursive=False):
                                li_text = li.get_text(strip=True)
                                if li_text:
                                    parsed_courses = self.parse_course_from_text(li_text)
                                    for course in parsed_courses:
                                        if course and course.get('code'):
                                            if description and not course.get('notes'):
                                                course['notes'] = description
                                            existing_codes = [c['code'] for c in courses_for_section]
                                            if course['code'] not in existing_codes:
                                                courses_for_section.append(course)
                            if found_ul:
                                break
                        if found_ul:
                            break
                
                # Add courses to appropriate years
                for year_key in year_keys:
                    # Avoid duplicates
                    existing_codes = {c['code'] for c in curriculum[year_key]}
                    for course in courses_for_section:
                        if course['code'] not in existing_codes:
                            curriculum[year_key].append(course)
                            existing_codes.add(course['code'])
                
                print(f"    Added {len(courses_for_section)} courses to years {year_keys}")
            
            # Also check for Honours thesis in Honours section (if user wants it included)
            # Look for "An undergraduate Honours thesis" in the page
            honours_section = content_div.find('h3', string=re.compile('Honours', re.IGNORECASE))
            if honours_section:
                # Find Upper-level Requirements in Honours section
                honours_headers = honours_section.find_all_next('h4', limit=10)
                for h4 in honours_headers:
                    if 'upper' in h4.get_text(strip=True).lower() and 'requirements' in h4.get_text(strip=True).lower():
                        # Check if next h3/h4 is reached (end of Honours section)
                        next_h3 = h4.find_next('h3')
                        if next_h3 and next_h3 != honours_section.find_next('h3'):
                            break
                        
                        # Look for ul with Honours thesis
                        for ul in h4.find_next_siblings('ul', limit=1):
                            for li in ul.find_all('li', recursive=False):
                                li_text = li.get_text(strip=True)
                                if 'honours thesis' in li_text.lower() or 'thesis' in li_text.lower():
                                    parsed_courses = self.parse_course_from_text(li_text)
                                    for course in parsed_courses:
                                        if course and course.get('code'):
                                            # Add to years 3 and 4
                                            for year_key in ['3', '4']:
                                                existing_codes = {c['code'] for c in curriculum[year_key]}
                                                if course['code'] not in existing_codes:
                                                    curriculum[year_key].append(course)
                                            print(f"    Added Honours thesis: {course['code']}")
                        break
            
            # Clean up empty years
            curriculum = {k: v for k, v in curriculum.items() if v}
            
            if not any(curriculum.values()):
                print(f"    ⚠️  No courses found for {major_name}")
                return None
            
            return curriculum
            
        except Exception as e:
            print(f"    ❌ Error scraping {major_name}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def get_major_links(self) -> Dict[str, str]:
        """Get all major links from the BA directory page"""
        try:
            print("Fetching BA directory page...")
            response = self.session.get(self.ba_url, timeout=15)
            response.raise_for_status()
            
            # Try lxml first, fallback to html.parser
            try:
                soup = BeautifulSoup(response.content, 'lxml')
            except Exception:
                soup = BeautifulSoup(response.content, 'html.parser')
            
            major_links = {}
            
            # Find links to individual majors
            # Look for links in the content area
            content_area = soup.find('div', class_='field--item') or soup.find('main') or soup
            
            for link in content_area.find_all('a', href=True):
                href = link.get('href', '')
                text = link.get_text(strip=True)
                
                # Check if this looks like a major link
                if text and len(text) > 3 and ('/' in href or href.startswith('/')):
                    full_url = urljoin(self.base_url, href)
                    # Only include if it's a calendar page
                    if 'calendar.ubc.ca' in full_url and 'faculty-arts' in full_url:
                        major_links[text] = full_url
            
            print(f"Found {len(major_links)} potential major links")
            return major_links
            
        except Exception as e:
            print(f"Error fetching major links: {e}")
            return {}
    
    def run(self, specific_major: Optional[str] = None):
        """Main execution method"""
        print("=" * 70)
        print("UBC Arts Curriculum Scraper")
        print("=" * 70)
        
        # Load existing data if file exists
        all_curriculum = {}
        if os.path.exists(self.main_curriculum_file):
            try:
                with open(self.main_curriculum_file, 'r', encoding='utf-8') as f:
                    all_curriculum = json.load(f)
                print(f"Loaded existing data with {len(all_curriculum)} majors")
            except Exception as e:
                print(f"Could not load existing data: {e}")
                all_curriculum = {}
        
        if specific_major:
            # Scrape single major
            print(f"\nScraping specific major: {specific_major}")
            # Construct URL (this is a simplified approach - may need adjustment)
            major_slug = specific_major.lower().replace(' ', '-').replace('&', 'and')
            major_url = f"{self.ba_url}/{major_slug}"
            curriculum = self.scrape_major_requirements(major_url, specific_major)
            if curriculum:
                all_curriculum[specific_major] = curriculum
        else:
            # Scrape all majors
            print("\nFetching list of majors...")
            major_links = self.get_major_links()
            
            if not major_links:
                print("⚠️  No major links found. You may need to scrape individual majors manually.")
                print("   Usage: python scraper/curriculum/scrape_arts_curriculum.py --major 'Anthropology'")
                return
            
            print(f"\nFound {len(major_links)} majors to scrape")
            print("=" * 70)
            
            for major_name, major_url in major_links.items():
                curriculum = self.scrape_major_requirements(major_url, major_name)
                if curriculum:
                    all_curriculum[major_name] = curriculum
                
                # Be polite - add delay between requests
                time.sleep(1)
        
        # Save to JSON
        print("\n" + "=" * 70)
        print("Saving curriculum data...")
        with open(self.main_curriculum_file, 'w', encoding='utf-8') as f:
            json.dump(all_curriculum, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved {len(all_curriculum)} majors to {self.main_curriculum_file}")
        print("=" * 70)


def main():
    """Main entry point"""
    scraper = UBCArtsCurriculumScraper()
    
    # Check for specific major argument
    specific_major = None
    if len(sys.argv) > 1:
        if '--major' in sys.argv:
            idx = sys.argv.index('--major')
            if idx + 1 < len(sys.argv):
                specific_major = sys.argv[idx + 1]
        else:
            # Assume first argument is major name
            specific_major = sys.argv[1]
    
    scraper.run(specific_major)


if __name__ == '__main__':
    main()
