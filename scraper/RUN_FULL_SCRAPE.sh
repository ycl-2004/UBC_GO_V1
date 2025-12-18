#!/bin/bash

echo "=================================="
echo "UBC Requirements Full Scraper"
echo "=================================="
echo ""
echo "This will scrape ALL 13 provinces × 20 degrees = 260 combinations"
echo "Estimated time: 40-60 minutes"
echo ""
read -p "Press ENTER to continue or CTRL+C to cancel..."

cd "$(dirname "$0")"

echo ""
echo "Starting scraper..."
python3 scrape_detailed_requirements.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Scraping completed!"
    echo ""
    echo "Processing data..."
    python3 process_detailed_requirements.py
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "Applying province-specific course code mappings..."
        cd ..
        python3 scraper/apply_province_mappings.py
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "Copying enhanced data to frontend..."
            cp scraper/data/vancouver_detailed_requirements_enhanced.json src/data/detailed_requirements_enhanced.json
            
            echo ""
            echo "=================================="
            echo "✓ ALL DONE!"
            echo "=================================="
            echo ""
            echo "Data saved to:"
            echo "  - scraper/data/vancouver_detailed_requirements.json (raw)"
            echo "  - scraper/data/vancouver_detailed_requirements_enhanced.json (with province codes)"
            echo "  - src/data/detailed_requirements_enhanced.json (for frontend)"
            echo ""
            echo "Next steps:"
            echo "  1. Restart your dev server: npm run dev"
            echo "  2. Visit http://localhost:5173/calculator"
            echo "  3. Test: Alberta → Applied Biology"
            echo "     Should show: 'Math 30-1 or Math 31 (5 credits)' on ONE line"
            echo ""
        else
            echo "✗ Error applying province mappings"
            exit 1
        fi
    else
        echo "✗ Error processing data"
        exit 1
    fi
else
    echo "✗ Error during scraping"
    exit 1
fi
