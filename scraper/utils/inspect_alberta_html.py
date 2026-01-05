#!/usr/bin/env python3
"""
Inspect the actual HTML structure to find where province-specific course codes are
"""

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def inspect_alberta_html():
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Navigate and select
        url = "https://you.ubc.ca/applying-ubc/requirements/canadian-high-schools/#alberta"
        driver.get(url)
        time.sleep(5)
        
        degree_select = Select(driver.find_element(By.CLASS_NAME, "select-programs-list"))
        degree_select.select_by_visible_text("Applied Biology")
        time.sleep(10)  # Wait even longer
        
        # Save complete HTML
        html = driver.page_source
        with open('scraper/data/alberta_applied_bio_full.html', 'w', encoding='utf-8') as f:
            f.write(html)
        
        print("✓ HTML saved to: scraper/data/alberta_applied_bio_full.html")
        print("\nSearching for '30-1' pattern in HTML...")
        
        if '30-1' in html:
            print("✅ FOUND '30-1' in HTML!")
            # Find context around it
            index = html.find('30-1')
            context = html[max(0, index-200):min(len(html), index+200)]
            print("\nContext around '30-1':")
            print(context)
        else:
            print("❌ '30-1' NOT FOUND in HTML")
        
        if 'English Language Arts 30-1' in html:
            print("\n✅ FOUND 'English Language Arts 30-1' in HTML!")
        else:
            print("\n❌ 'English Language Arts 30-1' NOT FOUND in HTML")
        
        # Check what we actually have
        if 'A Grade 12 English' in html:
            print("\n⚠️  CONFIRMED: Page only shows 'A Grade 12 English' (generic)")
        
    finally:
        driver.quit()

if __name__ == "__main__":
    inspect_alberta_html()

