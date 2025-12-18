# 🚀 Complete Scraper Instructions

## Overview

This guide explains how to scrape **ALL 13 provinces × 20 degrees = 260 combinations** of UBC admission requirements.

## Quick Start

### Option 1: Run the Automated Script (Recommended)

```bash
cd /Users/yichenlin/Desktop/UBC_GO/scraper
./RUN_FULL_SCRAPE.sh
```

This script will:

1. Run the scraper for all 260 combinations
2. Process the data automatically
3. Save to both raw and processed formats
4. Give you a summary

**Estimated time: 40-60 minutes**

### Option 2: Manual Step-by-Step

```bash
# 1. Navigate to scraper directory
cd /Users/yichenlin/Desktop/UBC_GO/scraper

# 2. Install dependencies (if not already installed)
pip3 install -r requirements.txt

# 3. Run the full scraper
python3 scrape_detailed_requirements.py

# 4. Process the data
python3 process_detailed_requirements.py
```

## What Gets Scraped

### Provinces (13 total)

- Alberta
- British Columbia
- Manitoba
- New Brunswick
- Newfoundland & Labrador
- Northwest Territories
- Nova Scotia
- Nunavut
- Ontario
- Prince Edward Island
- Quebec
- Saskatchewan
- Yukon

### Degrees (20 total)

- Applied Biology
- Applied Science (Engineering)
- Arts
- Bachelor + Master of Management
- Commerce (UBC Sauder School of Business)
- Dental Hygiene
- Design in Architecture, Landscape Architecture, and Urbanism
- Fine Arts
- Food and Resource Economics
- Food, Nutrition, and Health
- Indigenous Land Stewardship
- Indigenous Teacher Education Program (NITEP)
- International Economics
- Kinesiology
- Media Studies
- Music
- Natural Resources
- Pharmaceutical Sciences
- Science
- Urban Forestry

### Data Extracted for Each Combination

For each **Province + Degree** combination, the scraper extracts:

1. **Grade 12 Requirements**

   - Specific courses required (e.g., "English 12", "Math 30-1")
   - Minimum grades if specified

2. **Grade 11 Requirements**

   - Prerequisite courses from Grade 11
   - Recommended courses

3. **Related Courses**

   - Subject categories relevant to the degree
   - Recommended areas of study

4. **Additional Information**
   - Special notes
   - Program-specific requirements

## Output Files

### Raw Data

```
scraper/data/vancouver_detailed_requirements.json
```

Contains the complete scraped data in its original structure.

### Processed Data

```
src/data/detailed_requirements.json
```

Formatted and optimized for the frontend to consume.

## Monitoring Progress

The scraper shows real-time progress:

```
📍 Province 3/13: Ontario
🎓 [5/20] Science
📊 Progress: 45/260 (17.3%)
```

You'll see:

- Current province being scraped
- Current degree being scraped
- Overall progress percentage
- Success/failure for each combination

## What the UI Does

### Step 1: Province Selection

User selects their province from a grid of 13 options.

### Step 2: Degree Selection

User selects their target degree from a grid of 20 options.

### Step 3: View Requirements

System displays the unique requirements for that specific Province + Degree combination:

- ✅ General admission requirements
- ✅ Grade 12 required courses
- ✅ Grade 11 recommended courses
- ✅ Related subject areas
- ✅ Clickable course details
- ✅ Official UBC links

## Troubleshooting

### Scraper Errors

**Problem**: "Could not select degree"
**Solution**: The page might be loading slowly. The scraper already has 5-second waits, but you can increase them in `scrape_detailed_requirements.py` if needed.

**Problem**: "No specific requirements found"
**Solution**: Some province + degree combinations might not have detailed requirements on the UBC website. This is normal.

**Problem**: ChromeDriver errors
**Solution**: Install ChromeDriver:

```bash
brew install chromedriver  # macOS
```

### Data Not Showing

**Problem**: Requirements not appearing on website
**Solution**:

1. Check that `src/data/detailed_requirements.json` exists
2. Restart the dev server: `npm run dev`
3. Clear browser cache and reload

### Scraper Taking Too Long

**Problem**: Scraper is very slow
**Solution**:

- This is normal for 260 combinations
- You can reduce wait times in the code (but might miss data)
- Or scrape fewer provinces/degrees for testing

## Testing

### Test with Sample Data

Before running the full scrape, test with the existing sample data:

```bash
# Start dev server
npm run dev

# Visit http://localhost:5173/calculator
# Try selecting different provinces and degrees
```

### Verify Scraper Output

After scraping, check the data:

```bash
# View raw data
cat scraper/data/vancouver_detailed_requirements.json | jq '.provinces | keys'

# Count combinations
cat scraper/data/vancouver_detailed_requirements.json | jq '[.provinces[] | .degrees | keys] | add | unique | length'
```

## Performance Tips

1. **Run overnight**: The full scrape takes 40-60 minutes
2. **Check your internet**: Stable connection is important
3. **Don't interrupt**: Let it complete fully
4. **Monitor output**: Watch for errors in real-time

## Next Steps After Scraping

1. ✅ Verify data was saved to both locations
2. ✅ Restart dev server if running
3. ✅ Test the UI with different combinations
4. ✅ Check that all provinces and degrees are available
5. ✅ Verify requirements display correctly

## Data Update Schedule

Recommended to re-scrape:

- **Annually**: Before each admission cycle (September)
- **When notified**: If UBC updates their requirements
- **On request**: If users report missing/incorrect data

## Support

If you encounter issues:

1. Check the terminal output for specific errors
2. Verify all dependencies are installed
3. Ensure UBC website is accessible
4. Check the generated JSON files for data

---

**Ready to scrape?** Run:

```bash
cd /Users/yichenlin/Desktop/UBC_GO/scraper && ./RUN_FULL_SCRAPE.sh
```

🎉 The UI is already set up and ready to display the data once scraping is complete!
