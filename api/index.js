export default function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.status(200).json({})
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  res.status(200).json({
    name: "MobaPay MLBB Scanner API",
    version: "1.0.0",
    environment: "Vercel Serverless",
    endpoints: {
      "POST /api/scandb": {
        description: "Scan Mobile Legends player data",
        parameters: {
          gameid: "string (required) - Player Game ID",
          serverid: "string (required) - Server ID",
        },
        example: {
          gameid: "123456789",
          serverid: "1234",
        },
      },
      "GET /api/health": {
        description: "Health check endpoint",
      },
    },
    usage: {
      curl: `curl -X POST https://your-domain.vercel.app/api/scandb \\
  -H "Content-Type: application/json" \\
  -d '{"gameid":"123456789","serverid":"1234"}'`,
    },
  })
}
