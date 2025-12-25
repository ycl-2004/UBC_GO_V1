"""
UBC Engineering Curriculum Scraper
Scrapes engineering curriculum data from UBC Academic Calendar and generates JSON files
for each engineering major.

Usage:
    python scripts/scrape_ubc_engineering.py
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
import os
from typing import Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

class UBCEngineeringScraper:
    def __init__(self):
        self.base_url = "https://vancouver.calendar.ubc.ca"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.common_year_1 = []
        self.output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 
                                       'src', 'data', 'curriculum', 'applied-science')
        
        # Ensure output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
    def clean_course_code(self, code: str) -> str:
        """
        Clean course code:
        - Remove _V suffix (e.g., 'APSC_V 100' -> 'APSC 100')
        - Remove footnote numbers (e.g., 'APSC 1011' -> 'APSC 101')
        """
        # Remove _V suffix
        code = re.sub(r'_V\s*', ' ', code.strip())
        # Clean up multiple spaces
        code = re.sub(r'\s+', ' ', code)
        return code.strip()
    
    def extract_credits(self, text: str) -> int:
        """Extract credit value from text"""
        # Try to find just a number (for table cells that only contain credits)
        if text.strip().isdigit():
            return int(text.strip())
        # Look for patterns like "(3)", "3 credits", "3 cr"
        match = re.search(r'\(?(\d+)\s*(?:credits?|cr\.?)?\)?', text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        return 3  # Default to 3 credits if not found
    
    def parse_table_for_courses(self, table, year_hint: str = None) -> Tuple[str, List[Dict]]:
        """
        Parse a table element to extract course information.
        Returns (year_label, courses) tuple.
        """
        courses = []
        current_year = year_hint
        rows = table.find_all('tr')
        
        for row in rows:
            cells = row.find_all(['td', 'th'])
            if len(cells) >= 1:
                # Get text from first cell
                first_cell = cells[0]
                
                # Remove superscript elements before getting text
                for sup in first_cell.find_all('sup'):
                    sup.decompose()
                
                first_text = first_cell.get_text(strip=True).lower()
                
                # Check if this row is a year header
                if 'second year' in first_text or 'year 2' in first_text:
                    current_year = "Year 2"
                    continue
                elif 'third year' in first_text or 'year 3' in first_text:
                    current_year = "Year 3"
                    continue
                elif 'fourth year' in first_text or 'year 4' in first_text:
                    current_year = "Year 4"
                    continue
                elif 'first year' in first_text or 'year 1' in first_text:
                    current_year = "Year 1"
                    continue
                elif 'total' in first_text:
                    continue  # Skip total rows
                
                # Get credits from second cell if available
                credits_text = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                course_text = first_cell.get_text(strip=True)
                
                # Handle electives and complementary studies
                if 'elective' in course_text.lower() or 'complementary' in course_text.lower():
                    credits = self.extract_credits(credits_text)
                    courses.append({
                        "code": "ELECTIVE",
                        "title": course_text,
                        "credits": credits,
                        "year": current_year
                    })
                    continue
                
                # Try to match course code patterns:
                # 1. "APSC_V 100" format (UBC calendar uses _V)
                # 2. "APSC 100" format (standard)
                course_match = re.search(r'([A-Z]{2,4})(?:_V)?\s*(\d{3}[A-Z]?)', course_text)
                
                if course_match:
                    dept = course_match.group(1)
                    num = course_match.group(2)
                    code = f"{dept} {num}"
                    code = self.clean_course_code(code)
                    credits = self.extract_credits(credits_text)
                    
                    # Extract title (anything after the course code)
                    title = course_text
                    title = re.sub(r'[A-Z]{2,4}(?:_V)?\s*\d{3}[A-Z]?', '', title).strip()
                    
                    courses.append({
                        "code": code,
                        "title": title,
                        "credits": credits,
                        "year": current_year
                    })
        
        return (current_year, courses)
    
    def scrape_standard_first_year(self) -> List[Dict]:
        """Scrape standard first year courses that apply to all engineering majors"""
        url = f"{self.base_url}/faculties-colleges-and-schools/faculty-applied-science/bachelor-applied-science/curriculum-and-first-year"
        
        print(f"Scraping standard first year courses from: {url}")
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            courses = []
            
            # Find all tables (they may be in figure.responsive-figure-table or standalone)
            tables = soup.find_all('table')
            print(f"  Found {len(tables)} tables")
            
            for table in tables:
                # Check if this table contains first year courses
                table_text = table.get_text().lower()
                if 'first year' in table_text and ('apsc' in table_text or 'math' in table_text):
                    print(f"  Found First Year Curriculum table")
                    _, extracted = self.parse_table_for_courses(table, "Year 1")
                    # Only take courses that look like first year courses
                    # Exclude CHEM 121 (conditional course for students with transfer/AP/IB credits)
                    excluded_courses = {"CHEM 121"}
                    for course in extracted:
                        if course["code"] in excluded_courses:
                            continue
                        if course["code"] in ["ELECTIVE"] or \
                           course["code"].startswith(('APSC', 'MATH', 'PHYS', 'CHEM', 'WRDS', 'STAT')):
                            courses.append(course)
                    break
            
            # Remove duplicates
            seen = set()
            unique_courses = []
            for course in courses:
                if course["code"] not in seen:
                    seen.add(course["code"])
                    unique_courses.append(course)
            
            print(f"  Found {len(unique_courses)} first year courses:")
            for c in unique_courses:
                print(f"    - {c['code']} ({c['credits']} credits)")
            
            return unique_courses
            
        except Exception as e:
            print(f"  Error scraping first year: {e}")
            import traceback
            traceback.print_exc()
            return self.get_default_first_year()
    
    def get_default_first_year(self) -> List[Dict]:
        """Return default first year courses based on UBC calendar"""
        return [
            {"code": "APSC 100", "title": "Introduction to Engineering I", "credits": 3},
            {"code": "APSC 101", "title": "Introduction to Engineering II", "credits": 3},
            {"code": "APSC 160", "title": "Introduction to Computation in Engineering Design", "credits": 3},
            {"code": "CHEM 154", "title": "Chemistry for Engineering", "credits": 3},
            {"code": "WRDS 150", "title": "Writing and Research in the Disciplines", "credits": 3},
            {"code": "MATH 100", "title": "Differential Calculus with Applications to Physical Sciences and Engineering", "credits": 3},
            {"code": "MATH 101", "title": "Integral Calculus with Applications to Physical Sciences and Engineering", "credits": 3},
            {"code": "MATH 152", "title": "Linear Systems", "credits": 3},
            {"code": "PHYS 157", "title": "Introductory Physics for Engineers I", "credits": 3},
            {"code": "PHYS 158", "title": "Introductory Physics for Engineers II", "credits": 3},
            {"code": "PHYS 159", "title": "Introductory Physics Laboratory for Engineers", "credits": 1},
            {"code": "PHYS 170", "title": "Mechanics I", "credits": 3},
            {"code": "ELECTIVE", "title": "Complementary Studies electives", "credits": 3},
        ]
    
    def get_undergraduate_majors_list(self) -> List[Tuple[str, str]]:
        """Return the list of undergraduate engineering majors to scrape"""
        base = f"{self.base_url}/faculties-colleges-and-schools/faculty-applied-science/bachelor-applied-science"
        return [
            # Skip Biomedical - has different first year
            ("Chemical and Biological Engineering", f"{base}/chemical-and-biological-engineering"),
            ("Civil Engineering", f"{base}/civil-engineering"),
            # ECE page is handled specially - skip here
            # ("Electrical and Computer Engineering", f"{base}/electrical-and-computer-engineering"),
            ("Engineering Physics", f"{base}/engineering-physics"),
            ("Environmental Engineering", f"{base}/environmental-engineering"),
            ("Geological Engineering", f"{base}/geological-engineering"),
            ("Integrated Engineering", f"{base}/integrated-engineering"),
            ("Manufacturing Engineering", f"{base}/manufacturing-engineering"),
            ("Materials Engineering", f"{base}/materials-engineering"),
            ("Mechanical Engineering", f"{base}/mechanical-engineering"),
            ("Mining Engineering", f"{base}/mining-engineering"),
        ]
    
    def scrape_biomedical_engineering(self) -> Optional[Dict]:
        """
        Special scraper for Biomedical Engineering which has:
        1. Unique first year (Pre-Biomedical Engineering STT)
        2. Years 2-4 from the Biomedical Engineering page
        """
        url = f"{self.base_url}/faculties-colleges-and-schools/faculty-applied-science/bachelor-applied-science/biomedical-engineering"
        
        print(f"\n[Special] Scraping Biomedical Engineering...")
        print(f"  URL: {url}")
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # ========================================
            # 1. FIRST YEAR - Pre-Biomedical Engineering STT
            # ========================================
            print("\n  Processing First Year (Pre-Biomedical Engineering STT)...")
            bmeg_year1 = []
            
            # Find the "First Year - Pre-Biomedical Engineering Standardized Timetable" table
            # Check both direct tables and tables within figure elements
            tables_to_check = soup.find_all('table')
            # Also check tables within figure elements
            for figure in soup.find_all('figure'):
                table = figure.find('table')
                if table and table not in tables_to_check:
                    tables_to_check.append(table)
            
            for table in tables_to_check:
                table_text = table.get_text()
                if 'Pre-Biomedical Engineering' in table_text or 'BMEG_V 101' in table_text or 'BMEG 101' in table_text:
                    print(f"    Found Pre-BME STT table")
                    _, courses = self.parse_table_for_courses(table, "Year 1")
                    bmeg_year1 = courses
                    print(f"    Found {len(bmeg_year1)} first year courses")
                    for c in bmeg_year1:
                        print(f"      - {c.get('code')} ({c.get('credits')} credits)")
                    break
            
            # If not found, use default BME first year based on calendar
            if not bmeg_year1:
                print("    Using default Pre-BME STT courses...")
                bmeg_year1 = [
                    {"code": "APSC 100", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "APSC 160", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "BMEG 101", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "BMEG 102", "title": "", "credits": 2, "year": "Year 1"},
                    {"code": "CHEM 121", "title": "", "credits": 4, "year": "Year 1"},
                    {"code": "CHEM 123", "title": "", "credits": 4, "year": "Year 1"},
                    {"code": "MATH 100", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "MATH 101", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "MATH 152", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "PHYS 157", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "PHYS 158", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "PHYS 170", "title": "", "credits": 3, "year": "Year 1"},
                    {"code": "WRDS 150", "title": "", "credits": 3, "year": "Year 1"},
                ]
            
            # ========================================
            # 2. YEARS 2-4 - 2022W Second Year Entry or Later
            # ========================================
            print("\n  Processing Years 2-4 (2022W Second Year Entry or Later)...")
            bmeg_year2 = []
            bmeg_year3 = []
            bmeg_year4 = []
            
            # Find the "2022W Second Year Entry or Later" section
            section_header = None
            for h in soup.find_all(['h2', 'h3', 'h4']):
                text = h.get_text()
                if '2022W' in text and ('Second Year' in text or 'Entry' in text):
                    section_header = h
                    print(f"    Found 2022W section header")
                    break
            
            if section_header:
                # Find all tables after this header (including those in figure elements)
                current = section_header.find_next_sibling()
                while current:
                    # Check for direct tables
                    if current.name == 'table':
                        _, courses = self.parse_table_for_courses(current)
                        for c in courses:
                            year = c.get("year")
                            if year == "Year 2":
                                bmeg_year2.append(c)
                            elif year == "Year 3":
                                bmeg_year3.append(c)
                            elif year == "Year 4":
                                bmeg_year4.append(c)
                    # Check for tables within figure elements
                    elif current.name == 'figure':
                        table = current.find('table')
                        if table:
                            _, courses = self.parse_table_for_courses(table)
                            for c in courses:
                                year = c.get("year")
                                if year == "Year 2":
                                    bmeg_year2.append(c)
                                elif year == "Year 3":
                                    bmeg_year3.append(c)
                                elif year == "Year 4":
                                    bmeg_year4.append(c)
                    elif current.name in ['h2', 'h3', 'h4']:
                        # Stop if we hit another major section
                        header_text = current.get_text()
                        if 'Program Requirements' not in header_text and '2022W' not in header_text and 'Biomedical' not in header_text:
                            # Check if this is a different program section
                            if any(word in header_text for word in ['Chemical', 'Civil', 'Computer', 'Electrical', 'Engineering Physics']):
                                break
                    current = current.find_next_sibling()
            
            # Also try finding tables by looking for "Second Year", "Third Year", "Fourth Year" headers
            for header in soup.find_all(['h3', 'h4', 'h5']):
                header_text = header.get_text(strip=True).lower()
                year_key = None
                
                if 'second year' in header_text and '2022W' in header.get_text():
                    year_key = "Year 2"
                elif 'third year' in header_text:
                    year_key = "Year 3"
                elif 'fourth year' in header_text:
                    year_key = "Year 4"
                
                if year_key:
                    # Look for table after this header (check both direct tables and figure elements)
                    next_elem = header.find_next_sibling()
                    while next_elem:
                        if next_elem.name == 'table':
                            _, courses = self.parse_table_for_courses(next_elem, year_key)
                            for c in courses:
                                if c.get("year") == year_key:
                                    if year_key == "Year 2":
                                        bmeg_year2.append(c)
                                    elif year_key == "Year 3":
                                        bmeg_year3.append(c)
                                    elif year_key == "Year 4":
                                        bmeg_year4.append(c)
                            break
                        elif next_elem.name == 'figure':
                            table = next_elem.find('table')
                            if table:
                                _, courses = self.parse_table_for_courses(table, year_key)
                                for c in courses:
                                    if c.get("year") == year_key:
                                        if year_key == "Year 2":
                                            bmeg_year2.append(c)
                                        elif year_key == "Year 3":
                                            bmeg_year3.append(c)
                                        elif year_key == "Year 4":
                                            bmeg_year4.append(c)
                                break
                        elif next_elem.name in ['h2', 'h3', 'h4', 'h5']:
                            # Hit another header, stop looking
                            break
                        next_elem = next_elem.find_next_sibling()
            
            # Remove duplicates
            def deduplicate_courses(course_list):
                seen = set()
                unique = []
                for c in course_list:
                    code = c.get("code", "")
                    if code and code not in seen:
                        seen.add(code)
                        unique.append(c)
                return unique
            
            bmeg_year2 = deduplicate_courses(bmeg_year2)
            bmeg_year3 = deduplicate_courses(bmeg_year3)
            bmeg_year4 = deduplicate_courses(bmeg_year4)
            
            print(f"    Year 2: {len(bmeg_year2)} courses")
            print(f"    Year 3: {len(bmeg_year3)} courses")
            print(f"    Year 4: {len(bmeg_year4)} courses")
            
            # Build Biomedical Engineering curriculum
            bmeg_curriculum = self.build_curriculum_json(
                "Biomedical Engineering",
                bmeg_year1,
                bmeg_year2,
                bmeg_year3,
                bmeg_year4
            )
            
            # Update notes to reflect unique first year
            bmeg_curriculum["notes"] = "UBC Applied Science (Engineering) - Biomedical Engineering curriculum outline. First year uses Pre-Biomedical Engineering Standardized Timetable (PBME STT) which differs from standard engineering first year."
            
            return bmeg_curriculum
            
        except Exception as e:
            print(f"  Error scraping Biomedical Engineering: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def scrape_ece_page(self) -> List[Dict]:
        """
        Special scraper for ECE page which contains 3 programs:
        - Computer Engineering
        - Electrical Engineering
        - Biomedical Engineering Option
        
        Returns a list of curriculum dicts for each program.
        """
        url = f"{self.base_url}/faculties-colleges-and-schools/faculty-applied-science/bachelor-applied-science/electrical-and-computer-engineering"
        
        print(f"\n[Special] Scraping ECE page for 3 programs...")
        print(f"  URL: {url}")
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            results = []
            
            # ========================================
            # 1. ELECTRICAL ENGINEERING
            # ========================================
            print("\n  Processing Electrical Engineering...")
            elec_year2 = []
            elec_year3 = []
            elec_year4 = []
            
            # Find Second Year header and get "For Electrical Engineering" table
            second_year_header = None
            for h in soup.find_all('h3'):
                if 'Second Year' in h.get_text():
                    second_year_header = h
                    break
            
            if second_year_header:
                # Find tables/figures in Second Year section
                current = second_year_header.find_next_sibling()
                while current and current.name != 'h3':
                    if current.name == 'figure':
                        # Check if this is the Electrical Engineering table (first table)
                        table = current.find('table')
                        if table:
                            text = table.get_text()
                            if 'For Electrical Engin' in text and 'For Computer' not in text:
                                _, courses = self.parse_table_for_courses(table, "Year 2")
                                elec_year2 = [c for c in courses if c.get("year")]
                                print(f"    Year 2: {len(elec_year2)} courses")
                                break
                    current = current.find_next_sibling()
            
            # Find "Electrical Engineering" h3 header for Year 3 & 4
            elec_header = None
            for h in soup.find_all('h3'):
                text = h.get_text(strip=True)
                if text == 'Electrical Engineering':
                    elec_header = h
                    break
            
            if elec_header:
                # Get the next figure which contains Year 3 & 4
                current = elec_header.find_next_sibling()
                while current and current.name not in ['h3', 'h4']:
                    if current.name == 'figure':
                        table = current.find('table')
                        if table:
                            _, courses = self.parse_table_for_courses(table)
                            for c in courses:
                                year = c.get("year")
                                if year == "Year 3":
                                    elec_year3.append(c)
                                elif year == "Year 4":
                                    elec_year4.append(c)
                    current = current.find_next_sibling()
            
            print(f"    Year 3: {len(elec_year3)} courses")
            print(f"    Year 4: {len(elec_year4)} courses")
            
            # Build Electrical Engineering curriculum
            elec_curriculum = self.build_curriculum_json(
                "Electrical Engineering",
                self.common_year_1.copy(),
                elec_year2,
                elec_year3,
                elec_year4
            )
            results.append(("electrical-engineering", elec_curriculum))
            
            # ========================================
            # 2. COMPUTER ENGINEERING
            # ========================================
            print("\n  Processing Computer Engineering...")
            cpen_year2 = []
            cpen_year3 = []
            cpen_year4 = []
            
            # Find the "2023W or later" table for Computer Engineering Year 2
            if second_year_header:
                current = second_year_header.find_next_sibling()
                table_count = 0
                while current and current.name != 'h3':
                    if current.name == 'figure':
                        table = current.find('table')
                        if table:
                            text = table.get_text()
                            # Look for the 2023W table (should be 3rd table or has "2023W" in text)
                            if 'For Computer' in text and '2023W' in text:
                                _, courses = self.parse_table_for_courses(table, "Year 2")
                                cpen_year2 = [c for c in courses if c.get("year")]
                                print(f"    Year 2 (2023W+): {len(cpen_year2)} courses")
                                break
                        table_count += 1
                    current = current.find_next_sibling()
            
            # Find "Computer Engineering" h3 header for Year 3 & 4
            cpen_header = None
            for h in soup.find_all('h3'):
                text = h.get_text(strip=True)
                if text == 'Computer Engineering':
                    cpen_header = h
                    break
            
            if cpen_header:
                current = cpen_header.find_next_sibling()
                while current and current.name != 'h3':
                    if current.name == 'figure':
                        table = current.find('table')
                        if table:
                            _, courses = self.parse_table_for_courses(table)
                            for c in courses:
                                year = c.get("year")
                                if year == "Year 3":
                                    cpen_year3.append(c)
                                elif year == "Year 4":
                                    cpen_year4.append(c)
                    current = current.find_next_sibling()
            
            print(f"    Year 3: {len(cpen_year3)} courses")
            print(f"    Year 4: {len(cpen_year4)} courses")
            
            # Build Computer Engineering curriculum
            cpen_curriculum = self.build_curriculum_json(
                "Computer Engineering",
                self.common_year_1.copy(),
                cpen_year2,
                cpen_year3,
                cpen_year4
            )
            results.append(("computer-engineering", cpen_curriculum))
            
            return results
            
        except Exception as e:
            print(f"  Error scraping ECE page: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def build_curriculum_json(self, program_name: str, year1: List[Dict], year2: List[Dict], 
                              year3: List[Dict], year4: List[Dict]) -> Dict:
        """Build the curriculum JSON structure from year data"""
        years_data = {
            "Year 1": year1,
            "Year 2": year2,
            "Year 3": year3,
            "Year 4": year4
        }
        
        # Remove year field from courses and deduplicate
        for year_key in years_data:
            seen = set()
            unique = []
            for course in years_data[year_key]:
                code = course.get("code", "")
                if code not in seen:
                    seen.add(code)
                    course_copy = {k: v for k, v in course.items() if k != "year"}
                    unique.append(course_copy)
            years_data[year_key] = unique
        
        # Calculate total credits
        total_credits = sum(
            sum(course.get('credits', 3) for course in courses)
            for courses in years_data.values()
        )
        
        # Convert to the expected JSON format
        result = {
            "faculty": "Applied Science",
            "major": program_name,
            "totalCredits": total_credits,
            "notes": f"UBC Applied Science (Engineering) - {program_name} curriculum outline. First year is common to most engineering programs.",
            "years": []
        }
        
        # Convert years data to the expected format
        for year_num, (year_label, courses) in enumerate(years_data.items(), 1):
            year_data = {
                "year": year_num,
                "label": year_label,
                "terms": []
            }
            
            if courses:
                # Split courses into terms (first half = term 1, second half = term 2)
                mid_point = max(1, len(courses) // 2)
                term1_courses = courses[:mid_point]
                term2_courses = courses[mid_point:]
                
                if term1_courses:
                    year_data["terms"].append({
                        "term": 1,
                        "courses": [
                            {
                                "code": c["code"],
                                "title": c.get("title", ""),
                                "credits": c.get("credits", 3),
                                "year": year_num,
                                "term": 1
                            }
                            for c in term1_courses
                        ]
                    })
                
                if term2_courses:
                    year_data["terms"].append({
                        "term": 2,
                        "courses": [
                            {
                                "code": c["code"],
                                "title": c.get("title", ""),
                                "credits": c.get("credits", 3),
                                "year": year_num,
                                "term": 2
                            }
                            for c in term2_courses
                        ]
                    })
            
            result["years"].append(year_data)
        
        return result
    
    def scrape_major_curriculum(self, program_name: str, url: str) -> Dict:
        """Scrape curriculum for a specific engineering major"""
        print(f"\nScraping {program_name}...")
        print(f"  URL: {url}")
        
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            years_data = {
                "Year 1": self.common_year_1.copy(),
                "Year 2": [],
                "Year 3": [],
                "Year 4": []
            }
            
            # Find all tables on the page
            tables = soup.find_all('table')
            print(f"  Found {len(tables)} tables on page")
            
            for table in tables:
                # Parse the table and categorize courses by year
                _, courses = self.parse_table_for_courses(table)
                
                for course in courses:
                    year = course.get("year")
                    if year and year in years_data:
                        # Remove the year field from course before adding
                        course_copy = {k: v for k, v in course.items() if k != "year"}
                        years_data[year].append(course_copy)
            
            # Also try to find courses using heading + table pattern
            for header in soup.find_all(['h2', 'h3', 'h4', 'h5']):
                header_text = header.get_text(strip=True).lower()
                
                year_key = None
                if 'second year' in header_text:
                    year_key = "Year 2"
                elif 'third year' in header_text:
                    year_key = "Year 3"
                elif 'fourth year' in header_text:
                    year_key = "Year 4"
                
                if year_key and not years_data[year_key]:
                    # Look for the next table after this header
                    next_table = header.find_next('table')
                    if next_table:
                        _, courses = self.parse_table_for_courses(next_table, year_key)
                        for course in courses:
                            course_copy = {k: v for k, v in course.items() if k != "year"}
                            years_data[year_key].append(course_copy)
            
            # Report and remove duplicates
            for year_key in years_data:
                seen = set()
                unique = []
                for course in years_data[year_key]:
                    if course["code"] not in seen:
                        seen.add(course["code"])
                        unique.append(course)
                years_data[year_key] = unique
                
                count = len(years_data[year_key])
                if count > 0:
                    print(f"  {year_key}: {count} courses")
                else:
                    print(f"  Warning: No courses found for {year_key}")
            
            # Calculate total credits
            total_credits = sum(
                sum(course.get('credits', 3) for course in courses)
                for courses in years_data.values()
            )
            
            # Convert to the expected JSON format
            result = {
                "faculty": "Applied Science",
                "major": program_name,
                "totalCredits": total_credits,
                "notes": f"UBC Applied Science (Engineering) - {program_name} curriculum outline. First year is common to most engineering programs.",
                "years": []
            }
            
            # Convert years data to the expected format
            for year_num, (year_label, courses) in enumerate(years_data.items(), 1):
                year_data = {
                    "year": year_num,
                    "label": year_label,
                    "terms": []
                }
                
                if courses:
                    # Split courses into terms (first half = term 1, second half = term 2)
                    mid_point = max(1, len(courses) // 2)
                    term1_courses = courses[:mid_point]
                    term2_courses = courses[mid_point:]
                    
                    if term1_courses:
                        year_data["terms"].append({
                            "term": 1,
                            "courses": [
                                {
                                    "code": c["code"],
                                    "title": c.get("title", ""),
                                    "credits": c.get("credits", 3),
                                    "year": year_num,
                                    "term": 1
                                }
                                for c in term1_courses
                            ]
                        })
                    
                    if term2_courses:
                        year_data["terms"].append({
                            "term": 2,
                            "courses": [
                                {
                                    "code": c["code"],
                                    "title": c.get("title", ""),
                                    "credits": c.get("credits", 3),
                                    "year": year_num,
                                    "term": 2
                                }
                                for c in term2_courses
                            ]
                        })
                
                result["years"].append(year_data)
            
            return result
            
        except Exception as e:
            print(f"  Error scraping {program_name}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def save_json(self, data: Dict, filename: str):
        """Save curriculum data to JSON file"""
        filepath = os.path.join(self.output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"  Saved: {filepath}")
    
    def cleanup_old_files(self):
        """Remove old/irrelevant JSON files"""
        # Files to keep (undergraduate programs)
        keep_patterns = [
            'biomedical-engineering.json',
            'chemical-and-biological-engineering.json',
            'civil-engineering.json',
            'computer-engineering.json',
            'electrical-and-computer-engineering.json',
            'electrical-engineering.json',
            'engineering-physics.json',
            'environmental-engineering.json',
            'geological-engineering.json',
            'integrated-engineering.json',
            'manufacturing-engineering.json',
            'materials-engineering.json',
            'mechanical-engineering.json',
            'mining-engineering.json',
        ]
        
        # Remove files that don't match keep patterns
        for filename in os.listdir(self.output_dir):
            if filename.endswith('.json') and filename not in keep_patterns:
                filepath = os.path.join(self.output_dir, filename)
                try:
                    os.remove(filepath)
                    print(f"  Removed: {filename}")
                except Exception as e:
                    print(f"  Could not remove {filename}: {e}")
    
    def run(self):
        """Main execution method"""
        print("=" * 60)
        print("UBC Engineering Curriculum Scraper")
        print("=" * 60)
        
        # Cleanup old files first
        print("\n[Step 0] Cleaning up old files...")
        self.cleanup_old_files()
        
        # Step 1: Scrape standard first year
        print("\n[Step 1] Scraping standard first year courses...")
        self.common_year_1 = self.scrape_standard_first_year()
        
        # If no courses found, use defaults
        if not self.common_year_1:
            print("  Using default first year courses...")
            self.common_year_1 = self.get_default_first_year()
        
        time.sleep(1)  # Be polite to the server
        
        # Step 2: Get undergraduate majors list
        print("\n[Step 2] Using predefined undergraduate majors list...")
        majors = self.get_undergraduate_majors_list()
        print(f"  Will scrape {len(majors)} undergraduate engineering programs")
        for name, _ in majors:
            print(f"    - {name}")
        
        # Step 3: Scrape Biomedical Engineering (special handling - unique first year)
        print("\n[Step 3] Scraping Biomedical Engineering (special program)...")
        bmeg_curriculum = self.scrape_biomedical_engineering()
        
        successful = 0
        failed = 0
        
        if bmeg_curriculum:
            self.save_json(bmeg_curriculum, "biomedical-engineering.json")
            successful += 1
        else:
            failed += 1
        
        time.sleep(2)
        
        # Step 4: Scrape ECE page (special handling for 2 programs - Computer and Electrical)
        print("\n[Step 4] Scraping ECE page (2 programs)...")
        ece_results = self.scrape_ece_page()
        
        for slug, curriculum in ece_results:
            if curriculum:
                filename = f"{slug}.json"
                self.save_json(curriculum, filename)
                successful += 1
            else:
                failed += 1
        
        time.sleep(2)
        
        # Step 5: Scrape each remaining major
        print("\n[Step 5] Scraping other major curricula...")
        
        for program_name, url in majors:
            time.sleep(2)  # Be polite to the server
            
            curriculum = self.scrape_major_curriculum(program_name, url)
            
            if curriculum:
                # Generate filename from program name
                slug = program_name.lower().replace(' ', '-')
                slug = re.sub(r'[^a-z0-9-]', '', slug)
                slug = re.sub(r'-+', '-', slug)
                filename = f"{slug}.json"
                
                self.save_json(curriculum, filename)
                successful += 1
            else:
                print(f"  Failed to scrape {program_name}")
                failed += 1
        
        # Summary
        print("\n" + "=" * 60)
        print("Scraping Complete!")
        print(f"  Successful: {successful}")
        print(f"  Failed: {failed}")
        print(f"  Output directory: {self.output_dir}")
        print("=" * 60)


if __name__ == "__main__":
    scraper = UBCEngineeringScraper()
    scraper.run()
