const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
const chromium = require("chrome-aws-lambda")

puppeteer.use(StealthPlugin())

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).json({})
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    })
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

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

    // Launch browser with Vercel-compatible settings
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-extensions",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    const page = await browser.newPage()

    // Set user agent and viewport
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    )
    await page.setViewport({ width: 1366, height: 768 })

    await page.goto("https://www.mobapay.com/mlbb/?r=ID", {
      waitUntil: "domcontentloaded",
      timeout: 25000, // Reduced timeout for Vercel
    })

    // Close popup if exists
    try {
      await page.waitForSelector("div._closeWrapper_qlk4j_23", { timeout: 3000 })
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => {
          const btn = document.querySelector("div._closeWrapper_qlk4j_23")
          if (btn) btn.click()
        })
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    } catch (e) {
      console.log("No popup to close")
    }

    // Input game ID
    await page.waitForSelector("#userInput", { timeout: 8000 })
    await page.click("#userInput", { clickCount: 3 })
    await page.keyboard.press("Backspace")
    await page.type("#userInput", gameid, { delay: 50 })
    await page.keyboard.press("Tab")
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Input server ID
    await page.waitForSelector("#serverInput", { timeout: 8000 })
    await page.click("#serverInput", { clickCount: 3 })
    await page.keyboard.press("Backspace")
    await page.type("#serverInput", serverid, { delay: 50 })
    await page.keyboard.press("Tab")
    await new Promise((resolve) => setTimeout(resolve, 2000))

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
        { timeout: 12000 },
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

    return res.status(200).json({
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

    return res.status(500).json({
      error: `Gagal scan: ${err.message}`,
      code: "SCAN_ERROR",
      gameid,
      serverid,
    })
  }
}
