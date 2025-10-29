# ✅ Autonomous Automation - Final Setup Instructions

## 🎯 Status: READY TO RUN

Everything is set up and ready. You just need to add ONE environment variable and the system will run completely autonomously every hour.

---

## 📝 ONE-TIME SETUP (5 minutes)

### Step 1: Get Gemini API Key

1. Open https://aistudio.google.com/apikey in your browser
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIza...`)

### Step 2: Add API Key to Environment

```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA
nano apps/web/.env
```

Find this line at the bottom:
```
GEMINI_API_KEY=your-key-here
```

Replace `your-key-here` with your actual Gemini API key:
```
GEMINI_API_KEY=AIzaSyABC123...your-actual-key
```

Save and exit:
- Press `Ctrl+X`
- Press `Y` (yes)
- Press `Enter`

### Step 3: Test It Works

Run one batch manually to verify:
```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA
npx tsx scripts/standalone-gemini-automation.ts
```

**Expected output:**
```
🤖 STANDALONE AUTONOMOUS AUTOMATION
📊 Found 20 contractors to research
🔍 Calling Gemini API directly...
✅ Gemini response received
✅ Parsed 20 contractor results
📥 Importing 20 research results...
✅ Updated: [contractor names...]
🚀 Deploying to Netlify...
✅ Pushed to GitHub - Netlify deploying...
⏱️  Total time: 45.2s
```

If you see this, **YOU'RE DONE!** The automation is working.

---

## ⚙️ How It Works (No Action Needed)

### Automatic Schedule

The cron job runs **every hour on the hour**:
- 1:00 AM, 2:00 AM, 3:00 AM, etc. (EST)

### What Happens Each Hour

1. **Finds** next 20 contractors with Unknown addresses
2. **Calls Gemini API** directly (no Claude Code needed)
3. **Researches** NAP data (Name, Address, Phone)
4. **Imports** to database with geocoding
5. **Deploys** to GitHub → Netlify builds
6. **20 contractors go LIVE** on website!

### When Complete

After ~6 hours (108 contractors ÷ 20 per hour):
```
✅ All contractors researched!
🎉 AUTOMATION COMPLETE!
```

The cron continues running but exits immediately (no work to do).

---

## 📊 Current Status

```
Total Contractors:           212
✅ With Addresses:           104 (49%)
📍 With Coordinates:         92 (43%)
❌ Still Unknown:            108 (51%)

Remaining Work:
- 108 contractors to research
- ~6 batches (20 each)
- ~6 hours total
```

---

## 🔍 Monitoring (Optional)

### Check Progress
```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA

# How many contractors left?
npx tsx scripts/count-unknown-contractors.ts

# View automation log (live)
tail -f logs/standalone-automation.log

# Check recent deployments
git log --oneline -5
```

### Verify Cron is Running
```bash
# View cron jobs
crontab -l | grep NCA

# Check cron execution log
grep CRON /var/log/syslog | grep standalone | tail -10

# Check last run time
ls -lh logs/standalone-automation.log
```

---

## 🎉 What You'll Wake Up To

After you add the API key and go to sleep:

### Tonight (Automated):
- ✅ Cron runs every hour automatically
- ✅ Researches 20 contractors per batch
- ✅ Imports with geocoding
- ✅ Deploys to production
- ✅ Repeats until done

### Tomorrow Morning:
- ✅ **All 212 contractors** have addresses
- ✅ **Website** shows complete directory
- ✅ **Map** displays all contractor locations
- ✅ **Search** works with real data
- ✅ **SEO** optimized with complete NAP data

---

## 🛠️ Troubleshooting

### "GEMINI_API_KEY not found"
**Fix**: Double-check you added the key to `apps/web/.env`

### "Invalid API key"
**Fix**: Generate a new key at https://aistudio.google.com/apikey

### "Quota exceeded"
**Fix**: Gemini free tier has limits. Wait 1 hour or upgrade account.

### Cron not running
**Check if cron service is active**:
```bash
sudo systemctl status cron
```

**Run manually to test**:
```bash
cd /mnt/HC_Volume_103321268/isolated-projects/NCA
npx tsx scripts/standalone-gemini-automation.ts
```

---

## 📂 Important Files

- **Main Script**: `scripts/standalone-gemini-automation.ts`
- **Setup Guide**: `AUTONOMOUS_SETUP_GUIDE.md` (detailed docs)
- **Log File**: `logs/standalone-automation.log`
- **Cron Job**: `crontab -l` to view
- **Environment**: `apps/web/.env` (add API key here)

---

## 🚀 Quick Start Summary

```bash
# 1. Get API key from https://aistudio.google.com/apikey

# 2. Add to .env file
cd /mnt/HC_Volume_103321268/isolated-projects/NCA
nano apps/web/.env
# Add: GEMINI_API_KEY=AIzaSy...your-key

# 3. Test it works
npx tsx scripts/standalone-gemini-automation.ts

# 4. Go to sleep - automation runs hourly
```

---

## ✅ Verification Checklist

Before going to sleep, verify:

- [ ] Gemini API key added to `apps/web/.env`
- [ ] Test run completed successfully
- [ ] Cron job is installed (`crontab -l | grep NCA`)
- [ ] You're in EST timezone (cron runs on system time)

Once verified, **you're done!** The automation will run independently every hour until all 108 contractors are researched.

---

**Created**: 2025-10-26
**Type**: Fully Autonomous (no Claude Code or terminal needed)
**Runtime**: ~6 hours
**Completion**: Automatic

Sweet dreams! 😴
