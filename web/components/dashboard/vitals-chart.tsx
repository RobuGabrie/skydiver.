"use client"

import { VitalPoint } from "@/lib/types"
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, AreaChart, Area, ComposedChart, ReferenceLine,
} from "recharts"
import { format } from "date-fns"

const CHART_TICK = { fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "Fira Code" } as const
const CHART_GRID = "var(--border)"

const COLORS = {
  heartRate: "#f43f5e",
  oxygen:    "#06b6d4",
  stress:    "#a78bfa",
  temperature: "#fb923c",
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-2 font-mono">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function VitalsChart({ data }: { data: VitalPoint[] }) {
  const formatted = data.map(p => ({
    ...p,
    time: format(new Date(p.time), "HH:mm:ss"),
  })).slice(-20)

  if (formatted.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
        No vitals data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        <XAxis dataKey="time" tick={CHART_TICK} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={CHART_TICK} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Fira Code", paddingTop: 8 }} />
        <Line dataKey="heartRate" name="Heart Rate" stroke={COLORS.heartRate} dot={false} strokeWidth={2} type="monotone" />
        <Line dataKey="oxygen"    name="Oxygen"     stroke={COLORS.oxygen}    dot={false} strokeWidth={2} type="monotone" />
        <Line dataKey="stress"    name="Stress"     stroke={COLORS.stress}    dot={false} strokeWidth={2} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function AltitudeChart({ data }: { data: { time: string; altitude: number; verticalSpeed: number }[] }) {
  const formatted = data.map(p => ({
    ...p,
    time: format(new Date(p.time), "HH:mm:ss"),
    verticalSpeed: Math.abs(p.verticalSpeed),
  })).slice(-20)

  if (formatted.length === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
        No altitude data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={formatted} margin={{ top: 5, right: 36, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.30} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        <XAxis dataKey="time" tick={CHART_TICK} tickLine={false} interval="preserveStartEnd" />
        {/* Left Y — altitude */}
        <YAxis yAxisId="alt" tick={CHART_TICK} tickLine={false} axisLine={false} />
        {/* Right Y — vertical speed */}
        <YAxis yAxisId="vs" orientation="right" tick={CHART_TICK} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 10, fontFamily: "Fira Code", paddingTop: 8 }} />
        {/* Danger floor reference */}
        <ReferenceLine yAxisId="alt" y={800}  stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.6} label={{ value: "Deploy", fill: "var(--muted-foreground)", fontSize: 9, position: "insideTopLeft" }} />
        <ReferenceLine yAxisId="alt" y={200}  stroke="#ef4444" strokeDasharray="4 2" strokeOpacity={0.6} label={{ value: "Danger", fill: "#ef4444", fontSize: 9, position: "insideTopLeft" }} />
        <Area   yAxisId="alt" dataKey="altitude"     name="Altitude (m)"  stroke="#3b82f6" fill="url(#altGrad)"   strokeWidth={2} type="monotone" dot={false} />
        <Line   yAxisId="vs"  dataKey="verticalSpeed" name="V-Speed (m/s)" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 2" type="monotone" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

export function GroupVitalsChart({ data }: { data: { time: string; avgOxygen: number; minOxygen: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="o2Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.30} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
        <XAxis dataKey="time" tick={CHART_TICK} tickLine={false} />
        <YAxis tick={CHART_TICK} tickLine={false} axisLine={false} domain={[85, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <Area dataKey="avgOxygen" name="Avg O₂"  stroke="#06b6d4" fill="url(#o2Grad)" strokeWidth={2} type="monotone" dot={false} />
        <Line dataKey="minOxygen" name="Min O₂"  stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 2" type="monotone" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
