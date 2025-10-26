#!/bin/bash
#
# Automated hourly contractor research using existing Gemini workflow
# Researches next 20 contractors with Unknown addresses
#

set -e

cd /mnt/HC_Volume_103321268/isolated-projects/NCA

LOG_FILE="logs/auto-research.log"
mkdir -p logs

log() {
    echo "[$(TZ='America/Toronto' date +'%Y-%m-%d %I:%M:%S %p EST')] $1" | tee -a "$LOG_FILE"
}

log "========== Starting Automated Research =========="

# Count unknown contractors
UNKNOWN=$(npx tsx scripts/count-unknown-contractors.ts 2>/dev/null || echo "0")
log "Unknown contractors remaining: $UNKNOWN"

if [ "$UNKNOWN" -eq "0" ]; then
    log "✅ All contractors researched! Disabling cron job..."
    # Comment out the cron job
    (crontab -l | grep -v "auto-research-next-batch.sh" || true) | crontab -
    log "Cron job disabled."
    exit 0
fi

# Create batch for next 20 Unknown contractors
log "Creating research batch for next 20 contractors..."
npx tsx scripts/create-unknown-batch.ts >> "$LOG_FILE" 2>&1

# Get the batch number that was just created
BATCH_NUM=$(ls temp/research-batches/batch-*-prompt.txt 2>/dev/null | wc -l)

log "Processing batch #$BATCH_NUM with Gemini..."

# Note: This requires manual Gemini MCP processing
# The script prepares the batch, user processes with Gemini, then import runs
log "⚠️  Batch created at temp/research-batches/batch-$BATCH_NUM-prompt.txt"
log "⚠️  Waiting for manual Gemini processing..."
log "⚠️  After processing, save results to batch-$BATCH_NUM-results.json"

log "========== Automation Paused for Manual Step =========="
