const axios = require("axios")

const API_BASE = "http://localhost:3000"

async function testAPI() {
  console.log("🧪 Testing MobaPay API...\n")

  try {
    // Test health endpoint
    console.log("1. Testing health endpoint...")
    const healthResponse = await axios.get(`${API_BASE}/health`)
    console.log("✅ Health check:", healthResponse.data)

    // Test API documentation
    console.log("\n2. Testing documentation endpoint...")
    const docsResponse = await axios.get(`${API_BASE}/`)
    console.log("✅ Documentation loaded")

    // Test scandb endpoint with sample data
    console.log("\n3. Testing scandb endpoint...")
    const scanResponse = await axios.post(`${API_BASE}/scandb`, {
      gameid: "123456789", // Replace with valid test data
      serverid: "1234", // Replace with valid test data
    })
    console.log("✅ Scan result:", scanResponse.data)
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message)
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI()
}

module.exports = { testAPI }
