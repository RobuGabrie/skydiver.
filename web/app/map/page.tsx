"use client"

import dynamic from "next/dynamic"
import { useSkydiversData } from "@/lib/skydivers-context"
import { Skeleton } from "@/components/ui/skeleton"
import { SkydiverCard } from "@/components/dashboard/skydiver-card"

const LiveMap = dynamic(() => import("@/components/map/live-map"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="flex-1 rounded-xl" />
    </div>
  ),
})

export default function MapPage() {
  const { skydivers } = useSkydiversData()

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Live Map</h1>
        <p className="text-base text-muted-foreground mt-0.5">
          Real-time GPS positions of active skydivers
        </p>
      </div>

      <div className="flex flex-1 min-h-0 gap-4">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
          {skydivers.length === 0 ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
            </div>
          ) : (
            skydivers.map(s => (
              <SkydiverCard key={s.id} skydiver={s} />
            ))
          )}
        </aside>

        {/* Map */}
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-border">
          <LiveMap skydivers={skydivers} />
        </div>
      </div>
    </div>
  )
}
