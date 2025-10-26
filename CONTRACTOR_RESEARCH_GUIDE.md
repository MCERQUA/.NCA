# Contractor Research & Import Guide

This guide explains how to complete the research for all 209 contractors and import their NAP (Name, Address, Phone) information into the database.

## Overview

We have 209 contractors split into 21 batches of ~10 contractors each. Currently, **Batch 1 (10 contractors) is complete** with 90% success rate.

## Current Status

- ✅ Batch 1: Complete (9/10 updated successfully)
- ⏳ Batches 2-21: Pending research

## File Structure

```
temp/research-batches/
├── index.json                    # Master index of all batches
├── batch-1-prompt.txt            # Research prompt for batch 1
├── batch-1-contractors.json      # Contractor list for batch 1
├── batch-1-results.json          # ✅ COMPLETED - Research results
├── batch-2-prompt.txt            # Ready to process
├── batch-2-contractors.json
... (continues through batch-21)
```

## How to Continue Research

### Option 1: Using Gemini MCP Tool (Recommended - Automated)

1. Open Claude Code or continue this conversation
2. For each batch (2-21), run:
   ```
   Read the prompt from: temp/research-batches/batch-X-prompt.txt
   Use mcp__gemini__chat to process it
   Save the JSON response to: temp/research-batches/batch-X-results.json
   ```

3. After completing all batches, run the import:
   ```bash
   pnpm tsx scripts/import-research-results.ts
   ```

### Option 2: Manual Web Research

1. Open `temp/research-batches/batch-X-contractors.json`
2. For each contractor, search Google for:
   - Company name + "contact"
   - Company name + "phone number"
   - Company name + "address"
3. Fill in the template from `batch-X-prompt.txt`
4. Save results to `batch-X-results.json`

### Option 3: Use External Research Service

1. Upload the prompts to ChatGPT, Claude, or a VA service
2. Have them return the JSON formatted results
3. Save each batch's results to the appropriate file

## Sample Workflow (Processing One Batch)

```typescript
// 1. Read the prompt
const prompt = fs.readFileSync('temp/research-batches/batch-2-prompt.txt', 'utf-8');

// 2. Use Gemini to research (or use web search manually)
const results = await geminiChat(prompt);

// 3. Parse and save results
const jsonResults = JSON.parse(results.match(/```json\n([\s\S]*?)\n```/)[1]);
fs.writeFileSync('temp/research-batches/batch-2-results.json', JSON.stringify(jsonResults, null, 2));

// 4. Import to database
// Run: pnpm tsx scripts/import-research-results.ts
```

## Import Script Features

The import script (`scripts/import-research-results.ts`) automatically:

- ✅ Matches research results to existing contractors in database
- ✅ Updates phone, email, website, address fields
- ✅ Geocodes addresses to get lat/lng coordinates (requires Google Maps API key)
- ✅ Updates business descriptions and years in business
- ✅ Handles DBAs and name variations
- ✅ Provides detailed progress reporting
- ✅ Skips contractors where no info was found

## Adding Google Maps API Key (for Geocoding)

To enable automatic geocoding of addresses:

1. Get a Google Maps API key from Google Cloud Console
2. Enable the Geocoding API
3. Add to apps/web/.env:
   ```
   PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
4. Re-run the import script

Without the API key, contractors will still be updated with contact info, but won't appear on the map.

## Verification

After importing, verify the updates:

```bash
# Check how many contractors have complete data
pnpm tsx scripts/verify-import.ts

# Build the site to see contractors with addresses on map
pnpm build

# Check specific contractor
psql $DATABASE_URL -c "SELECT name, phone, website, city, state, latitude, longitude FROM contractors WHERE name LIKE '%Kelcon%';"
```

## Expected Results

After all 21 batches are processed:

- **~200 contractors** with complete NAP information
- **~180 contractors** with geocoded coordinates (appearing on map)
- **~200 contractors** with phone numbers and websites
- **~150 contractors** with email addresses

## Automation Script (Future)

For future imports, you can create an automated script:

```bash
#!/bin/bash
for i in {2..21}; do
  echo "Processing batch $i..."
  # Use Gemini API or web scraping service
  # Save results
  # Small delay between batches
  sleep 5
done

# Import all at once
pnpm tsx scripts/import-research-results.ts
```

## Troubleshooting

**"No existing contractor found"**: The name in research results doesn't match database. Check for:
- Extra punctuation or spacing
- DBA vs legal name mismatch
- Typos

**"Geocoding failed"**: Address may be incomplete or invalid. Can manually add coordinates later.

**Rate limiting**: If using Google Maps API, script includes 200ms delay between requests.

## Next Steps

1. **Continue research**: Process remaining 20 batches (batches 2-21)
2. **Import results**: Run import script after each batch or all at once
3. **Deploy**: Rebuild and deploy site with updated contractor data
4. **Verify map**: Check that contractors with addresses appear on homepage map

## Files Reference

- `scripts/gemini-research-contractors.ts` - Creates batch files
- `scripts/import-research-results.ts` - Imports JSON results to database
- `scripts/verify-import.ts` - Verifies contractor data completeness
- `temp/research-batches/` - All batch prompts and results
- `temp/companies_directory_data-2025.csv` - Original contractor list

---

**Current Progress**: 10/209 contractors (4.8%) have complete NAP data
**Estimated Time**: ~2-3 hours for all batches using Gemini (5-10 min per batch)
**Manual Time**: ~10-15 hours if researching manually
