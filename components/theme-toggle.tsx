"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled className="glass-button">
        <span className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Loading theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="glass-button"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-transform duration-500 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-transform duration-500" />
      )}
      <span className="sr-only">{resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}</span>
    </Button>
  )
}
