"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, BarChart3, Bell,
  ChevronLeft, ChevronRight, Wind, FlaskConical, Map,
  Volume2, VolumeX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "./theme-toggle"
import { useMockMode } from "@/lib/mock-context"
import { useSkydiversData } from "@/lib/skydivers-context"
import { useAlertSound } from "@/hooks/use-alert-sound"

export function AppSidebar() {
  const pathname   = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { isMockMode, toggleMockMode } = useMockMode()
  const { unacknowledgedAlerts, criticalAlerts } = useSkydiversData()
  const { soundEnabled, toggle: toggleSound, notifyIfNeeded } = useAlertSound()

  const alertCount = unacknowledgedAlerts.length

  // Fire audio ping whenever the critical count rises
  useEffect(() => {
    notifyIfNeeded(criticalAlerts.length)
  }, [criticalAlerts.length, notifyIfNeeded])

  const navItems = [
    { href: "/",          icon: LayoutDashboard, label: "Dashboard",   badge: null },
    { href: "/skydivers", icon: Users,            label: "Skydivers",   badge: null },
    { href: "/map",       icon: Map,              label: "Live Map",    badge: null },
    { href: "/analytics", icon: BarChart3,        label: "AI Analytics",badge: null },
    { href: "/alerts",    icon: Bell,             label: "Alerts",
      badge: alertCount > 0 ? alertCount : null,
      badgeCritical: criticalAlerts.length > 0,
    },
  ]

  return (
    <aside className={cn(
      "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 shrink-0",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-sidebar-border",
        collapsed && "justify-center px-0"
      )}>
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

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map(({ href, icon: Icon, label, badge, badgeCritical }) => {
          const active = pathname === href
          const item = (
            <Link
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer relative",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}

              {/* Expanded: badge */}
              {!collapsed && badge && (
                <Badge className={cn(
                  "h-5 px-1.5 text-xs font-mono",
                  badgeCritical
                    ? "bg-red-500 text-white animate-critical"
                    : "bg-amber-500/80 text-white"
                )}>
                  {badge}
                </Badge>
              )}

              {/* Collapsed: dot indicator */}
              {collapsed && badge && (
                <span className={cn(
                  "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
                  badgeCritical ? "bg-red-500 animate-critical" : "bg-amber-500"
                )} />
              )}
            </Link>
          )

          if (!collapsed) return <div key={href}>{item}</div>

          return (
            <Tooltip key={href}>
              <TooltipTrigger render={item} />
              <TooltipContent side="right">
                {label}
                {badge ? ` (${badge})` : ""}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Bottom controls */}
      <div className="px-2 py-3 space-y-1">

        {/* Mock mode toggle */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={
              <button
                aria-label="Toggle mock data"
                onClick={toggleMockMode}
                className={cn(
                  "flex items-center justify-center w-full py-2.5 rounded-lg transition-colors cursor-pointer",
                  isMockMode
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <FlaskConical className="w-4 h-4" />
              </button>
            } />
            <TooltipContent side="right">{isMockMode ? "Disable mock data" : "Enable mock data"}</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={toggleMockMode}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full cursor-pointer",
              isMockMode
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            )}
          >
            <FlaskConical className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Mock Data</span>
            {isMockMode && (
              <Badge className="h-5 px-1.5 text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40">
                ON
              </Badge>
            )}
          </button>
        )}

        {/* Alert sound toggle */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={
              <button
                aria-label={soundEnabled ? "Disable alert sound" : "Enable alert sound"}
                onClick={toggleSound}
                className={cn(
                  "flex items-center justify-center w-full py-2.5 rounded-lg transition-colors cursor-pointer",
                  soundEnabled
                    ? "text-primary hover:bg-sidebar-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            } />
            <TooltipContent side="right">{soundEnabled ? "Mute critical alerts" : "Sound for critical alerts"}</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={toggleSound}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full cursor-pointer",
              soundEnabled
                ? "text-primary hover:bg-sidebar-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            )}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 shrink-0" /> : <VolumeX className="w-4 h-4 shrink-0" />}
            <span className="flex-1 text-left">Alert Sound</span>
            {soundEnabled && (
              <Badge className="h-5 px-1.5 text-xs bg-primary/15 text-primary border border-primary/30">
                ON
              </Badge>
            )}
          </button>
        )}

        {/* Theme toggle */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={<div><ThemeToggle collapsed /></div>} />
            <TooltipContent side="right">Toggle theme</TooltipContent>
          </Tooltip>
        ) : (
          <ThemeToggle />
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
          {collapsed
            ? <ChevronRight className="w-4 h-4 shrink-0" />
            : <ChevronLeft className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
