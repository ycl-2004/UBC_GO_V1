#!/usr/bin/env python3
"""
Search for province-specific course requirements on UBC website
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
import time

def search_alberta_requirements():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Check main requirements page
        print("=" * 80)
        print("Checking: https://you.ubc.ca/applying-ubc/requirements/")
        print("=" * 80)
        
        driver.get("https://you.ubc.ca/applying-ubc/requirements/")
        time.sleep(3)
        
        html = driver.page_source
        
        # Search for Alberta-specific patterns
        if '30-1' in html or 'English Language Arts 30' in html:
            print("✅ Found Alberta course codes on main requirements page")
            # Save this page
            with open('scraper/data/main_requirements.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print("   Saved to: scraper/data/main_requirements.html")
        else:
            print("❌ No Alberta-specific course codes on main page")
        
        # Check if there's a different link structure
        print("\n" + "=" * 80)
        print("Searching page for links containing 'alberta' or 'province'...")
        print("=" * 80)
        
        links = driver.find_elements(By.TAG_NAME, "a")
        alberta_links = []
        for link in links:
            href = link.get_attribute('href') or ''
            text = link.text.strip()
            if 'alberta' in href.lower() or 'alberta' in text.lower():
                alberta_links.append((text, href))
        
        if alberta_links:
            print(f"\nFound {len(alberta_links)} Alberta-related links:")
            for text, href in alberta_links[:10]:
                print(f"  • {text}: {href}")
        else:
            print("\nNo Alberta-specific links found")
        
        # Try the general admission requirements page for Science
        print("\n" + "=" * 80)
        print("Checking Faculty of Science admission requirements...")
        print("=" * 80)
        
        driver.get("https://www.calendar.ubc.ca/vancouver/index.cfm?tree=12,199,0,0")
        time.sleep(3)
        html = driver.page_source
        
        if '30-1' in html:
            print("✅ Found '30-1' in Faculty of Science calendar")
            with open('scraper/data/science_requirements.html', 'w', encoding='utf-8') as f:
                f.write(html)
        else:
            print("❌ No Alberta codes in Science calendar either")
        
        # Try specific undergraduate admission page
        print("\n" + "=" * 80)
        print("Checking: Undergraduate admission requirements...")
        print("=" * 80)
        
        driver.get("https://vancouver.calendar.ubc.ca/faculties-colleges-and-schools/faculty-applied-science/")
        time.sleep(3)
        html = driver.page_source
        
        if '30-1' in html or 'Math 30' in html or 'English 30' in html:
            print("✅ Found Alberta course codes in Faculty pages!")
            with open('scraper/data/faculty_requirements.html', 'w', encoding='utf-8') as f:
                f.write(html)
            
            # Find and print context
            index = html.find('30-1') if '30-1' in html else html.find('Math 30')
            if index != -1:
                context = html[max(0, index-300):min(len(html), index+300)]
                print("\nContext:")
                print(context)
        else:
            print("❌ No Alberta codes in Faculty pages")
        
    finally:
        driver.quit()
        print("\n✓ Search complete")

if __name__ == "__main__":
    search_alberta_requirements()

