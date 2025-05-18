"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeDebug() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg z-50 text-xs">
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <p>Theme: {theme}</p>
      <p>Resolved Theme: {resolvedTheme}</p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => setTheme("light")} className="px-2 py-1 bg-secondary rounded">
          Set Light
        </button>
        <button onClick={() => setTheme("dark")} className="px-2 py-1 bg-secondary rounded">
          Set Dark
        </button>
        <button onClick={() => setTheme("system")} className="px-2 py-1 bg-secondary rounded">
          Set System
        </button>
      </div>
    </div>
  )
}
