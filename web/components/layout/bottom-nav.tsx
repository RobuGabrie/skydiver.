"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Map, BarChart3, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSkydiversData } from "@/lib/skydivers-context"

const NAV = [
  { href: "/",          icon: LayoutDashboard, label: "Dashboard" },
  { href: "/skydivers", icon: Users,            label: "Skydivers" },
  { href: "/map",       icon: Map,              label: "Map" },
  { href: "/analytics", icon: BarChart3,        label: "Analytics" },
  { href: "/alerts",    icon: Bell,             label: "Alerts" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { unacknowledgedAlerts, criticalAlerts } = useSkydiversData()
  const alertCount = unacknowledgedAlerts.length

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border safe-bottom">
      <div className="flex items-stretch">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active      = pathname === href
          const isAlertTab  = href === "/alerts"
          const hasBadge    = isAlertTab && alertCount > 0
          const isCritical  = isAlertTab && criticalAlerts.length > 0

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {hasBadge && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5",
                    isCritical ? "bg-red-500 animate-critical" : "bg-amber-500"
                  )}>
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
