"""
Enhanced UBC Admission Requirements Scraper
Scrapes detailed requirements by province and degree from you.ubc.ca
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from typing import Dict, List, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class DetailedRequirementsScraper:
    def __init__(self):
        self.base_url = "https://you.ubc.ca"
        self.requirements_url = "https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/"
        self.driver = None
        self.setup_selenium()
    
    def setup_selenium(self):
        """Setup Selenium WebDriver"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print("✓ Selenium WebDriver initialized")
        except Exception as e:
            print(f"✗ Failed to initialize Selenium: {e}")
            raise
    
    def scrape_all_requirements(self, campus='vancouver'):
        """Scrape all requirements for all provinces and degrees"""
        print(f"\n{'='*70}")
        print(f"Scraping requirements for {campus.upper()} campus")
        print(f"{'='*70}")
        
        all_data = {
            'campus': campus,
            'general_requirements': {},
            'provinces': {}
        }
        
        # Get list of provinces
        provinces = self.get_provinces()
        print(f"\nFound {len(provinces)} provinces to scrape")
        
        # Get list of degrees
        degrees = self.get_degrees(campus)
        print(f"Found {len(degrees)} degrees to scrape")
        
        # Scrape general requirements (without province selection)
        print("\n" + "="*70)
        print("Scraping general requirements...")
        all_data['general_requirements'] = self.scrape_general_requirements()
        
        # Scrape for each province
        for province_name, province_hash in provinces:
            print(f"\n{'='*70}")
            print(f"Province: {province_name}")
            print(f"{'='*70}")
            
            province_data = {
                'name': province_name,
                'hash': province_hash,
                'general_requirements': {},
                'degrees': {}
            }
            
            # Scrape province-specific general requirements
            province_data['general_requirements'] = self.scrape_province_requirements(
                campus, province_name, province_hash
            )
            
            # Scrape each degree for this province
            for degree_name, degree_value in degrees:
                print(f"\n  Degree: {degree_name}")
                degree_reqs = self.scrape_degree_requirements(
                    campus, province_name, province_hash, degree_name, degree_value
                )
                
                if degree_reqs:
                    province_data['degrees'][degree_name] = degree_reqs
                
                time.sleep(1)  # Be respectful
            
            all_data['provinces'][province_name] = province_data
        
        return all_data
    
    def get_provinces(self) -> List[tuple]:
        """Get list of all provinces"""
        try:
            self.driver.get(self.requirements_url + '#basic')
            time.sleep(4)
            
            # Find province dropdown using the correct ID
            province_select = Select(self.driver.find_element(
                By.ID, 
                "admission-requirements-province"
            ))
            
            provinces = []
            for option in province_select.options:
                value = option.get_attribute('value')
                text = option.text.strip()
                
                # Skip empty or "Select" options
                if value and text and 'select' not in text.lower() and 'basic' not in text.lower():
                    provinces.append((text, value))
            
            print(f"Found {len(provinces)} provinces")
            return provinces  # Return ALL provinces
            
        except Exception as e:
            print(f"Error getting provinces: {e}")
            # Return default list
            return [
                ('Alberta', 'alberta'),
                ('British Columbia', 'british-columbia'),
                ('Ontario', 'ontario'),
                ('Quebec', 'quebec')
            ]
    
    def get_degrees(self, campus='vancouver') -> List[tuple]:
        """Get list of all degrees"""
        try:
            url = self.requirements_url + '#basic'
            self.driver.get(url)
            time.sleep(4)
            
            # Find degree dropdown using the correct class
            degree_select = Select(self.driver.find_element(
                By.CLASS_NAME,
                "select-programs-list"
            ))
            
            degrees = []
            for option in degree_select.options:
                text = option.text.strip()
                
                # Skip "Select a degree" option
                if text and 'select' not in text.lower():
                    # Use text as both name and value since there's no value attribute
                    degrees.append((text, text))
            
            print(f"Found {len(degrees)} degrees")
            # Return ALL degrees
            return degrees
            
        except Exception as e:
            print(f"Error getting degrees: {e}")
            return [
                ('Arts', 'Arts'),
                ('Science', 'Science'),
                ('Commerce (UBC Sauder School of Business)', 'Commerce (UBC Sauder School of Business)')
            ]
    
    def scrape_general_requirements(self) -> Dict:
        """Scrape general admission requirements"""
        try:
            self.driver.get(self.requirements_url + '#basic')
            time.sleep(3)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            general_reqs = {
                'english_requirement': self.extract_section(soup, 'English language requirement'),
                'general_admission': self.extract_section(soup, 'General admission requirements'),
                'requirements_list': []
            }
            
            # Extract bullet points from general admission
            section = soup.find('h3', string=re.compile(r'General admission requirements', re.I))
            if section:
                ul = section.find_next('ul')
                if ul:
                    for li in ul.find_all('li'):
                        general_reqs['requirements_list'].append(li.get_text(strip=True))
            
            return general_reqs
            
        except Exception as e:
            print(f"  ✗ Error scraping general requirements: {e}")
            return {}
    
    def scrape_province_requirements(self, campus, province_name, province_hash) -> Dict:
        """Scrape requirements for a specific province"""
        try:
            url = f"{self.requirements_url}#{province_hash}"
            self.driver.get(url)
            time.sleep(3)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            province_reqs = {
                'english_requirement': self.extract_section(soup, 'English language requirement'),
                'general_admission': self.extract_section(soup, 'General admission requirements'),
                'requirements_list': []
            }
            
            # Extract requirements list
            section = soup.find('h3', string=re.compile(r'General admission requirements', re.I))
            if section:
                ul = section.find_next('ul')
                if ul:
                    for li in ul.find_all('li'):
                        province_reqs['requirements_list'].append(li.get_text(strip=True))
            
            print(f"  ✓ General requirements scraped")
            return province_reqs
            
        except Exception as e:
            print(f"  ✗ Error: {e}")
            return {}
    
    def scrape_degree_requirements(self, campus, province_name, province_hash, 
                                   degree_name, degree_value) -> Dict:
        """Scrape requirements for a specific degree in a specific province"""
        try:
            # Navigate to province page
            url = f"{self.requirements_url}#{province_hash}"
            self.driver.get(url)
            time.sleep(5)  # Increased wait time for province content
            
            # Select the degree using the correct class
            try:
                degree_select = Select(self.driver.find_element(
                    By.CLASS_NAME,
                    "select-programs-list"
                ))
                
                # Select by visible text (degree_name)
                degree_select.select_by_visible_text(degree_name)
                
                # Wait longer for province-specific course codes to load
                time.sleep(8)  # Increased to ensure province-specific codes appear
                
            except Exception as e:
                print(f"    ✗ Error selecting degree: {e}")
                return {}
            
            # Wait for content to load using explicit wait
            try:
                # Wait for degree-specific requirements section to appear
                WebDriverWait(self.driver, 15).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "section-requirements"))
                )
            except TimeoutException:
                print(f"    ⚠ Timeout waiting for requirements section")
                pass  # Continue even if timeout
            
            # Additional wait to ensure province-specific content (like "English Language Arts 30-1") loads
            time.sleep(4)
            
            # Get page content
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            degree_reqs = {
                'degree_name': degree_name,
                'grade_12_requirements': [],
                'grade_11_requirements': [],
                'related_courses': [],
                'minimum_grade': '',
                'additional_info': ''
            }
            
            # Find degree-specific requirements section - try multiple approaches
            degree_section = None
            
            # Try 1: Find h2 with "Degree-specific requirements"
            degree_section = soup.find('h2', string=re.compile(r'Degree-specific requirements', re.I))
            
            # Try 2: Look for Grade 12 requirements directly (h5 first) - this is most reliable
            if not degree_section:
                for tag in ['h5', 'h4', 'h3', 'h2']:
                    grade_12_heading = soup.find(tag, string=re.compile(r'Grade 12 requirements?', re.I))
                    if grade_12_heading:
                        degree_section = grade_12_heading
                        break
            
            # Try 3: Look for Grade 11 requirements if Grade 12 not found
            if not degree_section:
                for tag in ['h5', 'h4', 'h3', 'h2']:
                    grade_11_heading = soup.find(tag, string=re.compile(r'Grade 11 requirements?', re.I))
                    if grade_11_heading:
                        degree_section = grade_11_heading
                        break
            
            # Try 4: Look for Related courses
            if not degree_section:
                for tag in ['h5', 'h4', 'h3', 'h2']:
                    related_heading = soup.find(tag, string=re.compile(r'Related courses?', re.I))
                    if related_heading:
                        degree_section = related_heading
                        break
            
            # Determine content container - always search entire page for degree-specific requirements
            # Since they appear after degree selection, we need to search the whole soup
            content_div = soup
            
            # Extract Grade 12 requirements - try multiple tag types (h5 first as it's commonly used)
            grade_12_section = None
            if content_div:
                for tag in ['h5', 'h4', 'h3', 'h2', 'strong', 'div']:
                    grade_12_section = content_div.find(tag, string=re.compile(r'Grade 12 requirements?', re.I))
                    if grade_12_section:
                        break
            
            if grade_12_section:
                # Try to find list
                ul = grade_12_section.find_next('ul')
                if ul:
                    for li in ul.find_all('li', recursive=False):
                        # Get complete text including nested elements (like <strong>, <em>, etc.)
                        text = li.get_text(separator=' ', strip=True)
                        if text:
                            degree_reqs['grade_12_requirements'].append(text)
                else:
                    # Try to find paragraph or div with requirements
                    p = grade_12_section.find_next(['p', 'div'])
                    if p:
                        text = p.get_text(separator=' ', strip=True)
                        if text and len(text) > 10:  # Meaningful content
                            degree_reqs['grade_12_requirements'].append(text)
            
            # Extract Grade 11 requirements - try multiple tag types (h5 first as it's commonly used)
            grade_11_section = None
            if content_div:
                for tag in ['h5', 'h4', 'h3', 'h2', 'strong', 'div']:
                    grade_11_section = content_div.find(tag, string=re.compile(r'Grade 11 requirements?', re.I))
                    if grade_11_section:
                        break
            
            if grade_11_section:
                ul = grade_11_section.find_next('ul')
                if ul:
                    for li in ul.find_all('li', recursive=False):
                        # Get complete text including nested elements
                        text = li.get_text(separator=' ', strip=True)
                        if text:
                            degree_reqs['grade_11_requirements'].append(text)
                else:
                    p = grade_11_section.find_next(['p', 'div'])
                    if p:
                        text = p.get_text(separator=' ', strip=True)
                        if text and len(text) > 10:
                            degree_reqs['grade_11_requirements'].append(text)
            
            # Extract Related courses - try multiple tag types (h5 first as it's commonly used)
            related_section = None
            if content_div:
                for tag in ['h5', 'h4', 'h3', 'h2', 'strong', 'div']:
                    related_section = content_div.find(tag, string=re.compile(r'Related courses?', re.I))
                    if related_section:
                        break
            
            if related_section:
                ul = related_section.find_next('ul')
                if ul:
                    for li in ul.find_all('li', recursive=False):
                        # Get complete text including nested elements
                        text = li.get_text(separator=' ', strip=True)
                        if text:
                            degree_reqs['related_courses'].append(text)
                else:
                    # Try to find related courses in nearby paragraphs
                    p = related_section.find_next(['p', 'div'])
                    if p:
                        text = p.get_text(separator=' ', strip=True)
                        if text and len(text) > 10:
                            # Split by common delimiters
                            courses = re.split(r'[,;•\n]', text)
                            for course in courses:
                                course = course.strip()
                                if course and len(course) > 2:
                                    degree_reqs['related_courses'].append(course)
                
                # Get the explanatory paragraph
                p = related_section.find_next('p')
                if p:
                    info_text = p.get_text(separator=' ', strip=True)
                    if info_text and len(info_text) > 10:
                        degree_reqs['additional_info'] = info_text
            
            # Find minimum grade requirements
            grade_pattern = re.compile(r'minimum.*?(\d+%)', re.I)
            for p in soup.find_all(['p', 'div', 'li']):
                match = grade_pattern.search(p.get_text())
                if match:
                    degree_reqs['minimum_grade'] = match.group(0)
                    break
            
            # Improved validation: Consider it successful if ANY requirement type is found
            has_requirements = (
                degree_reqs['grade_12_requirements'] or 
                degree_reqs['grade_11_requirements'] or 
                degree_reqs['related_courses']
            )
            
            if has_requirements:
                g12_count = len(degree_reqs['grade_12_requirements'])
                g11_count = len(degree_reqs['grade_11_requirements'])
                related_count = len(degree_reqs['related_courses'])
                print(f"    ✓ Requirements scraped: G12={g12_count}, G11={g11_count}, Related={related_count}")
                return degree_reqs
            else:
                print(f"    - No specific requirements found")
                return {}
            
        except Exception as e:
            print(f"    ✗ Error: {e}")
            return {}
    
    def extract_section(self, soup: BeautifulSoup, section_title: str) -> str:
        """Extract text from a section"""
        try:
            section = soup.find(['h2', 'h3'], string=re.compile(section_title, re.I))
            if section:
                content = []
                for sibling in section.find_next_siblings():
                    if sibling.name in ['h2', 'h3']:
                        break
                    text = sibling.get_text(strip=True)
                    if text:
                        content.append(text)
                return ' '.join(content)
        except:
            pass
        return ''
    
    def save_to_json(self, data: Dict, filename: str):
        """Save data to JSON file"""
        import os
        
        # Ensure directory exists
        directory = os.path.dirname(filename)
        if directory:
            os.makedirs(directory, exist_ok=True)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Saved to {filename}")
    
    def cleanup(self):
        """Cleanup resources"""
        if self.driver:
            self.driver.quit()
            print("\n✓ Browser closed")


def main():
    import os
    scraper = DetailedRequirementsScraper()
    
    try:
        print("\n" + "="*70)
        print("UBC Detailed Requirements Scraper")
        print("="*70)
        
        # Get the script directory and construct absolute path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(script_dir, 'data')
        output_file = os.path.join(data_dir, 'vancouver_detailed_requirements.json')
        
        print(f"\nOutput file: {output_file}")
        
        # Scrape Vancouver campus
        vancouver_data = scraper.scrape_all_requirements(campus='vancouver')
        scraper.save_to_json(vancouver_data, output_file)
        
        # Summary is already printed in scrape_all_requirements
        
    except KeyboardInterrupt:
        print("\n\nScraping interrupted by user")
    except Exception as e:
        print(f"\n\nError: {e}")
    finally:
        scraper.cleanup()


if __name__ == "__main__":
    main()

