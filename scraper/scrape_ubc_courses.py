"""
UBC Academic Calendar Course Scraper
Scrapes course data from vancouver.calendar.ubc.ca
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from typing import Dict, List, Optional
import sys

class UBCCourseScraper:
    def __init__(self):
        self.base_url = "https://vancouver.calendar.ubc.ca"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        self.courses = []
        
    def get_faculty_url(self, faculty_code: str) -> str:
        """Get the URL for a specific faculty's course listings"""
        # UBC Calendar structure: /course-catalogue/course/{faculty_code}/
        return f"{self.base_url}/course-catalogue/course/{faculty_code}/"
    
    def scrape_course_page(self, course_url: str) -> Optional[Dict]:
        """Scrape individual course page for detailed information"""
        try:
            response = self.session.get(course_url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Extract course code and name
            course_header = soup.find('h1', class_='page-title')
            if not course_header:
                return None
            
            course_text = course_header.get_text(strip=True)
            # Format: "CPSC 110 (3) Computation, Programs, and Programming"
            match = re.match(r'([A-Z]{4})\s+(\d+[A-Z]?)\s+\((\d+)\)\s+(.+)', course_text)
            if not match:
                return None
            
            course_code = f"{match.group(1)} {match.group(2)}"
            credits = int(match.group(3))
            course_name = match.group(4)
            
            # Extract description
            description = ""
            desc_section = soup.find('div', class_='field-name-field-course-description')
            if desc_section:
                desc_para = desc_section.find('p')
                if desc_para:
                    description = desc_para.get_text(strip=True)
            
            # Extract prerequisites
            prerequisites = []
            prereq_section = soup.find('div', class_='field-name-field-prerequisite')
            if prereq_section:
                prereq_text = prereq_section.get_text(strip=True)
                # Extract course codes from prerequisites text
                prereq_codes = re.findall(r'([A-Z]{4})\s+(\d+[A-Z]?)', prereq_text)
                prerequisites = [f"{code[0]} {code[1]}" for code in prereq_codes]
            
            # Extract corequisites
            corequisites = []
            coreq_section = soup.find('div', class_='field-name-field-corequisite')
            if coreq_section:
                coreq_text = coreq_section.get_text(strip=True)
                coreq_codes = re.findall(r'([A-Z]{4})\s+(\d+[A-Z]?)', coreq_text)
                corequisites = [f"{code[0]} {code[1]}" for code in coreq_codes]
            
            # Determine category based on faculty and course code
            category = self.determine_category(course_code)
            
            return {
                'code': course_code,
                'name': course_name,
                'credits': credits,
                'prerequisites': prerequisites,
                'corequisites': corequisites,
                'description': description,
                'category': category
            }
            
        except Exception as e:
            print(f"Error scraping course {course_url}: {e}")
            return None
    
    def determine_category(self, course_code: str) -> str:
        """Determine course category based on course code"""
        code_prefix = course_code.split()[0]
        
        # Communication courses
        if code_prefix in ['WRDS', 'ENGL'] and '150' in course_code:
            return 'communication'
        
        # Literature courses
        if code_prefix in ['ENGL', 'CRWR', 'FREN', 'SPAN', 'GERM', 'ITAL']:
            return 'literature'
        
        # Science courses
        if code_prefix in ['BIOL', 'CHEM', 'PHYS', 'MATH', 'STAT', 'ASTR', 'EOSC', 'PSYC']:
            return 'science'
        
        # Default to elective
        return 'elective'
    
    def scrape_faculty_courses(self, faculty_code: str, faculty_name: str) -> List[Dict]:
        """Scrape all courses for a specific faculty"""
        print(f"\nScraping {faculty_name} ({faculty_code})...")
        
        faculty_url = self.get_faculty_url(faculty_code)
        courses = []
        
        try:
            response = self.session.get(faculty_url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Find all course links
            course_links = soup.find_all('a', href=re.compile(r'/course/[A-Z]{4}/\d+'))
            
            print(f"Found {len(course_links)} courses")
            
            for i, link in enumerate(course_links, 1):
                course_url = self.base_url + link['href']
                print(f"  [{i}/{len(course_links)}] Scraping {link.get_text(strip=True)}...")
                
                course_data = self.scrape_course_page(course_url)
                if course_data:
                    course_data['faculty'] = faculty_name
                    course_data['faculty_code'] = faculty_code
                    courses.append(course_data)
                
                # Be respectful - add delay between requests
                time.sleep(0.5)
                
        except Exception as e:
            print(f"Error scraping faculty {faculty_name}: {e}")
        
        return courses
    
    def scrape_arts_courses(self) -> List[Dict]:
        """Scrape Faculty of Arts courses"""
        # Arts courses are typically under various subject codes
        arts_subjects = [
            ('ANTH', 'Anthropology'),
            ('ASIA', 'Asian Studies'),
            ('CLST', 'Classical Studies'),
            ('CRWR', 'Creative Writing'),
            ('ECON', 'Economics'),
            ('ENGL', 'English'),
            ('FREN', 'French'),
            ('GEOG', 'Geography'),
            ('GERM', 'German'),
            ('HIST', 'History'),
            ('ITAL', 'Italian'),
            ('PHIL', 'Philosophy'),
            ('POLI', 'Political Science'),
            ('PSYC', 'Psychology'),
            ('SOCI', 'Sociology'),
            ('SPAN', 'Spanish'),
            ('WRDS', 'Writing, Research, and Discourse Studies'),
        ]
        
        all_courses = []
        for subject_code, subject_name in arts_subjects:
            try:
                courses = self.scrape_faculty_courses(subject_code, f"Arts - {subject_name}")
                all_courses.extend(courses)
            except Exception as e:
                print(f"Error scraping {subject_name}: {e}")
                continue
        
        return all_courses
    
    def scrape_science_courses(self) -> List[Dict]:
        """Scrape Faculty of Science courses"""
        science_subjects = [
            ('BIOL', 'Biology'),
            ('CHEM', 'Chemistry'),
            ('CPSC', 'Computer Science'),
            ('MATH', 'Mathematics'),
            ('PHYS', 'Physics'),
            ('STAT', 'Statistics'),
        ]
        
        all_courses = []
        for subject_code, subject_name in science_subjects:
            try:
                courses = self.scrape_faculty_courses(subject_code, f"Science - {subject_name}")
                all_courses.extend(courses)
            except Exception as e:
                print(f"Error scraping {subject_name}: {e}")
                continue
        
        return all_courses
    
    def scrape_sauder_courses(self) -> List[Dict]:
        """Scrape Sauder School of Business courses"""
        sauder_subjects = [
            ('COMM', 'Commerce'),
        ]
        
        all_courses = []
        for subject_code, subject_name in sauder_subjects:
            try:
                courses = self.scrape_faculty_courses(subject_code, f"Sauder - {subject_name}")
                all_courses.extend(courses)
            except Exception as e:
                print(f"Error scraping {subject_name}: {e}")
                continue
        
        return all_courses
    
    def save_to_json(self, courses: List[Dict], filename: str):
        """Save scraped courses to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(courses, f, indent=2, ensure_ascii=False)
        print(f"\nSaved {len(courses)} courses to {filename}")


def main():
    scraper = UBCCourseScraper()
    
    print("=" * 60)
    print("UBC Academic Calendar Course Scraper")
    print("=" * 60)
    
    # Ask which faculty to scrape
    print("\nWhich faculty would you like to scrape?")
    print("1. Faculty of Arts")
    print("2. Faculty of Science")
    print("3. Sauder School of Business")
    print("4. All of the above")
    
    choice = input("\nEnter choice (1-4): ").strip()
    
    all_courses = []
    
    if choice == '1' or choice == '4':
        arts_courses = scraper.scrape_arts_courses()
        all_courses.extend(arts_courses)
        scraper.save_to_json(arts_courses, 'scraper/data/arts_courses.json')
    
    if choice == '2' or choice == '4':
        science_courses = scraper.scrape_science_courses()
        all_courses.extend(science_courses)
        scraper.save_to_json(science_courses, 'scraper/data/science_courses.json')
    
    if choice == '3' or choice == '4':
        sauder_courses = scraper.scrape_sauder_courses()
        all_courses.extend(sauder_courses)
        scraper.save_to_json(sauder_courses, 'scraper/data/sauder_courses.json')
    
    if choice == '4':
        scraper.save_to_json(all_courses, 'scraper/data/all_courses.json')
    
    print("\n" + "=" * 60)
    print(f"Scraping complete! Total courses: {len(all_courses)}")
    print("=" * 60)


if __name__ == "__main__":
    main()

