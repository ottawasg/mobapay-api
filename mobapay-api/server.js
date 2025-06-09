const express = require("express")
const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
const cors = require("cors")
const rateLimit = require("express-rate-limit")

puppeteer.use(StealthPlugin())

const app = express()

// Middleware
app.use(express.json())
app.use(cors())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
})
app.use(limiter)

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// API documentation endpoint
app.get("/", (req, res) => {
  res.json({
    name: "MobaPay MLBB Scanner API",
    version: "1.0.0",
    endpoints: {
      "POST /scandb": {
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
      "GET /health": {
        description: "Health check endpoint",
      },
    },
  })
})

// Your existing scandb endpoint with improvements
app.post("/scandb", async (req, res) => {
  const startTime = Date.now()
  const { gameid, serverid } = req.body

  // Enhanced validation
  if (!gameid || !serverid) {
    return res.status(400).json({
      error: "gameid dan serverid wajib diisi.",
      code: "MISSING_PARAMETERS",
    })
  }

  // Validate input format
  if (!/^\d+$/.test(gameid) || !/^\d+$/.test(serverid)) {
    return res.status(400).json({
      error: "gameid dan serverid harus berupa angka.",
      code: "INVALID_FORMAT",
    })
  }

  let browser

  try {
    console.log(`🔍 Scanning player: ${gameid} (Server: ${serverid})`)

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    })

    const page = await browser.newPage()

    // Set user agent and viewport
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    )
    await page.setViewport({ width: 1366, height: 768 })

    await page.goto("https://www.mobapay.com/mlbb/?r=ID", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    })

    // Close popup if exists
    try {
      await page.waitForSelector("div._closeWrapper_qlk4j_23", { timeout: 5000 })
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => {
          const btn = document.querySelector("div._closeWrapper_qlk4j_23")
          if (btn) btn.click()
        })
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    } catch (e) {
      console.log("No popup to close")
    }

    // Input game ID
    await page.waitForSelector("#userInput", { timeout: 10000 })
    await page.click("#userInput", { clickCount: 3 })
    await page.keyboard.press("Backspace")
    await page.type("#userInput", gameid, { delay: 100 })
    await page.keyboard.press("Tab")
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Input server ID
    await page.waitForSelector("#serverInput", { timeout: 10000 })
    await page.click("#serverInput", { clickCount: 3 })
    await page.keyboard.press("Backspace")
    await page.type("#serverInput", serverid, { delay: 100 })
    await page.keyboard.press("Tab")
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Wait for player data
    let playerName
    try {
      await page.waitForFunction(
        () => {
          const playerDiv = document.querySelector("div.mobapay-user-character")
          if (!playerDiv) return false
          const nameSpan = playerDiv.querySelector(
            "span.mobapay-user-character-name.mobapay-user-character-name-success span",
          )
          return nameSpan && nameSpan.textContent.trim().length > 0
        },
        { timeout: 15000 },
      )

      playerName = await page.$eval(
        "div.mobapay-user-character span.mobapay-user-character-name.mobapay-user-character-name-success span",
        (el) => el.textContent.trim(),
      )
    } catch (e) {
      await browser.close()
      return res.status(404).json({
        error: "Player tidak ditemukan atau ID/Server salah.",
        code: "PLAYER_NOT_FOUND",
        gameid,
        serverid,
      })
    }

    // Get available promos
    const promos = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll(".mobapay-recharge-item"))
      const allowed = [
        { diamonds: "50", bonus: "50" },
        { diamonds: "150", bonus: "150" },
        { diamonds: "250", bonus: "250" },
        { diamonds: "500", bonus: "500" },
      ]
      const result = []

      items.forEach((item) => {
        const diamonds = item.getAttribute("data-diamonds")
        const bonus = item.getAttribute("data-bonus")?.replace("+", "")
        const price = item.querySelector(".mobapay-recharge-item-price-now")?.textContent.trim()

        const isAllowed = allowed.some((p) => p.diamonds === diamonds && p.bonus === bonus)
        const hasLimit = item.innerText.includes("Purchase limit reached.")

        if (isAllowed && price && !hasLimit) {
          result.push({
            diamonds: diamonds,
            bonus: bonus,
            price: price,
            display: `${diamonds} +${bonus} Diamonds`,
          })
        }
      })

      return result
    })

    await browser.close()

    const responseTime = Date.now() - startTime
    console.log(`✅ Scan completed in ${responseTime}ms for player: ${playerName}`)

    res.json({
      success: true,
      data: {
        nickname: playerName,
        gameid,
        serverid,
        promos: promos.length > 0 ? promos : [],
        promoCount: promos.length,
      },
      meta: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error("❌ Scan error:", err.message)

    if (browser) {
      await browser.close()
    }

    res.status(500).json({
      error: `Gagal scan: ${err.message}`,
      code: "SCAN_ERROR",
      gameid,
      serverid,
    })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    code: "NOT_FOUND",
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ API Server jalan di http://localhost:${PORT}`)
  console.log(`📖 API Documentation: http://localhost:${PORT}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  process.exit(0)
})
