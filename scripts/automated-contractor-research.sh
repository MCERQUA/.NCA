#!/bin/bash
#
# Automated Contractor Research Script
# Runs every hour via cron to research 20 contractors with Unknown addresses
# Uses Gemini API to find complete NAP (Name, Address, Phone) data
#

set -e  # Exit on error

# Navigate to project directory
cd /mnt/HC_Volume_103321268/isolated-projects/NCA

# Log file for tracking progress
LOG_FILE="/mnt/HC_Volume_103321268/isolated-projects/NCA/logs/contractor-research.log"
LOG_DIR="/mnt/HC_Volume_103321268/isolated-projects/NCA/logs"

# Create log directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log messages with timestamp
log_message() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S %Z')] $1" | tee -a "$LOG_FILE"
}

log_message "========================================="
log_message "Starting automated contractor research"
log_message "========================================="

# Check if there are contractors left to research
UNKNOWN_COUNT=$(npx tsx scripts/count-unknown-contractors.ts 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")

log_message "Found $UNKNOWN_COUNT contractors with Unknown addresses"

if [ "$UNKNOWN_COUNT" -eq 0 ]; then
    log_message "✅ All contractors have been researched! No more work to do."
    log_message "========================================="
    exit 0
fi

# Run the research script for next batch of 20 contractors
log_message "🔍 Starting research for next batch (max 20 contractors)..."

if npx tsx scripts/automated-research-batch.ts >> "$LOG_FILE" 2>&1; then
    log_message "✅ Research batch completed successfully"

    # Count remaining unknown contractors
    REMAINING=$(npx tsx scripts/count-unknown-contractors.ts 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")
    log_message "📊 Remaining contractors to research: $REMAINING"

    # If we're done, log completion
    if [ "$REMAINING" -eq 0 ]; then
        log_message "🎉 ALL CONTRACTORS RESEARCHED! Cron job can be disabled."
        log_message "========================================="

        # Optionally trigger a Netlify rebuild
        log_message "Triggering Netlify rebuild to show all contractors..."
        cd /mnt/HC_Volume_103321268/isolated-projects/NCA
        if git diff --quiet apps/web/src/pages/index.astro; then
            # Add a comment to trigger rebuild
            echo "# Rebuild triggered: $(date)" >> apps/web/src/pages/index.astro
            git add apps/web/src/pages/index.astro
            git commit -m "Automated rebuild: All $UNKNOWN_COUNT contractors researched and imported"
            git push origin main
            log_message "✅ Netlify rebuild triggered"
        fi
    fi
else
    log_message "❌ Research batch failed - check logs for details"
    log_message "========================================="
    exit 1
fi

log_message "========================================="
