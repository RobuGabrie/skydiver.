"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-10 rounded-lg bg-muted/30 animate-pulse",
          collapsed ? "w-10" : "w-full"
        )}
      />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
        "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
        "transition-colors duration-200 cursor-pointer w-full",
        collapsed && "justify-center px-0"
      )}
    >
      {isDark ? (
        <Sun className="w-4 h-4 shrink-0 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 shrink-0 text-blue-500" />
      )}
      {!collapsed && (
        <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
      )}
    </button>
  )
}
