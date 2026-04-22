import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  color = "text-primary",
  glow,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
  trend?: { value: number; label: string }
  color?: string
  glow?: "blue" | "red" | "amber" | "green"
}) {
  return (
    <Card className={cn("bg-card border-border", glow && `glow-${glow}`)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center bg-muted/60")}>
            <Icon className={cn("w-5 h-5", color)} />
          </div>
          {trend && (
            <span className={cn(
              "text-xs font-mono px-2 py-0.5 rounded-md",
              trend.value >= 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
            )}>
              {trend.value >= 0 ? "+" : ""}{trend.value} {trend.label}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-mono font-bold text-foreground leading-none">
            {value}
            {unit && <span className="text-base text-muted-foreground ml-1.5">{unit}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
