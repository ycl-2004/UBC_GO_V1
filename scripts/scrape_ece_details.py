"""
ECE Course Details Scraper
Scrapes course descriptions and prerequisites from ECE department website
and enriches existing curriculum JSON files.

Usage:
    python scripts/scrape_ece_details.py [--force] [--clean-only]
    
Options:
    --force      Force re-scraping even if course already has details
    --clean-only Only clean existing prerequisites (remove boilerplate), don't scrape new data
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import random
import os
import sys
from typing import Dict, List, Optional

class ECECourseDetailsScraper:
    def __init__(self, force=False, clean_only=False):
        self.base_url = "https://ece.ubc.ca/courses"
        self.force = force
        self.clean_only = clean_only
        self.session = requests.Session()
        
        # Enhanced headers to bypass security detection
        # Use a realistic, modern browser User-Agent (Chrome on Mac)
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
            'DNT': '1'
        })
        
        # Path to curriculum JSON files
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.curriculum_dir = os.path.join(script_dir, 'src', 'data', 'curriculum', 'applied-science')
        
        # Cache for scraped course data (key: course_code, value: {description, prerequisites})
        self.scraped_data_cache = {}
    
    def clean_prerequisites_text(self, text: str) -> str:
        """
        Clean prerequisites text by removing boilerplate content.
        Handles both single section and combined Prerequisites/Corequisites format.
        """
        if not text:
            return ""
        
        # Split by sections if they exist
        sections = []
        
        # Check if text contains both Prerequisites and Corequisites
        if 'Prerequisites:' in text and ('Corequisites:' in text or 'Co-requisites:' in text):
            # Split into sections
            prereq_match = re.search(r'Prerequisites:\s*(.+?)(?=Corequisites:|Co-requisites:|$)', text, re.IGNORECASE | re.DOTALL)
            coreq_match = re.search(r'(Corequisites|Co-requisites):\s*(.+?)(?=Prerequisites:|$)', text, re.IGNORECASE | re.DOTALL)
            
            if prereq_match:
                prereq_text = prereq_match.group(1).strip()
                prereq_text = self._clean_single_section(prereq_text)
                if prereq_text:
                    sections.append(f"Prerequisites: {prereq_text}")
            
            if coreq_match:
                coreq_text = coreq_match.group(2).strip()
                coreq_text = self._clean_single_section(coreq_text)
                if coreq_text:
                    sections.append(f"Corequisites: {coreq_text}")
            
            return "\n\n".join(sections)
        else:
            # Single section - clean it
            return self._clean_single_section(text)
    
    def _clean_single_section(self, text: str) -> str:
        """
        Clean a single prerequisites/corequisites section.
        """
        if not text:
            return ""
        
        # Remove boilerplate text: cut off at "UBC Course Page" or "Department of Electrical"
        if 'UBC Course Page' in text:
            text = text.split('UBC Course Page')[0].strip()
        elif 'Department of Electrical' in text:
            text = text.split('Department of Electrical')[0].strip()
        
        # Remove common suffixes
        text = re.sub(r'\s*More Information.*$', '', text, flags=re.IGNORECASE)
        
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
        
    def parse_course_code(self, code: str) -> Optional[tuple]:
        """
        Parse course code like 'CPEN 211' or 'ELEC 201' into (subject, number).
        Returns None if not a valid course code.
        """
        if not code or code == "ELECTIVE":
            return None
        
        match = re.match(r'([A-Z]{2,4})\s+(\d{3}[A-Z]?)', code.strip())
        if match:
            subject = match.group(1).upper()
            number = match.group(2)
            return (subject, number)
        return None
    
    def build_course_url(self, subject: str, number: str) -> str:
        """
        Build ECE course URL from subject and number.
        Handles special cases:
        - CPEN 281 / ELEC 281 -> cpen-281-0
        - CPEN 481 / ELEC 481 -> cpen-elec-481
        Example: CPEN 211 -> https://ece.ubc.ca/courses/cpen-211/
        """
        subject_lower = subject.lower()
        number_lower = number.lower()
        
        # Special case: CPEN 281 and ELEC 281 share the same page
        if number == '281' and subject in ['CPEN', 'ELEC']:
            return f"{self.base_url}/cpen-281-0/"
        
        # Special case: CPEN 481 and ELEC 481 share the same page
        if number == '481' and subject in ['CPEN', 'ELEC']:
            return f"{self.base_url}/cpen-elec-481/"
        
        # Default pattern
        return f"{self.base_url}/{subject_lower}-{number_lower}/"
    
    def extract_description(self, soup: BeautifulSoup) -> str:
        """
        Extract the main paragraph text located immediately under the Course Title.
        Based on ECE website structure, the description is typically in a paragraph
        after the h1 title and before the "credits" line.
        """
        description = ""
        
        # Try to find the course title first (usually in h1)
        title = soup.find('h1')
        if title:
            # Look for the first paragraph after the title
            # Skip over any h2/h3 elements (like course name in italics)
            current = title.find_next_sibling()
            while current:
                if current.name == 'p':
                    text = current.get_text(strip=True)
                    # Skip if it's just "X credits" or contains links
                    if text and len(text) > 20 and 'credits' not in text.lower() and 'UBC Course Page' not in text:
                        description = text
                        break
                elif current.name in ['h1', 'h2']:
                    # Check if this is the course name (h2 with italic)
                    if current.name == 'h2':
                        # Skip the course name h2, continue to next paragraph
                        pass
                    else:
                        # Hit another main header, stop looking
                        break
                elif current.name == 'h3':
                    # Hit a section header, stop looking
                    break
                current = current.find_next_sibling()
        
        # If not found, try finding paragraphs in the main content
        if not description:
            # Look for paragraphs that contain substantial text
            for p in soup.find_all('p'):
                text = p.get_text(strip=True)
                # Skip credits line, links, and prerequisite sections
                if (text and len(text) > 30 and 
                    'credits' not in text.lower() and 
                    'UBC Course Page' not in text and
                    'prerequisite' not in text.lower() and
                    'More Information' not in text):
                    description = text
                    break
        
        return description.strip()
    
    def extract_prerequisites(self, soup: BeautifulSoup) -> str:
        """
        Extract prerequisites and corequisites from the course page.
        Handles both sections and combines them with clear headers.
        """
        prerequisites_text = ""
        corequisites_text = ""
        
        # Strategy 1: Look for elements containing prerequisite/corequisite keywords
        # Get all text from the bottom section of the page (usually in paragraphs or divs)
        full_text_block = ""
        
        # Try to find the section containing prerequisites/corequisites
        # Look for paragraphs or divs that contain these keywords
        for elem in soup.find_all(['p', 'div']):
            text = elem.get_text()
            if re.search(r'(Prerequisite[s]?|Corequisite[s]?|Co-requisite[s]?)', text, re.IGNORECASE):
                full_text_block = text
                break
        
        # If not found in individual elements, try to get text from strong/b tags and their parents
        if not full_text_block:
            for tag in soup.find_all(['strong', 'b']):
                tag_text = tag.get_text(strip=True)
                if re.search(r'(Prerequisite[s]?|Corequisite[s]?|Co-requisite[s]?)', tag_text, re.IGNORECASE):
                    parent = tag.parent
                    if parent:
                        # Get all siblings and parent text
                        full_text_block = parent.get_text()
                        break
        
        # If still not found, search more broadly
        if not full_text_block:
            # Look for any element containing both keywords
            for elem in soup.find_all(['p', 'div', 'li']):
                text = elem.get_text()
                if 'Prerequisite' in text or 'Corequisite' in text or 'Co-requisite' in text:
                    full_text_block = text
                    break
        
        if not full_text_block:
            return ""
        
        # Clean up the text block first
        full_text_block = re.sub(r'\s+', ' ', full_text_block)
        
        # Extract Prerequisites section
        prereq_match = re.search(r'Prerequisite[s]?[:]?\s*(.+?)(?=Corequisite[s]?[:]|Co-requisite[s]?[:]|UBC Course Page|Department of Electrical|$)', 
                                 full_text_block, re.IGNORECASE | re.DOTALL)
        if prereq_match:
            prerequisites_text = prereq_match.group(1).strip()
            # Clean up
            prerequisites_text = re.sub(r'\s+', ' ', prerequisites_text)
            prerequisites_text = re.sub(r'\s*More Information.*$', '', prerequisites_text, flags=re.IGNORECASE)
        
        # Extract Corequisites section
        coreq_match = re.search(r'(Corequisite[s]?|Co-requisite[s]?)[:]?\s*(.+?)(?=UBC Course Page|Department of Electrical|$)', 
                                full_text_block, re.IGNORECASE | re.DOTALL)
        if coreq_match:
            corequisites_text = coreq_match.group(2).strip()
            # Clean up
            corequisites_text = re.sub(r'\s+', ' ', corequisites_text)
            corequisites_text = re.sub(r'\s*More Information.*$', '', corequisites_text, flags=re.IGNORECASE)
        
        # Combine both sections with clear headers
        result_parts = []
        
        if prerequisites_text:
            # Final cleanup for prerequisites
            if 'UBC Course Page' in prerequisites_text:
                prerequisites_text = prerequisites_text.split('UBC Course Page')[0].strip()
            elif 'Department of Electrical' in prerequisites_text:
                prerequisites_text = prerequisites_text.split('Department of Electrical')[0].strip()
            result_parts.append(f"Prerequisites: {prerequisites_text}")
        
        if corequisites_text:
            # Final cleanup for corequisites
            if 'UBC Course Page' in corequisites_text:
                corequisites_text = corequisites_text.split('UBC Course Page')[0].strip()
            elif 'Department of Electrical' in corequisites_text:
                corequisites_text = corequisites_text.split('Department of Electrical')[0].strip()
            result_parts.append(f"Corequisites: {corequisites_text}")
        
        # If we only found one section, try to extract it more carefully
        if not result_parts and full_text_block:
            # Fallback: try to extract just prerequisites if corequisites weren't found
            if 'Prerequisite' in full_text_block and 'Corequisite' not in full_text_block:
                match = re.search(r'Prerequisite[s]?[:]?\s*(.+?)(?=UBC Course Page|Department of Electrical|$)', 
                                 full_text_block, re.IGNORECASE | re.DOTALL)
                if match:
                    prereq_text = match.group(1).strip()
                    prereq_text = re.sub(r'\s+', ' ', prereq_text)
                    if 'UBC Course Page' in prereq_text:
                        prereq_text = prereq_text.split('UBC Course Page')[0].strip()
                    elif 'Department of Electrical' in prereq_text:
                        prereq_text = prereq_text.split('Department of Electrical')[0].strip()
                    result_parts.append(f"Prerequisites: {prereq_text}")
        
        return "\n\n".join(result_parts).strip()
    
    def scrape_course_details(self, subject: str, number: str, course_code: str = None) -> Dict[str, str]:
        """
        Scrape course details from ECE website.
        Returns dict with 'description' and 'prerequisites' fields.
        Uses cache to avoid re-scraping the same course.
        """
        # Generate course code if not provided
        if not course_code:
            course_code = f"{subject} {number}"
        
        # Check cache first
        if course_code in self.scraped_data_cache:
            print(f"  Using cached data for {course_code}")
            return self.scraped_data_cache[course_code]
        
        url = self.build_course_url(subject, number)
        result = {
            'description': '',
            'prerequisites': ''
        }
        
        try:
            # Add random delay to avoid detection (2-5 seconds)
            delay = random.uniform(2, 5)
            print(f"  Fetching: {url} (waiting {delay:.1f}s to avoid detection...)")
            time.sleep(delay)
            
            response = self.session.get(url, timeout=15)
            
            # Validation: Check if response contains blocking messages
            # Check both response text and status code
            response_text = response.text.lower()
            blocking_phrases = [
                'your request has been blocked',
                'security system',
                'potentially automated',
                'access denied',
                'blocked by security',
                'security check',
                'automated access',
                'suspicious activity',
                'please verify you are human'
            ]
            
            # Check for blocking messages in response
            if any(phrase in response_text for phrase in blocking_phrases):
                print(f"    ⚠️  BLOCKED: Request was blocked by UBC security system")
                print(f"    ⚠️  Response contains security blocking message")
                print(f"    ⚠️  Skipping {course_code} to avoid further blocks")
                print(f"    ⚠️  This may indicate the site has detected automated access")
                # Cache empty result to avoid re-trying
                self.scraped_data_cache[course_code] = result
                return result
            
            # Additional check: if response is suspiciously short or contains error patterns
            if len(response.text) < 500 and ('error' in response_text or 'blocked' in response_text):
                print(f"    ⚠️  BLOCKED: Suspicious response detected (too short or contains error)")
                print(f"    ⚠️  Skipping {course_code}")
                self.scraped_data_cache[course_code] = result
                return result
            
            # Handle 404 gracefully
            if response.status_code == 404:
                print(f"    → 404: Course page not found, skipping")
                # Cache the empty result to avoid re-trying
                self.scraped_data_cache[course_code] = result
                return result
            
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract description
            description = self.extract_description(soup)
            if description:
                result['description'] = description
                print(f"    → Description: {description[:80]}...")
            
            # Extract prerequisites
            prerequisites = self.extract_prerequisites(soup)
            if prerequisites:
                result['prerequisites'] = prerequisites
                print(f"    → Prerequisites: {prerequisites[:100]}...")
            else:
                print(f"    → No prerequisites found")
            
            # Cache the result
            self.scraped_data_cache[course_code] = result
            
            # Additional delay after successful request (randomized to avoid detection)
            time.sleep(random.uniform(1, 2))
            
        except requests.exceptions.RequestException as e:
            print(f"    → Error fetching {url}: {e}")
            # Cache empty result to avoid re-trying
            self.scraped_data_cache[course_code] = result
        except Exception as e:
            print(f"    → Unexpected error: {e}")
            # Cache empty result to avoid re-trying
            self.scraped_data_cache[course_code] = result
        
        return result
    
    def process_course(self, course: Dict) -> bool:
        """
        Process a single course object. Returns True if course was updated.
        """
        code = course.get('code', '')
        parsed = self.parse_course_code(code)
        
        if not parsed:
            return False
        
        subject, number = parsed
        
        # Only process ELEC and CPEN courses
        if subject not in ['ELEC', 'CPEN']:
            return False
        
        updated = False
        
        # Clean-only mode: just clean existing prerequisites
        if self.clean_only:
            if course.get('prerequisites'):
                original = course['prerequisites']
                cleaned = self.clean_prerequisites_text(original)
                if cleaned != original:
                    course['prerequisites'] = cleaned
                    print(f"  Cleaned prerequisites for {code}")
                    updated = True
                else:
                    print(f"  Skipping {code}: prerequisites already clean")
            else:
                print(f"  Skipping {code}: no prerequisites to clean")
            return updated
        
        # Check if we should skip (unless force mode)
        if not self.force and course.get('description') and course.get('prerequisites'):
            # Even if skipping, clean existing prerequisites if they have boilerplate
            if course.get('prerequisites'):
                original = course['prerequisites']
                cleaned = self.clean_prerequisites_text(original)
                if cleaned != original:
                    course['prerequisites'] = cleaned
                    print(f"  Cleaned prerequisites for {code} (skipping re-scrape)")
                    updated = True
                else:
                    print(f"  Skipping {code}: already has details")
            else:
                print(f"  Skipping {code}: already has details")
            return updated
        
        print(f"  Processing {code}...")
        details = self.scrape_course_details(subject, number, code)
        
        # Update course object
        if details['description']:
            course['description'] = details['description']
            updated = True
        if details['prerequisites']:
            # Clean the scraped prerequisites
            cleaned_prereqs = self.clean_prerequisites_text(details['prerequisites'])
            course['prerequisites'] = cleaned_prereqs
            updated = True
        
        return updated
    
    def load_json_file(self, filename: str) -> Optional[Dict]:
        """Load a JSON curriculum file."""
        filepath = os.path.join(self.curriculum_dir, filename)
        
        if not os.path.exists(filepath):
            print(f"Error: File not found: {filepath}")
            return None
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return None
    
    def save_json_file(self, data: Dict, filename: str):
        """Save a JSON curriculum file."""
        filepath = os.path.join(self.curriculum_dir, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"  Saved: {filepath}")
        except Exception as e:
            print(f"Error saving {filename}: {e}")
    
    def process_curriculum_file(self, filename: str):
        """
        Process a curriculum JSON file and enrich ELEC/CPEN courses.
        """
        print(f"\n{'='*60}")
        print(f"Processing: {filename}")
        print(f"{'='*60}")
        
        data = self.load_json_file(filename)
        if not data:
            return
        
        # Track statistics
        total_courses = 0
        processed_courses = 0
        updated_courses = 0
        
        # Iterate through all courses in all years and terms
        for year_data in data.get('years', []):
            for term_data in year_data.get('terms', []):
                for course in term_data.get('courses', []):
                    total_courses += 1
                    
                    # Check if this is an ELEC or CPEN course
                    code = course.get('code', '')
                    parsed = self.parse_course_code(code)
                    
                    if parsed and parsed[0] in ['ELEC', 'CPEN']:
                        processed_courses += 1
                        if self.process_course(course):
                            updated_courses += 1
        
        print(f"\nSummary for {filename}:")
        print(f"  Total courses: {total_courses}")
        print(f"  ELEC/CPEN courses: {processed_courses}")
        print(f"  Updated courses: {updated_courses}")
        
        # Save the updated file
        if updated_courses > 0:
            self.save_json_file(data, filename)
        else:
            print(f"  No updates needed, skipping save")
    
    def run(self):
        """Main execution method"""
        print("=" * 60)
        print("ECE Course Details Scraper")
        print("=" * 60)
        if self.force:
            print("Mode: FORCE (re-scraping all courses)")
        elif self.clean_only:
            print("Mode: CLEAN-ONLY (cleaning existing prerequisites)")
        else:
            print("Mode: NORMAL (skip courses with existing details)")
        print(f"Curriculum directory: {self.curriculum_dir}")
        print("Using cache to avoid re-scraping duplicate courses")
        print("=" * 60)
        
        # Get all JSON files in the directory
        if not os.path.exists(self.curriculum_dir):
            print(f"Error: Directory not found: {self.curriculum_dir}")
            return
        
        json_files = [f for f in os.listdir(self.curriculum_dir) if f.endswith('.json')]
        json_files.sort()  # Process in alphabetical order
        
        if not json_files:
            print("No JSON files found in curriculum directory")
            return
        
        print(f"\nFound {len(json_files)} JSON files to process:")
        for f in json_files:
            print(f"  - {f}")
        
        total_scraped = 0
        total_updated = 0
        
        # Process all JSON files
        for filename in json_files:
            self.process_curriculum_file(filename)
            time.sleep(0.5)  # Brief pause between files
        
        # Print cache statistics
        print(f"\n{'='*60}")
        print("Cache Statistics:")
        print(f"  Total unique courses scraped: {len(self.scraped_data_cache)}")
        print(f"  Courses with descriptions: {sum(1 for d in self.scraped_data_cache.values() if d.get('description'))}")
        print(f"  Courses with prerequisites: {sum(1 for d in self.scraped_data_cache.values() if d.get('prerequisites'))}")
        print(f"{'='*60}")
        print("Scraping Complete!")
        print(f"{'='*60}")


if __name__ == "__main__":
    # Parse command line arguments
    force = '--force' in sys.argv
    clean_only = '--clean-only' in sys.argv
    
    scraper = ECECourseDetailsScraper(force=force, clean_only=clean_only)
    scraper.run()

