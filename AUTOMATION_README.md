# Automated Contractor Research System

## Overview

This system automatically researches and imports contractor contact information every hour until all 157 contractors with "Unknown" addresses are completed.

## How It Works

### Automated Workflow (Every Hour)

1. **Find Unknown Contractors** (5:05 AM/PM EST, every hour)
   - Queries database for next 20 contractors with `city='Unknown'` or `state='Unknown'`
   - If none found, automation stops (all done!)

2. **Research with Gemini MCP**
   - Creates research prompt for 20 contractors
   - **MANUAL STEP**: Process prompt with Gemini MCP tool
   - Save JSON results to: `temp/latest-research-results.json`

3. **Import to Database**
   - Reads research results
   - Geocodes addresses using Google Maps API
   - Updates contractor records with:
     - Complete address (street, city, state, ZIP)
     - Phone number, email, website
     - Business description
     - Latitude/longitude coordinates

4. **Deploy to Production**
   - Updates `index.astro` to trigger rebuild
   - Commits changes to GitHub
   - Pushes to main branch
   - Netlify auto-deploys (2-3 minutes)
   - **Result**: 20 more contractors go LIVE on the website!

### Cron Schedule

```cron
5 * * * * /usr/bin/npx tsx scripts/hourly-contractor-automation.ts >> logs/hourly-automation.log 2>&1
```

**Runs at**: 12:05 AM, 1:05 AM, 2:05 AM, 3:05 AM, etc. (EST)

## Files & Scripts

### Main Automation Script
- **`scripts/hourly-contractor-automation.ts`** - Complete end-to-end automation

### Helper Scripts
- **`scripts/count-unknown-contractors.ts`** - Count contractors needing research
- **`scripts/create-unknown-batch.ts`** - Create research batch from database
- **`scripts/import-research-results.ts`** - Import results into database (already existed)

### Logs
- **`logs/hourly-automation.log`** - Automation execution log
- **`logs/contractor-research.log`** - Research import log

## Manual Steps Required

The automation script will pause and display:

```
⚠️  MANUAL STEP REQUIRED:
   Use Gemini MCP with this prompt:

[Contractor list and research prompt]

📝 Save Gemini response to: temp/latest-research-results.json
   Then re-run this script to auto-import and deploy.
```

### How to Complete Manual Step

1. Copy the Gemini prompt from the log
2. Open Claude Code with Gemini MCP enabled
3. Paste prompt and let Gemini research
4. Save the JSON response to `temp/latest-research-results.json`
5. Script will auto-detect file and continue with import + deploy

## Monitoring Progress

### Check How Many Left
```bash
npx tsx scripts/count-unknown-contractors.ts
```

### View Automation Log
```bash
tail -f logs/hourly-automation.log
```

### View Cron Status
```bash
crontab -l
```

## Timeline Estimate

- **Total contractors to research**: 157
- **Batch size**: 20 contractors/hour
- **Total runtime**: ~8 hours (157 ÷ 20 = 7.85 hours)
- **Completion**: All contractors will be live within 8 hours

## What Happens When Done

When the last contractor is researched:

```
✅ All contractors have been researched!
🎉 AUTOMATION COMPLETE - All 212 contractors now have addresses!
```

The cron job will continue running but will immediately exit with success status.

## Troubleshooting

### Cron Job Not Running
```bash
# Check cron service is active
sudo systemctl status cron

# Check cron logs
grep CRON /var/log/syslog | tail -20
```

### Manually Run Script
```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA
npx tsx scripts/hourly-contractor-automation.ts
```

### Database Connection Issues
- Verify `.env` has `NETLIFY_DATABASE_URL` or `DATABASE_URL`
- Test with: `npx tsx scripts/count-unknown-contractors.ts`

### Geocoding Failures
- Check `PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env`
- Contractors without valid addresses will skip geocoding

## Disable Automation

To stop the hourly cron job:

```bash
crontab -l | grep -v "hourly-contractor-automation" | crontab -
```

## Re-enable Automation

```bash
(crontab -l 2>/dev/null; echo "# NCA Contractor Research - Every hour at :05
5 * * * * /usr/bin/npx tsx scripts/hourly-contractor-automation.ts >> logs/hourly-automation.log 2>&1") | crontab -
```

## Current Status

- **Contractors with addresses**: 55/212 (26%)
- **Contractors needing research**: 157/212 (74%)
- **Automation**: ✅ Active (runs hourly at :05)
- **Next run**: Check `crontab -l` and server time

---

**Created**: 2025-10-26
**Last Updated**: 2025-10-26
**Automation Type**: Semi-automated (requires manual Gemini step)
