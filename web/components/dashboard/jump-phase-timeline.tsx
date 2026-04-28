"use client"

import { PhaseEvent, SkydiverStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { format } from "date-fns"

const PHASE_CONFIG: Record<SkydiverStatus, { label: string; color: string; bg: string; text: string }> = {
  standby:     { label: "Standby",     color: "bg-slate-400",   bg: "bg-slate-400/20",   text: "text-slate-500 dark:text-slate-400" },
  freefall:    { label: "Freefall",    color: "bg-blue-500",    bg: "bg-blue-500/20",    text: "text-blue-600 dark:text-blue-400" },
  canopy_open: { label: "Canopy",      color: "bg-emerald-500", bg: "bg-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400" },
  landed:      { label: "Landed",      color: "bg-slate-500",   bg: "bg-slate-500/20",   text: "text-slate-600 dark:text-slate-400" },
  alert:       { label: "ALERT",       color: "bg-red-500",     bg: "bg-red-500/20",     text: "text-red-600 dark:text-red-400" },
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export function JumpPhaseTimeline({ phases }: { phases: PhaseEvent[] }) {
  if (!phases || phases.length === 0) return null

  const now = Date.now()

  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Jump Timeline</p>
      <div className="flex items-stretch gap-0.5 h-7 rounded-md overflow-hidden">
        {phases.map((phase, i) => {
          const nextPhase = phases[i + 1]
          const endMs = nextPhase ? new Date(nextPhase.enteredAt).getTime() : now
          const startMs = new Date(phase.enteredAt).getTime()
          const duration = Math.max(1, Math.round((endMs - startMs) / 1000))

          const cfg = PHASE_CONFIG[phase.status]

          return (
            <Tooltip key={`${phase.status}-${phase.enteredAt}`}>
              <TooltipTrigger>
                <div
                  className={cn("flex-1 min-w-[28px] flex items-center justify-center cursor-default", cfg.bg)}
                  style={{ flexGrow: Math.max(duration, 5) }}
                >
                  <span className={cn("text-[9px] font-semibold uppercase truncate px-1", cfg.text)}>
                    {cfg.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold">{cfg.label}</p>
                  <p className="text-muted-foreground">Entered: {format(new Date(phase.enteredAt), "HH:mm:ss")}</p>
                  <p className="text-muted-foreground">Duration: {formatDuration(duration)}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      {/* Phase dots legend */}
      <div className="flex flex-wrap gap-2 mt-1.5">
        {phases.map((phase, i) => {
          const cfg = PHASE_CONFIG[phase.status]
          return (
            <span key={`${phase.status}-${i}`} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.color)} />
              {cfg.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
