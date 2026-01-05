"""
UBC Computer Science (CPSC) Curriculum Scraper
Special scraper for CPSC that handles the edge case where Year 1 is in a separate table
from Years 2-4.

Usage:
    python scraper/scrape_cpsc_curriculum.py
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

class UBCCPSCCurriculumScraper:
    def __init__(self):
        self.base_url = "https://vancouver.calendar.ubc.ca"
        self.cpsc_url = f"{self.base_url}/faculties-colleges-and-schools/faculty-science/bachelor-science/computer-science"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Output directory
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.output_dir = os.path.join(script_dir, 'src', 'data', 'curriculum', 'science')
        os.makedirs(self.output_dir, exist_ok=True)
    
    def clean_course_code(self, code: str) -> str:
        """Clean course code: Remove _V suffix and normalize spacing"""
        code = re.sub(r'_V\s*', ' ', code.strip())
        code = re.sub(r'\s+', ' ', code)
        return code.strip()
    
    def extract_credits(self, text: str) -> int:
        """Extract credit value from text"""
        if text.strip().isdigit():
            return int(text.strip())
        match = re.search(r'\(?(\d+)\s*(?:credits?|cr\.?)?\)?', text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 3  # Default to 3 credits
    
    def extract_footnotes(self, soup: BeautifulSoup, table_element) -> Dict[str, str]:
        """
        Extract footnotes from the page, typically found after tables or within table rows.
        Returns a dictionary mapping footnote symbols to their text.
        """
        footnotes = {}
        
        # Look for footnote text within the table (rows with colspan="2" or starting with superscript)
        rows = table_element.find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if len(cells) == 1 or (len(cells) > 0 and cells[0].get('colspan') == "2"):
                text = cells[0].get_text(strip=True)
                # Match superscript at start: e.g., "¹ Students without..."
                match = re.match(r'^([¹²³⁴⁵⁶⁷⁸⁹⁰])\s*(.*)', text)
                if match:
                    symbol, note_content = match.groups()
                    footnotes[symbol] = note_content
        
        # Also look for footnotes after the table
        current = table_element
        for _ in range(10):  # Check up to 10 siblings
            current = current.find_next_sibling()
            if current is None:
                break
            
            # Look for text containing footnote symbols
            text = current.get_text()
            
            # Match patterns like "¹ Text", "² Text", etc.
            footnote_pattern = r'([¹²³⁴⁵⁶⁷⁸⁹⁰])\s+(.+)'
            matches = re.findall(footnote_pattern, text)
            
            for symbol, note_text in matches:
                footnotes[symbol] = note_text.strip()
            
            # Also check for numbered footnotes like "1. Text", "2. Text"
            numbered_pattern = r'(\d+)\.\s+(.+)'
            numbered_matches = re.findall(numbered_pattern, text)
            
            for num, note_text in numbered_matches:
                # Map numbers to superscript symbols
                symbol_map = {'1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵'}
                if num in symbol_map:
                    footnotes[symbol_map[num]] = note_text.strip()
        
        return footnotes
    
    def extract_communication_requirement_courses(self, soup: BeautifulSoup) -> str:
        """
        Extract the list of acceptable Communication Requirement courses from the page.
        Common courses: SCIE 113, ENGL 110, ENGL 111, ENGL 112, ENGL 120, ENGL 121
        """
        # Look for text mentioning communication requirement
        page_text = soup.get_text()
        
        # Common communication requirement courses
        common_courses = [
            "SCIE 113", "ENGL 110", "ENGL 111", "ENGL 112", 
            "ENGL 120", "ENGL 121", "WRDS 150"
        ]
        
        # Try to find a section that lists communication requirements
        # Look for patterns like "One of: SCIE 113, ENGL 110, ..."
        comm_pattern = r'(?:communication|writing|english|scie).*?(?:one of|choose|select).*?((?:[A-Z]{2,4}\s+\d{3}[A-Z]?(?:\s*,\s*)?)+)'
        match = re.search(comm_pattern, page_text, re.IGNORECASE)
        
        if match:
            courses_text = match.group(1)
            # Extract course codes
            course_codes = re.findall(r'([A-Z]{2,4}\s+\d{3}[A-Z]?)', courses_text)
            if course_codes:
                return ', '.join(course_codes)
        
        # Fallback to common courses
        return ', '.join(common_courses)
    
    def clean_text_and_extract_notes(self, raw_text: str, footnotes_dict: Dict[str, str]) -> Tuple[str, str]:
        """
        Separates the course text from superscript footnotes.
        Example: 'BIOL_V 112¹' -> Code: 'BIOL 112', Note: 'Students without...'
        Also handles trailing digits: 'MATH 2007' -> 'MATH 200'
        """
        # 1. Identify superscripts
        superscripts = "".join(re.findall(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]', raw_text))
        
        # 2. Strip superscripts and _V from the display text
        clean_text = re.sub(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]', '', raw_text)
        clean_text = self.clean_course_code(clean_text)
        
        # 3. Fix trailing digits in course codes (e.g., "MATH 2007" -> "MATH 200")
        # Pattern: Course code followed by digits that are too long (4+ digits after space)
        course_code_pattern = r'^([A-Z]{2,4})\s+(\d{3})(\d+)(?:\s|$)'
        match = re.match(course_code_pattern, clean_text)
        if match:
            dept = match.group(1)
            course_num = match.group(2)  # Take only first 3 digits
            # Check if the trailing digits are likely superscripts (single digit 1-9)
            trailing = match.group(3)
            if len(trailing) == 1 and trailing in '123456789':
                # Likely a superscript that was parsed as a digit, remove it
                clean_text = re.sub(rf'^{re.escape(dept)}\s+{re.escape(course_num)}{re.escape(trailing)}', 
                                  f'{dept} {course_num}', clean_text)
        
        # 4. Map superscripts to actual footnote text
        found_notes = []
        for char in superscripts:
            if char in footnotes_dict:
                found_notes.append(footnotes_dict[char])
                
        return clean_text, " ".join(found_notes)
    
    def parse_table_for_courses(self, table, footnotes: Dict[str, str] = None, 
                                comm_requirement_courses: str = "") -> Dict[str, List[Dict]]:
        """
        Parse a table element using sticky headers and an early-exit stopping condition.
        Handles superscript footnotes correctly and extracts footnotes from within the table.
        The method automatically detects year headers (<strong>First Year</strong>, etc.) within the table.
        """
        if footnotes is None:
            footnotes = {}
        
        years_data = {
            "1": [],
            "2": [],
            "3": [],
            "4": []
        }
        current_year_key = None  # Will be set when we encounter a year header
        
        # --- Step 1: Pre-parse footnotes inside the table ---
        # These are usually rows with colspan or rows that start with a superscript
        internal_footnotes = {}
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all('td')
            if len(cells) == 1 or (len(cells) > 0 and cells[0].get('colspan') == "2"):
                text = cells[0].get_text(strip=True)
                # Match superscript at start: e.g., "¹ Students without..."
                match = re.match(r'^([¹²³⁴⁵⁶⁷⁸⁹⁰])\s*(.*)', text)
                if match:
                    symbol, note_content = match.groups()
                    internal_footnotes[symbol] = note_content
        
        # Merge external footnotes with internal ones (internal takes precedence)
        all_footnotes = {**footnotes, **internal_footnotes}

        # --- Step 2: Parse Course Rows ---
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if not cells:
                continue
            
            first_cell_text = cells[0].get_text(strip=True)
            first_cell_lower = first_cell_text.lower()

            # Check for Year Headers (look for <strong> tag or year text)
            strong_tag = row.find('strong')
            if strong_tag:
                header_text = strong_tag.get_text(strip=True).lower()
            else:
                header_text = first_cell_lower
            
            if "year" in header_text or "year" in first_cell_lower:
                if "first" in header_text or "first" in first_cell_lower:
                    current_year_key = "1"
                elif "second" in header_text or "second" in first_cell_lower:
                    current_year_key = "2"
                elif "third" in header_text or "third" in first_cell_lower:
                    if "fourth" in header_text or "fourth" in first_cell_lower or "four" in header_text or "four" in first_cell_lower:
                        current_year_key = "3"
                    else:
                        current_year_key = "3"
                elif "fourth" in header_text or "fourth" in first_cell_lower or "four" in header_text or "four" in first_cell_lower:
                    current_year_key = "4"
                continue

            # Early exit if we hit the end
            if "total credits for degree" in first_cell_lower or "credits for degree" in first_cell_lower:
                break
                
            # Skip total rows and the footnote rows we already parsed
            if "total credits" in first_cell_lower or re.match(r'^[¹²³⁴⁵⁶⁷⁸⁹⁰]', first_cell_text):
                continue

            if current_year_key and len(cells) >= 2:
                # Extract Credits from the second column
                credit_text = cells[1].get_text(strip=True)
                credits = self.extract_credits(credit_text) if credit_text else 0
                
                # Skip empty rows (0 credits and empty/whitespace code)
                if credits == 0 and (not first_cell_text or not first_cell_text.strip()):
                    continue
                
                # Clean course code and attach notes
                clean_code, note = self.clean_text_and_extract_notes(first_cell_text, all_footnotes)
                
                # Special case for Communication Requirement
                if "communication requirement" in first_cell_lower or "additional communication requirement" in first_cell_lower:
                    note = comm_requirement_courses
                    clean_code = "Communication Requirement"
                elif "elective" in first_cell_lower:
                    clean_code = "Electives"
                    # Also check for "Arts" or other requirements in the text
                    if 'arts' in first_cell_lower or 'faculty of arts' in first_cell_lower:
                        if note:
                            note += ". " + "At least some credits must be from the Faculty of Arts"
                        else:
                            note = "At least some credits must be from the Faculty of Arts"
                
                years_data[current_year_key].append({
                    "code": clean_code,
                    "credits": credits,
                    "title": "",
                    "notes": note
                })

        return years_data
    
    def scrape_cpsc_curriculum(self) -> Optional[Dict]:
        """
        Scrape Computer Science curriculum.
        Handles multiple separate tables by processing all tables until "Total Credits for Degree" is found.
        """
        print(f"\n  Scraping Computer Science...")
        print(f"    URL: {self.cpsc_url}")
        
        try:
            response = self.session.get(self.cpsc_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract communication requirement courses
            comm_requirement_courses = self.extract_communication_requirement_courses(soup)
            
            # Find all tables in "Degree Requirements" section
            # Look for tables wrapped in figure.responsive-figure-table
            tables = soup.find_all('figure', class_='responsive-figure-table')
            if not tables:
                # Fallback: look for any table
                tables = soup.find_all('table')
            
            print(f"    Found {len(tables)} table(s)")
            
            years_data = {
                "1": [],
                "2": [],
                "3": [],
                "4": []
            }
            
            # Process each table - continue until "Total Credits for Degree" is found
            for table_figure in tables:
                table_text = table_figure.get_text().lower()
                
                # Skip tables that don't look like requirement tables
                if "year" not in table_text and "credits" not in table_text:
                    continue

                # Extract footnotes specifically for this table
                footnotes = self.extract_footnotes(soup, table_figure)
                
                # The parse_table_for_courses logic will detect "First Year", 
                # "Second Year", or "Third and Fourth Year" headers automatically.
                table_years_data = self.parse_table_for_courses(
                    table_figure, 
                    footnotes=footnotes,
                    comm_requirement_courses=comm_requirement_courses
                )
                
                # Merge this table's data into the main years_data object
                for year_key, courses in table_years_data.items():
                    if courses:
                        # Deduplicate: only add if course code isn't already there (except Electives)
                        existing_codes = {c["code"] for c in years_data[year_key] if c["code"] != "Electives"}
                        for course in courses:
                            if course["code"] == "Electives" or course["code"] not in existing_codes:
                                years_data[year_key].append(course)
                                if course["code"] != "Electives":
                                    existing_codes.add(course["code"])

                # CRITICAL FIX: Only stop if the final degree total is reached.
                # Do NOT break on "Total Credits" as it appears in every table.
                if "total credits for degree" in table_text:
                    print(f"    Reached end of degree requirements. Stopping.")
                    break
            
            # Report results
            total_courses = sum(len(courses) for courses in years_data.values())
            print(f"    Extracted {total_courses} courses:")
            for year in ["1", "2", "3", "4"]:
                count = len(years_data[year])
                if count > 0:
                    print(f"      Year {year}: {count} courses")
            
            return years_data
            
        except Exception as e:
            print(f"    Error scraping Computer Science: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def normalize_curriculum_years(self, years_data: Dict) -> Dict:
        """
        Normalize curriculum years by filling missing years based on adjacent years.
        Handles cases where majors combine years (e.g., "Third and Fourth Years").
        """
        y1 = years_data.get("1", [])
        y2 = years_data.get("2", [])
        y3 = years_data.get("3", [])
        y4 = years_data.get("4", [])
        
        # Case 1: 1, 2, and 4 exist -> Copy Year 4 to Year 3
        if y1 and y2 and y4 and not y3:
            years_data["3"] = y4.copy()
            print(f"  [Computer Science] Duplicated Year 4 into Year 3")

        # Case 2: 1, 2, and 3 exist -> Copy Year 3 to Year 4
        elif y1 and y2 and y3 and not y4:
            years_data["4"] = y3.copy()
            print(f"  [Computer Science] Duplicated Year 3 into Year 4")

        # Case 3: 1, 3, and 4 exist -> Copy Year 3 to Year 2
        elif y1 and y3 and y4 and not y2:
            years_data["2"] = y3.copy()
            print(f"  [Computer Science] Duplicated Year 3 into Year 2")
        
        return years_data
    
    def run(self):
        """Main execution method"""
        print("=" * 70)
        print("UBC Computer Science (CPSC) Curriculum Scraper")
        print("=" * 70)
        
        # Scrape CPSC curriculum
        print(f"\n{'='*70}")
        print("Scraping Computer Science curriculum...")
        print(f"{'='*70}")
        
        curriculum = self.scrape_cpsc_curriculum()
        
        if curriculum:
            # Normalize years
            curriculum = self.normalize_curriculum_years(curriculum)
            
            # Load existing science curriculum data
            existing_file = os.path.join(self.output_dir, 'science_curriculum.json')
            all_curriculum = {}
            
            if os.path.exists(existing_file):
                with open(existing_file, 'r', encoding='utf-8') as f:
                    all_curriculum = json.load(f)
            
            # Update or add Computer Science data
            all_curriculum["Computer Science"] = curriculum
            
            # Save updated data
            with open(existing_file, 'w', encoding='utf-8') as f:
                json.dump(all_curriculum, f, indent=2, ensure_ascii=False)
            
            print(f"\n  Updated: {existing_file}")
            print(f"  Computer Science courses extracted:")
            for year in ["1", "2", "3", "4"]:
                count = len(curriculum.get(year, []))
                if count > 0:
                    print(f"    Year {year}: {count} courses")
        else:
            print("\n  Failed to scrape Computer Science curriculum")
        
        print("\n" + "=" * 70)
        print("Scraping Complete!")
        print("=" * 70)


if __name__ == "__main__":
    scraper = UBCCPSCCurriculumScraper()
    scraper.run()

