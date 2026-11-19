# NIAT CampusMatch - AI lead engine (Track A)
Flow: 6-language web tool -> Claude API (campus match, intent score, objection answer) -> n8n webhook -> Google Sheet -> WhatsApp sequence.
Deploy: import this repo in Vercel. Add env vars ANTHROPIC_API_KEY and N8N_WEBHOOK_URL. Import n8n-workflow.json into n8n.
Without keys the tool still works in rules mode. Campus fees are indicative; confirm on niatindia.com.
