"use client"

import { useSimulation } from "@/hooks/use-simulation"
import { SkydiverCard } from "@/components/dashboard/skydiver-card"
import { AlertFeed } from "@/components/dashboard/alert-feed"
import { StatCard } from "@/components/dashboard/stat-card"
import { VitalsChart, AltitudeChart } from "@/components/dashboard/vitals-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users, AlertTriangle, Activity, Shield,
  TrendingDown, Bell, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { skydivers, alerts, unacknowledgedAlerts, criticalAlerts, acknowledgeAlert, acknowledgeAll } = useSimulation()

  const activeJumpers = skydivers.filter(s => s.status !== "landed" && s.status !== "standby")
  const alertSkydivers = skydivers.filter(s => s.status === "alert")
  const avgOxygen = Math.round(skydivers.reduce((a, s) => a + s.oxygen, 0) / skydivers.length)
  const avgHeartRate = Math.round(skydivers.reduce((a, s) => a + s.heartRate, 0) / skydivers.length)
  const selectedSkydiver = skydivers.find(s => s.id === "3") || skydivers[0]

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Live Dashboard</h1>
          <p className="text-base text-muted-foreground mt-0.5">Real-time skydiving session monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalAlerts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg animate-critical">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400 font-semibold">{criticalAlerts.length} CRITICAL</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-400">Live · 2s</span>
          </div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Users}
          label="Active Jumpers"
          value={activeJumpers.length}
          unit={`/ ${skydivers.length}`}
          color="text-blue-600 dark:text-blue-400"
          glow={activeJumpers.length > 0 ? "blue" : undefined}
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={unacknowledgedAlerts.length}
          trend={criticalAlerts.length > 0 ? { value: criticalAlerts.length, label: "critical" } : undefined}
          color={unacknowledgedAlerts.length > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}
          glow={criticalAlerts.length > 0 ? "red" : undefined}
        />
        <StatCard
          icon={Activity}
          label="Avg Heart Rate"
          value={avgHeartRate}
          unit="bpm"
          color="text-rose-600 dark:text-rose-400"
        />
        <StatCard
          icon={Shield}
          label="Avg O₂ Saturation"
          value={avgOxygen}
          unit="%"
          color={avgOxygen >= 95 ? "text-cyan-600 dark:text-cyan-400" : "text-amber-600 dark:text-amber-400"}
        />
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: skydivers */}
        <div className="xl:col-span-2 space-y-4">
          {alertSkydivers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <h2 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Requires Immediate Attention
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertSkydivers.map(s => <SkydiverCard key={s.id} skydiver={s} />)}
              </div>
              <Separator className="my-4" />
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">All Skydivers</h2>
            <Badge variant="secondary" className="text-sm font-mono">{skydivers.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skydivers.filter(s => s.status !== "alert").map(s => (
              <SkydiverCard key={s.id} skydiver={s} />
            ))}
          </div>

          {/* Detail chart */}
          <Card className="bg-card border-border mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium">
                  Detail View — {selectedSkydiver.name}
                </CardTitle>
                <Badge variant="outline" className={cn(
                  "text-xs font-mono",
                  selectedSkydiver.status === "alert"
                    ? "border-red-500/50 text-red-600 dark:text-red-400"
                    : "border-primary/50 text-primary"
                )}>
                  {selectedSkydiver.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <Tabs defaultValue="vitals">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="vitals" className="text-sm">Vitals</TabsTrigger>
                  <TabsTrigger value="altitude" className="text-sm">Altitude</TabsTrigger>
                </TabsList>
                <TabsContent value="vitals" className="mt-4">
                  <VitalsChart data={selectedSkydiver.vitalHistory} />
                </TabsContent>
                <TabsContent value="altitude" className="mt-4">
                  <AltitudeChart data={selectedSkydiver.altitudeHistory} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right: alerts + AI summary */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Alert Feed
                </CardTitle>
                {unacknowledgedAlerts.length > 0 && (
                  <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 font-mono text-xs">
                    {unacknowledgedAlerts.length} new
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <AlertFeed
                alerts={alerts}
                onAcknowledge={acknowledgeAlert}
                onAcknowledgeAll={acknowledgeAll}
              />
            </CardContent>
          </Card>

          {/* AI summary */}
          <Card className="bg-card border-border border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                AI Risk Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">High Risk — Mihai Popescu</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Excessive rotation detected. Physiological stress above threshold. Immediate intervention recommended.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Predicted Risk — Alex Mercer</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Parachute deployment altitude approaching minimum threshold. No deployment detected at 3,200m.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">3 Skydivers — Normal</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Sara, Elena, and Andrei all within safe parameters. No anomalies detected.</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-right font-mono">AI analyzed · just now</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
