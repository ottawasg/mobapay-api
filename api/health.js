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
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: "Vercel Serverless",
    version: "1.0.0",
  })
}
