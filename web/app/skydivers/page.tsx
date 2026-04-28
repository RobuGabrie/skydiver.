"use client"

import { useState, useEffect } from "react"
import { useSkydiversData } from "@/lib/skydivers-context"
import { SkydiverCard } from "@/components/dashboard/skydiver-card"
import { VitalsChart, AltitudeChart } from "@/components/dashboard/vitals-chart"
import { JumpPhaseTimeline } from "@/components/dashboard/jump-phase-timeline"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { MetricValue } from "@/components/dashboard/metric-value"
import { Skydiver } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Users, Heart, Droplets, Thermometer, Battery,
  Anchor, Activity, Wifi, Bluetooth, WifiOff
} from "lucide-react"

const CONN_ICON = { wifi: Wifi, ble: Bluetooth, offline: WifiOff }

const STATUS_COLORS: Record<string, string> = {
  freefall:    "text-blue-400 bg-blue-400/10 border-blue-400/30",
  canopy_open: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  landed:      "text-slate-400 bg-slate-400/10 border-slate-400/30",
  standby:     "text-slate-400 bg-slate-400/10 border-slate-400/30",
  alert:       "text-red-400 bg-red-400/10 border-red-400/30",
}

function formatLastSeen(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function DetailPanel({ skydiver }: { skydiver: Skydiver }) {
  const ConnIcon = CONN_ICON[skydiver.connectedVia]
  const isOffline = skydiver.connectedVia === "offline"
  return (
    <Card className={cn("bg-card h-full", isOffline ? "border-amber-500/40" : "border-border")}>
      {isOffline && (
        <div className="flex items-center gap-2.5 px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/30 rounded-t-xl">
          <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Signal Lost</span>
          <span className="text-sm text-muted-foreground ml-auto">
            Showing last known data · {formatLastSeen(skydiver.lastUpdate)}
          </span>
        </div>
      )}
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary font-mono font-bold text-base">
              {skydiver.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-base font-semibold">{skydiver.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", STATUS_COLORS[skydiver.status])}>
                {skydiver.status.replace("_", " ").toUpperCase()}
              </span>
              <span className={cn("text-xs font-mono flex items-center gap-1", isOffline ? "text-amber-500 font-semibold" : "text-muted-foreground")}>
                <ConnIcon className="w-3 h-3" />
                {isOffline ? "OFFLINE" : skydiver.connectedVia.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <MetricValue
              value={skydiver.altitude.toLocaleString()}
              className="text-2xl font-mono font-bold"
            />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">meters</p>
          </div>
        </div>

        {/* Phase timeline */}
        <JumpPhaseTimeline phases={skydiver.phaseHistory} />
      </CardHeader>

      <CardContent className="pt-4">
        {/* Vitals grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: Heart,       label: "Heart Rate",   value: skydiver.heartRate,   unit: "bpm", color: "text-rose-400",   warn: skydiver.heartRate > 160 },
            { icon: Droplets,    label: "SpO₂",         value: skydiver.oxygen,      unit: "%",   color: "text-cyan-400",   warn: skydiver.oxygen < 93 },
            { icon: Activity,    label: "Stress Level", value: skydiver.stress,      unit: "%",   color: "text-violet-400", warn: skydiver.stress > 75 },
            { icon: Thermometer, label: "Temperature",  value: skydiver.temperature, unit: "°C",  color: "text-orange-400", warn: skydiver.temperature > 37.5 },
          ].map(({ icon: Icon, label, value, unit, color, warn }) => (
            <div key={label} className={cn("p-3 rounded-lg border bg-muted/20", warn ? "border-red-500/30 bg-red-500/5" : "border-border")}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={cn("w-3.5 h-3.5", warn ? "text-red-400" : color)} />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
              </div>
              <MetricValue
                value={Number.isFinite(value) ? value : "—"}
                className={cn("text-xl font-mono font-bold", warn ? "text-red-400" : "text-foreground")}
                flashClass={warn ? "text-red-300" : "text-primary"}
              />
              <span className="text-xs text-muted-foreground ml-1">{unit}</span>
            </div>
          ))}
        </div>

        {/* Battery + risk */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <Battery className={cn("w-3.5 h-3.5", skydiver.battery < 20 ? "text-red-400" : "text-muted-foreground")} />
            <span className="text-xs text-muted-foreground flex-shrink-0 w-12">Battery</span>
            <Progress value={skydiver.battery} className={cn("h-2 flex-1", skydiver.battery < 20 && "[&>div]:bg-red-400")} />
            <span className="text-xs font-mono text-muted-foreground w-8 text-right">{skydiver.battery}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground flex-shrink-0 w-12">Risk</span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  skydiver.riskScore > 60 ? "bg-red-500" : skydiver.riskScore > 30 ? "bg-amber-400" : "bg-emerald-400"
                )}
                style={{ width: `${skydiver.riskScore}%` }}
              />
            </div>
            <span className={cn("text-xs font-mono w-8 text-right",
              skydiver.riskScore > 60 ? "text-red-400" : skydiver.riskScore > 30 ? "text-amber-400" : "text-emerald-400"
            )}>
              {skydiver.riskScore}
            </span>
          </div>
        </div>

        {/* Parachute indicator */}
        {skydiver.parachuteOpen && (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Anchor className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Parachute deployed</span>
          </div>
        )}

        <Separator className="mb-4" />

        {/* Charts */}
        <Tabs defaultValue="vitals">
          <TabsList className="h-8 bg-muted/50 mb-4">
            <TabsTrigger value="vitals" className="text-xs">Vitals History</TabsTrigger>
            <TabsTrigger value="altitude" className="text-xs">Altitude & V-Speed</TabsTrigger>
          </TabsList>
          <TabsContent value="vitals">
            <VitalsChart data={skydiver.vitalHistory} />
          </TabsContent>
          <TabsContent value="altitude">
            <AltitudeChart data={skydiver.altitudeHistory} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SkeletonDetail() {
  return (
    <div className="space-y-4 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
      <Skeleton className="h-[220px] rounded-lg" />
    </div>
  )
}

export default function SkydiversPage() {
  const { skydivers } = useSkydiversData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600)
    return () => clearTimeout(t)
  }, [])

  // Set selectedId only once data arrives (fixes undefined race)
  useEffect(() => {
    if (skydivers.length && !selectedId) {
      setSelectedId(skydivers[0].id)
    }
  }, [skydivers, selectedId])

  const selected = skydivers.find(s => s.id === selectedId) ?? skydivers[0] ?? null

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Skydivers</h1>
        <p className="text-base text-muted-foreground mt-0.5">Monitor each skydiver individually</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left: list */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{skydivers.length} skydivers in session</span>
          </div>
          {!loaded ? (
            <div className="space-y-3">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            skydivers.map(s => (
              <div
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={cn("cursor-pointer rounded-xl transition-all duration-150 ring-2",
                  selectedId === s.id ? "ring-primary/50" : "ring-transparent hover:ring-border"
                )}
              >
                <SkydiverCard skydiver={s} />
              </div>
            ))
          )}
        </div>

        {/* Right: detail */}
        <div className="xl:col-span-3">
          {!loaded ? (
            <SkeletonDetail />
          ) : selected ? (
            <DetailPanel skydiver={selected} />
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                No active skydivers — connect a device to get started.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
