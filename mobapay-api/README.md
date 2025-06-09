# MobaPay MLBB Scanner API

A Node.js API that scrapes Mobile Legends player data from MobaPay using Puppeteer.

## Features

- 🔍 Scan Mobile Legends player data by Game ID and Server ID
- 🛡️ Rate limiting and CORS protection
- 📊 Health check endpoint
- 🚀 Auto-generated API documentation
- ⚡ Enhanced error handling and logging

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

### Development
\`\`\`bash
npm run dev
\`\`\`

### Production
\`\`\`bash
npm start
\`\`\`

## API Endpoints

### POST /scandb
Scan Mobile Legends player data.

**Request Body:**
\`\`\`json
{
  "gameid": "123456789",
  "serverid": "1234"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "nickname": "PlayerName",
    "gameid": "123456789",
    "serverid": "1234",
    "promos": [
      {
        "diamonds": "50",
        "bonus": "50",
        "price": "Rp 15.000",
        "display": "50 +50 Diamonds"
      }
    ],
    "promoCount": 1
  },
  "meta": {
    "responseTime": "3245ms",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
\`\`\`

### GET /health
Health check endpoint.

### GET /
API documentation.

## Environment Variables

- `PORT` - Server port (default: 3000)

## Testing

\`\`\`bash
npm test
\`\`\`

## Deployment

This API can be deployed to:
- Vercel
- Railway
- Heroku
- DigitalOcean
- Any Node.js hosting service

## Notes

- Uses Puppeteer with stealth plugin to avoid detection
- Includes rate limiting (100 requests per 15 minutes per IP)
- Handles graceful shutdown
- Enhanced error handling and logging
