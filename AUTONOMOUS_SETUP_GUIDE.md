# Autonomous Automation Setup Guide

## Overview

This system runs **completely autonomously** without needing Claude Code or any terminal session. It uses the Gemini API directly via HTTP requests.

## One-Time Setup

### Step 1: Get Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### Step 2: Add API Key to Environment

Edit `.env` file:
```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA
nano apps/web/.env
```

Add this line (replace with your actual key):
```
GEMINI_API_KEY=AIzaSy...your-actual-key-here
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Test the Script

Run one batch manually to verify it works:
```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA
npx tsx scripts/standalone-gemini-automation.ts
```

You should see:
```
🤖 STANDALONE AUTONOMOUS AUTOMATION
📊 Found 20 contractors to research
🔍 Calling Gemini API directly...
✅ Gemini response received
✅ Parsed 20 contractor results
📥 Importing 20 research results...
✅ Updated: [contractor names]
🚀 Deploying to Netlify...
✅ Pushed to GitHub - Netlify deploying...
```

### Step 4: Verify Cron Job

Check that cron job is installed:
```bash
crontab -l | grep standalone-gemini
```

Should show:
```
0 * * * * cd /mnt/HC_Volume_103321268/isolated-projects/NCA && npx tsx scripts/standalone-gemini-automation.ts >> logs/standalone-automation.log 2>&1
```

## How It Works

### Every Hour (on the hour: 12:00, 1:00, 2:00, etc.)

1. **Find Next 20 Contractors** with Unknown addresses
2. **Call Gemini API** directly (no MCP, no Claude Code needed)
3. **Import Results** with geocoding
4. **Deploy to GitHub** → Netlify auto-builds
5. **20 More Contractors Go LIVE**

### Complete Autonomy

- ✅ Runs in background (no terminal needed)
- ✅ No Claude Code session required
- ✅ Uses Gemini API directly via HTTPS
- ✅ Logs everything to `logs/standalone-automation.log`
- ✅ Stops automatically when all contractors are done

## Monitoring

### Check Progress
```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA

# How many left?
npx tsx scripts/count-unknown-contractors.ts

# View automation log
tail -f logs/standalone-automation.log

# Check last deployment
git log --oneline -5
```

### Check Cron Status
```bash
# View cron log
grep standalone-gemini /var/log/syslog | tail -20

# Check if cron ran recently
ls -lht logs/standalone-automation.log
```

## Timeline

- **Remaining**: 108 contractors
- **Batch size**: 20 per hour
- **Total time**: ~6 hours (108 ÷ 20 = 5.4 batches)
- **Completion**: Automatically stops when done

## When Complete

The script will log:
```
✅ All contractors researched!
🎉 AUTOMATION COMPLETE!
```

The cron job will continue running but will exit immediately each hour with success status (no changes made).

## Troubleshooting

### Gemini API Errors

**Error**: "GEMINI_API_KEY not found"
- **Fix**: Add API key to `apps/web/.env`

**Error**: "Invalid API key"
- **Fix**: Generate new key at https://aistudio.google.com/apikey

**Error**: "Quota exceeded"
- **Fix**: Gemini has free tier limits. Wait or upgrade account.

### Cron Not Running

**Check cron is active**:
```bash
sudo systemctl status cron
```

**Check cron log**:
```bash
grep CRON /var/log/syslog | tail -20
```

**Manually run to test**:
```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA
npx tsx scripts/standalone-gemini-automation.ts
```

### Database Connection Issues

**Error**: "DATABASE_URL not found"
- **Fix**: Ensure `NETLIFY_DATABASE_URL` is in `apps/web/.env`

### Git Push Failures

**Error**: "Permission denied (publickey)"
- **Fix**: Ensure Git SSH keys are configured
- **Test**: `git push origin main` manually

## Disable Automation

To stop the hourly cron job:
```bash
crontab -l | grep -v "standalone-gemini-automation" | crontab -
```

## Re-enable Automation

```bash
(crontab -l 2>/dev/null; echo "# NCA Standalone Automation - Every hour
0 * * * * cd /mnt/HC_Volume_103321268/isolated-projects/NCA && npx tsx scripts/standalone-gemini-automation.ts >> logs/standalone-automation.log 2>&1") | crontab -
```

## Files

- **Main Script**: `scripts/standalone-gemini-automation.ts`
- **Log File**: `logs/standalone-automation.log`
- **Results**: `temp/research-batches/batch-N-results.json`
- **Cron Job**: `crontab -l`

## Support

If automation fails:
1. Check `logs/standalone-automation.log` for errors
2. Verify Gemini API key is valid
3. Test script manually: `npx tsx scripts/standalone-gemini-automation.ts`
4. Check remaining count: `npx tsx scripts/count-unknown-contractors.ts`

---

**Created**: 2025-10-26
**Status**: Ready to use (just add Gemini API key)
**Type**: Fully autonomous (no Claude Code needed)
