#!/bin/bash
# Batch scraper for all UBC Science majors
# Make sure you have activated your virtual environment first!

# List of all Science majors
majors=(
    "Astronomy"
    "Atmospheric Science"
    "Behavioural Neuroscience"
    "Biochemistry"
    "Biology"
    "Biotechnology"
    "Botany"
    "Cellular and Physiological Sciences"
    "Chemistry"
    "Cognitive Systems"
    "Combined Major in Science"
    "Computer Science"
    "Data Science"
    "Earth and Ocean Sciences"
    "Environmental Sciences"
    "Forensic Science"
    "General Science"
    "Geographical Sciences"
    "Geological Sciences"
    "Geophysics"
    "Integrated Sciences"
    "Mathematics"
    "Microbiology and Immunology"
    "Neuroscience"
    "Oceanography"
    "Pharmacology"
    "Physics"
    "Statistics"
    "Zoology"
)

echo "============================================================"
echo "UBC Science Majors Batch Scraper"
echo "============================================================"
echo "Total majors to scrape: ${#majors[@]}"
echo "============================================================"

successful=()
failed=()

for i in "${!majors[@]}"; do
    major="${majors[$i]}"
    num=$((i + 1))
    echo ""
    echo "[$num/${#majors[@]}] Scraping: $major"
    echo "============================================================"
    
    if python scraper/curriculum/scrape_single_science_major.py "$major"; then
        successful+=("$major")
        echo "✓ Successfully scraped: $major"
    else
        failed+=("$major")
        echo "✗ Failed to scrape: $major"
    fi
done

# Summary
echo ""
echo "============================================================"
echo "SCRAPING SUMMARY"
echo "============================================================"
echo "Total majors: ${#majors[@]}"
echo "Successful: ${#successful[@]}"
echo "Failed: ${#failed[@]}"

if [ ${#successful[@]} -gt 0 ]; then
    echo ""
    echo "✓ Successfully scraped majors:"
    for major in "${successful[@]}"; do
        echo "  - $major"
    done
fi

if [ ${#failed[@]} -gt 0 ]; then
    echo ""
    echo "✗ Failed majors:"
    for major in "${failed[@]}"; do
        echo "  - $major"
    done
    echo ""
    echo "You can retry failed majors individually:"
    for major in "${failed[@]}"; do
        echo "  python scraper/curriculum/scrape_single_science_major.py \"$major\""
    done
fi

echo "============================================================"

