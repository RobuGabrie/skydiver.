"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, BarChart3, Bell,
  Wifi, Settings, ChevronLeft, ChevronRight, Wind,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "./theme-toggle"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard", badge: null },
  { href: "/skydivers", icon: Users, label: "Skydivers", badge: null },
  { href: "/analytics", icon: BarChart3, label: "AI Analytics", badge: null },
  { href: "/alerts", icon: Bell, label: "Alerts", badge: 3 },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-sidebar-border", collapsed && "justify-center px-0")}>
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 glow-blue">
          <Wind className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold text-foreground font-mono">SKYDIVER</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Monitor</p>
          </div>
        )}
      </div>

      {/* Live status */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live — 5 skydivers
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Wifi className="w-3 h-3" />
            <span>Connected · WiFi + BLE</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = pathname === href
          const item = (
            <Link
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer relative",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && badge && (
                <Badge className="h-5 px-1.5 text-xs bg-destructive text-destructive-foreground">
                  {badge}
                </Badge>
              )}
              {collapsed && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
              )}
            </Link>
          )

          if (!collapsed) return <div key={href}>{item}</div>

          return (
            <Tooltip key={href}>
              <TooltipTrigger render={item} />
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Bottom */}
      <div className="px-2 py-3 space-y-1">
        {/* Theme toggle */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={
              <div><ThemeToggle collapsed /></div>
            } />
            <TooltipContent side="right">Toggle theme</TooltipContent>
          </Tooltip>
        ) : (
          <ThemeToggle />
        )}

        {/* Settings */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={
              <button
                aria-label="Settings"
                className="flex items-center justify-center w-full py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            } />
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        ) : (
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors w-full cursor-pointer">
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </button>
        )}

        {/* Collapse */}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors w-full cursor-pointer",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
