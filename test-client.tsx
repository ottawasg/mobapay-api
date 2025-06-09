"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function TestClient() {
  const [gameid, setGameid] = useState("")
  const [serverid, setServerid] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  const API_BASE = process.env.NODE_ENV === "development" ? "http://localhost:3000/api" : "/api" // Will use your Vercel domain

  const testScan = async () => {
    if (!gameid || !serverid) {
      setError("Please enter both Game ID and Server ID")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/scandb`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gameid, serverid }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "An error occurred")
      }
    } catch (err) {
      setError("Network error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const testHealth = async () => {
    try {
      const response = await fetch(`${API_BASE}/health`)
      const data = await response.json()
      alert(`Health Check: ${data.status}\nTimestamp: ${data.timestamp}`)
    } catch (err) {
      alert("Health check failed: " + err.message)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>MobaPay MLBB Scanner Test</CardTitle>
          <CardDescription>Test your deployed API on Vercel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gameid">Game ID</Label>
              <Input
                id="gameid"
                value={gameid}
                onChange={(e) => setGameid(e.target.value)}
                placeholder="Enter Game ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serverid">Server ID</Label>
              <Input
                id="serverid"
                value={serverid}
                onChange={(e) => setServerid(e.target.value)}
                placeholder="Enter Server ID"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testScan} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Scanning..." : "Scan Player"}
            </Button>
            <Button variant="outline" onClick={testHealth}>
              Health Check
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scan Result</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Nickname:</strong> {result.data.nickname}
                  </p>
                  <p>
                    <strong>Game ID:</strong> {result.data.gameid}
                  </p>
                  <p>
                    <strong>Server ID:</strong> {result.data.serverid}
                  </p>
                  <p>
                    <strong>Response Time:</strong> {result.meta.responseTime}
                  </p>

                  <div>
                    <strong>Available Promos ({result.data.promoCount}):</strong>
                    {result.data.promos.length > 0 ? (
                      <ul className="list-disc list-inside mt-1">
                        {result.data.promos.map((promo, index) => (
                          <li key={index}>
                            {promo.display} - {promo.price}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 mt-1">No promos available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
