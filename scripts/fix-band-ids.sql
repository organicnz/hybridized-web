-- Fix null band_id values in episodes table by matching titles with band names

-- Update episodes where title starts with band name
UPDATE episodes e
SET band_id = b.id
FROM bands b
WHERE e.band_id IS NULL
  AND e.title ILIKE b.name || ' -%';

-- For remaining nulls, try matching anywhere in title
UPDATE episodes e
SET band_id = b.id
FROM bands b
WHERE e.band_id IS NULL
  AND e.title ILIKE '%' || b.name || '%'
  AND NOT EXISTS (
    SELECT 1 FROM bands b2 
    WHERE b2.id != b.id 
    AND e.title ILIKE '%' || b2.name || '%'
    AND length(b2.name) > length(b.name)
  );

-- Show results
SELECT 
  COUNT(*) as total_episodes,
  COUNT(band_id) as with_band_id,
  COUNT(*) - COUNT(band_id) as still_null
FROM episodes;
