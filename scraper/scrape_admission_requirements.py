"""
UBC Admission Requirements Scraper for Canadian High School Students
Scrapes admission requirements from you.ubc.ca
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

class UBCAdmissionRequirementsScraper:
    def __init__(self, use_selenium=True):
        self.base_url = "https://you.ubc.ca"
        self.requirements_url = "https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/#basic"
        self.use_selenium = use_selenium
        self.driver = None
        
        if use_selenium:
            self.setup_selenium()
    
    def setup_selenium(self):
        """Setup Selenium WebDriver for dynamic content"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')  # Run in background
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            print("Selenium WebDriver initialized successfully")
        except Exception as e:
            print(f"Failed to initialize Selenium WebDriver: {e}")
            print("Please make sure ChromeDriver is installed and in your PATH")
            self.use_selenium = False
    
    def scrape_general_requirements(self) -> Dict:
        """Scrape general admission requirements"""
        print("\nScraping general admission requirements...")
        
        try:
            if self.use_selenium and self.driver:
                self.driver.get(self.requirements_url)
                time.sleep(3)  # Wait for page to load
                
                soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            else:
                response = requests.get(self.requirements_url)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
            
            requirements = {
                'english_language': self.extract_english_requirement(soup),
                'general_admission': self.extract_general_admission(soup),
                'provinces': {}
            }
            
            return requirements
            
        except Exception as e:
            print(f"Error scraping general requirements: {e}")
            return {}
    
    def extract_english_requirement(self, soup: BeautifulSoup) -> Dict:
        """Extract English language requirement"""
        english_req = {
            'title': 'English Language Requirement',
            'description': '',
            'details': []
        }
        
        try:
            # Find English language requirement section
            section = soup.find('h2', string=re.compile(r'English language requirement', re.I))
            if section:
                parent = section.find_parent()
                if parent:
                    # Get description
                    desc_p = parent.find('p')
                    if desc_p:
                        english_req['description'] = desc_p.get_text(strip=True)
                    
                    # Get link to English Language Admission Standard
                    link = parent.find('a', href=re.compile(r'english', re.I))
                    if link:
                        english_req['standard_link'] = self.base_url + link['href'] if not link['href'].startswith('http') else link['href']
        
        except Exception as e:
            print(f"Error extracting English requirement: {e}")
        
        return english_req
    
    def extract_general_admission(self, soup: BeautifulSoup) -> Dict:
        """Extract general admission requirements"""
        general_req = {
            'title': 'General Admission Requirements',
            'requirements': [],
            'additional_info': ''
        }
        
        try:
            # Find general admission requirements section
            section = soup.find('h2', string=re.compile(r'General admission requirements', re.I))
            if section:
                parent = section.find_parent()
                if parent:
                    # Get list items
                    ul = parent.find('ul')
                    if ul:
                        for li in ul.find_all('li'):
                            req_text = li.get_text(strip=True)
                            general_req['requirements'].append(req_text)
                    
                    # Get additional paragraph info
                    for p in parent.find_all('p'):
                        if 'UBC considers' in p.get_text():
                            general_req['additional_info'] = p.get_text(strip=True)
        
        except Exception as e:
            print(f"Error extracting general admission: {e}")
        
        return general_req
    
    def scrape_degree_requirements(self, campus='vancouver') -> Dict:
        """Scrape degree-specific requirements using Selenium"""
        print(f"\nScraping degree-specific requirements for {campus}...")
        
        if not self.use_selenium or not self.driver:
            print("Selenium is required for scraping degree-specific requirements")
            return {}
        
        degree_requirements = {}
        
        try:
            # Navigate to the page
            self.driver.get(self.requirements_url)
            time.sleep(3)
            
            # Click on campus tab if not Vancouver
            if campus.lower() == 'okanagan':
                try:
                    okanagan_btn = self.driver.find_element(By.LINK_TEXT, "Okanagan")
                    okanagan_btn.click()
                    time.sleep(2)
                except:
                    print("Could not find Okanagan button")
            
            # Find the degree dropdown
            try:
                degree_select = Select(self.driver.find_element(By.XPATH, "//select[contains(@class, 'degree-select') or contains(text(), 'Select a degree')]"))
                
                # Get all degree options
                degree_options = degree_select.options
                degree_values = [(opt.get_attribute('value'), opt.text) for opt in degree_options if opt.get_attribute('value')]
                
                print(f"Found {len(degree_values)} degrees")
                
                for value, name in degree_values:
                    if not value or value == '':
                        continue
                    
                    print(f"  Scraping requirements for: {name}")
                    
                    try:
                        # Select the degree
                        degree_select.select_by_value(value)
                        time.sleep(2)
                        
                        # Get the page source after selection
                        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                        
                        # Extract degree-specific requirements
                        degree_req = self.extract_degree_specific_requirements(soup, name)
                        
                        if degree_req:
                            degree_requirements[name] = degree_req
                    
                    except Exception as e:
                        print(f"    Error scraping {name}: {e}")
                        continue
            
            except NoSuchElementException:
                print("Could not find degree dropdown. The page structure may have changed.")
        
        except Exception as e:
            print(f"Error in scrape_degree_requirements: {e}")
        
        return degree_requirements
    
    def extract_degree_specific_requirements(self, soup: BeautifulSoup, degree_name: str) -> Dict:
        """Extract requirements for a specific degree"""
        degree_req = {
            'name': degree_name,
            'required_courses': [],
            'recommended_courses': [],
            'minimum_grades': {},
            'additional_requirements': [],
            'notes': ''
        }
        
        try:
            # Find degree-specific requirements section
            section = soup.find('h2', string=re.compile(r'Degree-specific requirements', re.I))
            if section:
                parent = section.find_parent()
                if parent:
                    # Look for requirement details in the content area
                    content_div = parent.find_next('div')
                    
                    if content_div:
                        # Extract lists
                        for ul in content_div.find_all('ul'):
                            for li in ul.find_all('li'):
                                req_text = li.get_text(strip=True)
                                
                                # Categorize requirements
                                if 'require' in req_text.lower() and 'recommend' not in req_text.lower():
                                    degree_req['required_courses'].append(req_text)
                                elif 'recommend' in req_text.lower():
                                    degree_req['recommended_courses'].append(req_text)
                                else:
                                    degree_req['additional_requirements'].append(req_text)
                        
                        # Extract paragraphs for notes
                        for p in content_div.find_all('p'):
                            text = p.get_text(strip=True)
                            if text and len(text) > 20:
                                if degree_req['notes']:
                                    degree_req['notes'] += ' ' + text
                                else:
                                    degree_req['notes'] = text
        
        except Exception as e:
            print(f"    Error extracting degree-specific requirements: {e}")
        
        return degree_req
    
    def scrape_provincial_requirements(self) -> Dict:
        """Scrape requirements for different provinces"""
        print("\nScraping provincial requirements...")
        
        if not self.use_selenium or not self.driver:
            print("Selenium is required for scraping provincial requirements")
            return {}
        
        provincial_requirements = {}
        
        try:
            self.driver.get(self.requirements_url)
            time.sleep(3)
            
            # Find province selector
            try:
                province_select = Select(self.driver.find_element(By.XPATH, "//select[contains(@aria-label, 'Province') or contains(text(), 'province')]"))
                
                # Get all province options
                province_options = province_select.options
                province_values = [(opt.get_attribute('value'), opt.text) for opt in province_options if opt.get_attribute('value') and opt.text != 'Select Province']
                
                print(f"Found {len(province_values)} provinces")
                
                # Sample a few provinces to avoid too long scraping time
                # In production, you might want to scrape all
                sample_provinces = province_values[:3]  # First 3 provinces as sample
                
                for value, name in sample_provinces:
                    print(f"  Scraping requirements for: {name}")
                    
                    try:
                        province_select.select_by_value(value)
                        time.sleep(2)
                        
                        soup = BeautifulSoup(self.driver.page_source, 'html.parser')
                        
                        # Extract provincial requirements (similar to general requirements)
                        provincial_requirements[name] = {
                            'general': self.extract_general_admission(soup),
                            'english': self.extract_english_requirement(soup)
                        }
                    
                    except Exception as e:
                        print(f"    Error scraping {name}: {e}")
                        continue
            
            except NoSuchElementException:
                print("Could not find province dropdown")
        
        except Exception as e:
            print(f"Error in scrape_provincial_requirements: {e}")
        
        return provincial_requirements
    
    def save_to_json(self, data: Dict, filename: str):
        """Save scraped data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\nSaved admission requirements to {filename}")
    
    def cleanup(self):
        """Clean up resources"""
        if self.driver:
            self.driver.quit()
            print("\nSelenium WebDriver closed")


def main():
    scraper = UBCAdmissionRequirementsScraper(use_selenium=True)
    
    print("=" * 70)
    print("UBC Admission Requirements Scraper (Canadian High School Students)")
    print("=" * 70)
    
    try:
        # Scrape general requirements
        general_requirements = scraper.scrape_general_requirements()
        
        if general_requirements:
            scraper.save_to_json(
                general_requirements,
                'scraper/data/general_admission_requirements.json'
            )
        
        # Scrape degree-specific requirements for Vancouver
        print("\n" + "=" * 70)
        vancouver_degrees = scraper.scrape_degree_requirements(campus='vancouver')
        
        if vancouver_degrees:
            scraper.save_to_json(
                vancouver_degrees,
                'scraper/data/vancouver_degree_requirements.json'
            )
        
        # Scrape degree-specific requirements for Okanagan
        print("\n" + "=" * 70)
        okanagan_degrees = scraper.scrape_degree_requirements(campus='okanagan')
        
        if okanagan_degrees:
            scraper.save_to_json(
                okanagan_degrees,
                'scraper/data/okanagan_degree_requirements.json'
            )
        
        # Combine all data
        all_requirements = {
            'general': general_requirements,
            'vancouver_degrees': vancouver_degrees,
            'okanagan_degrees': okanagan_degrees
        }
        
        scraper.save_to_json(
            all_requirements,
            'scraper/data/all_admission_requirements.json'
        )
        
        print("\n" + "=" * 70)
        print("Scraping complete!")
        print(f"General requirements scraped: {bool(general_requirements)}")
        print(f"Vancouver degrees scraped: {len(vancouver_degrees)}")
        print(f"Okanagan degrees scraped: {len(okanagan_degrees)}")
        print("=" * 70)
    
    finally:
        scraper.cleanup()


if __name__ == "__main__":
    main()

