#!/bin/sh

# Count episodes in each playlist from context/public-playlists-bands.md
# Uses the sync-firstory edge function to get accurate counts

echo "Counting episodes in each band's playlist..."
echo ""
echo "Band Name | Episodes"
echo "----------|----------"

# Read the file and extract playlist IDs
while IFS= read -r line; do
  # Skip empty lines
  if [ -z "$line" ]; then
    continue
  fi
  
  # Extract band name and playlist ID
  band_name=$(echo "$line" | sed 's/ https:.*//')
  playlist_id=$(echo "$line" | grep -o 'playlist=[^[:space:]]*' | cut -d= -f2)
  
  if [ -n "$playlist_id" ]; then
    # Fetch the playlist page
    html=$(curl -s "https://hybridized.firstory.io/episodes?playlist=$playlist_id")
    
    # Try multiple patterns to find episode IDs
    # Pattern 1: Look for episode IDs in the HTML
    count=$(echo "$html" | grep -o 'cl[a-z0-9]\{24\}' | sort -u | wc -l | tr -d ' ')
    
    # If no episodes found, try looking in JSON data
    if [ "$count" = "0" ]; then
      count=$(echo "$html" | grep -o '"id":"cl[a-z0-9]*"' | cut -d'"' -f4 | sort -u | wc -l | tr -d ' ')
    fi
    
    printf "%-20s | %s\n" "$band_name" "$count"
    
    # Small delay to be polite
    sleep 0.3
  fi
done < context/public-playlists-bands.md

echo ""
echo "Note: Counts may be 0 if pages are JavaScript-rendered."
echo "Run the sync-firstory edge function for accurate counts."
