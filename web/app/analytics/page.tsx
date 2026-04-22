"use client"

import { useSimulation } from "@/hooks/use-simulation"
import { RiskGauge } from "@/components/analytics/risk-gauge"
import { GroupVitalsChart, VitalsChart } from "@/components/dashboard/vitals-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { MOCK_JUMP_HISTORY, MOCK_OXYGEN_TREND, MOCK_SESSION_STATS } from "@/lib/mock-data"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, Legend
} from "recharts"
import {
  Brain, TrendingDown, AlertTriangle, Activity,
  Heart, Droplets, Shield, Zap, Target, Eye
} from "lucide-react"
import { cn } from "@/lib/utils"

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

const anomalyData = [
  { name: "Mihai Popescu", risk: 74, rotation: 88, stress: 89, pulse: 82, oxygen: 60 },
  { name: "Alex Mercer", risk: 18, rotation: 15, stress: 72, pulse: 40, oxygen: 85 },
  { name: "Elena Dumitrescu", risk: 22, rotation: 20, stress: 55, pulse: 35, oxygen: 90 },
  { name: "Sara Ionescu", risk: 5, rotation: 5, stress: 35, pulse: 10, oxygen: 95 },
  { name: "Andrei Vlad", risk: 2, rotation: 2, stress: 18, pulse: 5, oxygen: 99 },
]

const sessionTrendData = MOCK_JUMP_HISTORY

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1 font-mono">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex gap-2 items-center">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-semibold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { skydivers } = useSimulation()

  const avgRisk = Math.round(skydivers.reduce((a, s) => a + s.riskScore, 0) / skydivers.length)
  const highRisk = skydivers.filter(s => s.riskScore > 50)

  const radarData = [
    { metric: "Heart Rate", value: Math.round(skydivers.reduce((a, s) => a + s.heartRate, 0) / skydivers.length / 1.9) },
    { metric: "Oxygen", value: Math.round(skydivers.reduce((a, s) => a + s.oxygen, 0) / skydivers.length) },
    { metric: "Stress", value: 100 - Math.round(skydivers.reduce((a, s) => a + s.stress, 0) / skydivers.length) },
    { metric: "Temperature", value: Math.round((37.5 - skydivers.reduce((a, s) => a + s.temperature, 0) / skydivers.length) * 40 + 50) },
    { metric: "Battery", value: Math.round(skydivers.reduce((a, s) => a + s.battery, 0) / skydivers.length) },
    { metric: "Safety", value: 100 - avgRisk },
  ]

  return (
    <div className="p-6 min-h-screen">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">AI Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Machine learning analysis, predictions, and statistics</p>
      </div>

      {/* Top overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Risk gauges */}
        <Card className="bg-card border-border lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Session Risk Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-3 gap-2">
              {skydivers.slice(0, 3).map(s => (
                <RiskGauge key={s.id} score={s.riskScore} label={s.name.split(" ")[0]} />
              ))}
            </div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-2">
              {skydivers.slice(3).map(s => (
                <RiskGauge key={s.id} score={s.riskScore} label={s.name.split(" ")[0]} />
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Session Avg Risk</span>
              <span className={cn("text-base font-mono font-bold", avgRisk > 50 ? "text-red-400" : avgRisk > 30 ? "text-amber-400" : "text-emerald-400")}>
                {avgRisk} / 100
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Radar chart - group health */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Group Health Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11, fontFamily: "Fira Sans" }} />
                <Radar name="Group Avg" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Hazard Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <SectionHeader
              icon={Eye}
              title="Dangerous Situation Detection"
              subtitle="Real-time anomaly classification"
            />
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            {[
              {
                label: "Uncontrolled Fall",
                skydiver: "Mihai Popescu",
                confidence: 82,
                severity: "critical",
                detail: "Vertical speed exceeds 75 m/s with chaotic rotation pattern",
              },
              {
                label: "Excessive Rotation",
                skydiver: "Mihai Popescu",
                confidence: 94,
                severity: "critical",
                detail: "360°/s rotation detected. Threshold: 180°/s. Possible flat spin.",
              },
              {
                label: "Position Instability",
                skydiver: "Alex Mercer",
                confidence: 31,
                severity: "warning",
                detail: "Minor body position drift from stable arch. Monitoring.",
              },
              {
                label: "Lack of Movement",
                skydiver: "All Skydivers",
                confidence: 0,
                severity: "info",
                detail: "No unconsciousness indicators detected. All skydivers responsive.",
              },
            ].map(item => (
              <div
                key={item.label}
                className={cn(
                  "p-3 rounded-lg border text-xs",
                  item.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                  item.severity === "warning" ? "border-amber-500/30 bg-amber-500/5" :
                  "border-emerald-500/30 bg-emerald-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("font-semibold",
                    item.severity === "critical" ? "text-red-400" :
                    item.severity === "warning" ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Confidence</span>
                    <span className={cn("font-mono font-bold text-[10px]",
                      item.confidence > 70 ? "text-red-400" : item.confidence > 30 ? "text-amber-400" : "text-emerald-400"
                    )}>
                      {item.confidence}%
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/70 italic mb-1.5">{item.skydiver}</p>
                <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                {item.confidence > 0 && (
                  <Progress value={item.confidence} className={cn("h-1 mt-2",
                    item.confidence > 70 ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-400"
                  )} />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Physiological Analysis */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <SectionHeader
              icon={Heart}
              title="Physiological Analysis"
              subtitle="AI-powered health monitoring"
            />
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            {[
              {
                label: "Abnormal Pulse",
                skydiver: "Mihai Popescu",
                value: "168 bpm",
                threshold: "160 bpm",
                severity: "warning",
                detail: "Heart rate elevated 5% above safe threshold for freefall phase.",
                trend: "+12% vs avg",
              },
              {
                label: "Elevated Stress",
                skydiver: "Mihai Popescu",
                value: "89%",
                threshold: "75%",
                severity: "critical",
                detail: "Cortisol-proxy stress index critically elevated. Panic response pattern.",
                trend: "+34% vs avg",
              },
              {
                label: "Low SpO₂",
                skydiver: "Mihai Popescu",
                value: "91%",
                threshold: "93%",
                severity: "warning",
                detail: "Blood oxygen below safe minimum. Altitude hypoxia suspected.",
                trend: "-4pp vs baseline",
              },
              {
                label: "Normal Physiology",
                skydiver: "4 / 5 skydivers",
                value: "Nominal",
                threshold: "—",
                severity: "info",
                detail: "All other skydivers show normal physiological parameters.",
                trend: "Stable",
              },
            ].map(item => (
              <div
                key={item.label}
                className={cn(
                  "p-3 rounded-lg border text-xs",
                  item.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                  item.severity === "warning" ? "border-amber-500/30 bg-amber-500/5" :
                  "border-emerald-500/30 bg-emerald-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn("font-semibold",
                    item.severity === "critical" ? "text-red-400" :
                    item.severity === "warning" ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {item.label}
                  </span>
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono">
                    {item.trend}
                  </Badge>
                </div>
                <div className="flex gap-3 text-[10px] text-muted-foreground mb-1.5">
                  <span>Value: <span className="font-mono text-foreground">{item.value}</span></span>
                  <span>Threshold: <span className="font-mono text-foreground">{item.threshold}</span></span>
                </div>
                <p className="text-[10px] text-muted-foreground/70 italic mb-0.5">{item.skydiver}</p>
                <p className="text-[10px] text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Predictions + Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* AI Predictions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <SectionHeader icon={Brain} title="AI Predictions" subtitle="Behavioral & risk forecasting" />
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            {[
              {
                label: "Accident Risk — Mihai",
                probability: 71,
                severity: "critical",
                desc: "Based on combined rotation + stress + O₂ pattern, injury probability estimated at 71% without intervention.",
                action: "Alert instructor immediately",
              },
              {
                label: "Late Deployment — Alex",
                probability: 42,
                severity: "warning",
                desc: "Parachute deployment pattern suggests possible late pull at current descent rate.",
                action: "Verbal reminder recommended",
              },
              {
                label: "Abnormal Air Behavior",
                probability: 28,
                severity: "warning",
                desc: "Mihai's trajectory shows non-standard body position patterns consistent with disorientation.",
                action: "Visual check from jumpmaster",
              },
              {
                label: "Safe Landing — Andrei",
                probability: 98,
                severity: "info",
                desc: "All metrics within safe ranges. Normal approach trajectory.",
                action: "No action required",
              },
            ].map(item => (
              <div
                key={item.label}
                className={cn(
                  "p-3 rounded-lg border",
                  item.severity === "critical" ? "border-red-500/30 bg-red-500/5" :
                  item.severity === "warning" ? "border-amber-500/30 bg-amber-500/5" :
                  "border-emerald-500/30 bg-emerald-500/5"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("text-xs font-semibold",
                    item.severity === "critical" ? "text-red-400" :
                    item.severity === "warning" ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {item.label}
                  </span>
                  <span className={cn("text-xs font-mono font-bold",
                    item.probability > 60 ? "text-red-400" : item.probability > 35 ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {item.probability}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1.5">{item.desc}</p>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-medium">{item.action}</span>
                </div>
                <Progress value={item.probability} className={cn("h-1 mt-2",
                  item.probability > 60 ? "[&>div]:bg-red-500" : item.probability > 35 ? "[&>div]:bg-amber-400" : "[&>div]:bg-emerald-400"
                )} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Session stats */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <SectionHeader icon={TrendingDown} title="Session Statistics" subtitle="7-day jump history and trends" />
          </CardHeader>
          <CardContent className="pb-4">
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Jumps", value: MOCK_SESSION_STATS.totalJumps, icon: Droplets, color: "text-blue-400" },
                { label: "Alerts", value: MOCK_SESSION_STATS.alertsTriggered, icon: AlertTriangle, color: "text-red-400" },
                { label: "Max Alt", value: `${(MOCK_SESSION_STATS.maxAltitude / 1000).toFixed(1)}km`, icon: TrendingDown, color: "text-violet-400" },
                { label: "Safety", value: `${MOCK_SESSION_STATS.safetyScore}%`, icon: Shield, color: "text-emerald-400" },
              ].map(s => (
                <div key={s.label} className="p-2.5 rounded-lg bg-muted/30 border border-border text-center">
                  <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
                  <p className={cn("text-base font-mono font-bold", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Bar chart - weekly */}
            <div className="mb-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Weekly Jumps & Alerts</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sessionTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "Fira Code" }} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10, fontFamily: "Fira Code" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="jumps" name="Jumps" fill="#3b82f6" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                  <Bar dataKey="alerts" name="Alerts" fill="#ef4444" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Separator className="my-3" />

            {/* O2 trend */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">Group Oxygen Saturation Trend</p>
              <GroupVitalsChart data={MOCK_OXYGEN_TREND} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual comparison */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <SectionHeader icon={Activity} title="Individual Risk Comparison" subtitle="Side-by-side anomaly scores per skydiver" />
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={anomalyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "Fira Code" }} domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={130} tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "Fira Sans" }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="risk" name="Overall Risk" fill="#ef4444" radius={[0, 3, 3, 0]} fillOpacity={0.7} />
              <Bar dataKey="stress" name="Stress" fill="#a78bfa" radius={[0, 3, 3, 0]} fillOpacity={0.6} />
              <Bar dataKey="oxygen" name="O₂ Health" fill="#06b6d4" radius={[0, 3, 3, 0]} fillOpacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
