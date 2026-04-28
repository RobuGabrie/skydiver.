"use client"

import { useEffect, useRef } from "react"
import { Skydiver, SkydiverStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const STATUS_COLOR: Record<SkydiverStatus, string> = {
  freefall:    "#3b82f6",
  canopy_open: "#22c55e",
  landed:      "#64748b",
  standby:     "#64748b",
  alert:       "#ef4444",
}

const STATUS_LABEL: Record<SkydiverStatus, string> = {
  freefall:    "Freefall",
  canopy_open: "Canopy",
  landed:      "Landed",
  standby:     "Standby",
  alert:       "ALERT",
}

interface LiveMapProps {
  skydivers: Skydiver[]
}

export default function LiveMap({ skydivers }: LiveMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<import("leaflet").Map | null>(null)
  const markersRef    = useRef<Map<string, import("leaflet").Marker>>(new Map())
  const destroyedRef  = useRef(false)
  const fittedRef     = useRef(false)

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current) return
    destroyedRef.current = false

    import("leaflet").then(L => {
      if (destroyedRef.current || !containerRef.current) return
      if ((containerRef.current as any)._leaflet_id) {
        mapRef.current?.remove()
        mapRef.current = null
      }
      if (mapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(containerRef.current!, {
        center: [46.0, 25.0],
        zoom: 7,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map)

      mapRef.current = map
    })

    return () => {
      destroyedRef.current = true
      fittedRef.current = false
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current.clear()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update markers whenever skydivers change
  useEffect(() => {
    if (!mapRef.current) return

    import("leaflet").then(L => {
      const map = mapRef.current!
      const existing = markersRef.current

      for (const s of skydivers) {
        if (!s.lat || !s.lon) continue
        const color = STATUS_COLOR[s.status]
        const statusLabel = STATUS_LABEL[s.status]
        const isConcerning = s.position === "tumbling" || s.position === "headdown"
        const positionBadge = isConcerning
          ? `<span style="display:inline-block;margin-top:2px;font-size:9px;font-weight:700;letter-spacing:0.05em;background:rgba(0,0,0,0.25);border-radius:3px;padding:0 4px;text-transform:uppercase">${s.position}</span>`
          : ""
        const altStr = s.altitude > 0 ? `${s.altitude.toLocaleString()}m` : "—"

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              position:relative;
              display:flex;
              flex-direction:column;
              align-items:center;
              font-family:system-ui,sans-serif;
            ">
              <div style="
                background:${color};
                color:#fff;
                font-size:12px;
                font-weight:700;
                padding:5px 10px;
                border-radius:8px;
                white-space:nowrap;
                box-shadow:0 4px 14px rgba(0,0,0,0.5);
                border:2px solid rgba(255,255,255,0.85);
                line-height:1.4;
                text-align:center;
              ">
                ${s.avatar}&nbsp;${s.name.split(" ")[0]}<br>
                <span style="font-size:10px;font-weight:600;opacity:0.92">${altStr} · ${statusLabel}</span>
                ${positionBadge}
              </div>
              <div style="
                width:0;height:0;
                border-left:7px solid transparent;
                border-right:7px solid transparent;
                border-top:9px solid ${color};
              "></div>
            </div>`,
          iconAnchor: [55, 56],
          iconSize:   [110, 56],
        })

        const popupHtml = `
          <div style="font-family:system-ui,sans-serif;min-width:170px">
            <div style="font-weight:700;font-size:13px;margin-bottom:6px">${s.name}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0"></span>
              <span style="font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.05em">${statusLabel}</span>
              ${isConcerning ? `<span style="font-size:10px;background:rgba(239,68,68,0.15);color:#ef4444;border-radius:3px;padding:0 4px;font-weight:700">${s.position}</span>` : ""}
            </div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:2px">Altitude: <span style="color:#f1f5f9;font-weight:600">${s.altitude.toLocaleString()} m</span></div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:2px">V-Speed: <span style="color:#f1f5f9;font-weight:600">${Math.abs(s.verticalSpeed)} m/s</span></div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:2px">Position: <span style="color:#f1f5f9;font-weight:600;text-transform:capitalize">${s.position}</span></div>
            <div style="font-size:11px;color:#94a3b8;margin-bottom:2px">HR: <span style="color:#f1f5f9;font-weight:600">${Number.isFinite(s.heartRate) ? s.heartRate + " bpm" : "—"}</span></div>
            <div style="font-size:11px;color:#94a3b8">O₂: <span style="color:#f1f5f9;font-weight:600">${Number.isFinite(s.oxygen) ? s.oxygen + "%" : "—"}</span></div>
          </div>`

        if (existing.has(s.id)) {
          const marker = existing.get(s.id)!
          marker.setLatLng([s.lat, s.lon])
          marker.setIcon(icon)
          marker.getPopup()?.setContent(popupHtml)
        } else {
          const marker = L.marker([s.lat, s.lon], { icon })
            .addTo(map)
            .bindPopup(popupHtml, { maxWidth: 220 })
          existing.set(s.id, marker)
        }
      }

      // Remove markers for skydivers no longer in the list
      const activeIds = new Set(skydivers.map(s => s.id))
      for (const [id, marker] of existing) {
        if (!activeIds.has(id)) {
          marker.remove()
          existing.delete(id)
        }
      }

      // Auto-fit to skydivers on first GPS fix; re-pan if all markers leave the viewport
      const positions = skydivers
        .filter(s => s.lat && s.lon)
        .map(s => [s.lat!, s.lon!] as [number, number])

      if (positions.length > 0) {
        if (!fittedRef.current) {
          fittedRef.current = true
          if (positions.length === 1) {
            map.setView(positions[0], 14)
          } else {
            map.fitBounds(positions as any, { padding: [60, 60], maxZoom: 15 })
          }
        } else {
          // Re-center only if no skydiver is currently visible
          const bounds = map.getBounds()
          const anyVisible = positions.some(([lat, lon]) => bounds.contains([lat, lon] as any))
          if (!anyVisible) {
            map.setView(positions[0], map.getZoom())
          }
        }
      }
    })
  }, [skydivers])

  const withGps = skydivers.filter(s => s.lat && s.lon)

  return (
    <div className="flex flex-col h-full">
      {/* Legend strip */}
      <div className="flex items-center gap-4 px-4 py-2 bg-card border-b border-border text-xs text-muted-foreground flex-wrap">
        {(["freefall","canopy_open","landed","alert"] as SkydiverStatus[]).map(st => (
          <span key={st} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[st] }} />
            {STATUS_LABEL[st]}
          </span>
        ))}
        <span className="ml-auto font-mono">{withGps.length}/{skydivers.length} with GPS</span>
      </div>

      {/* No GPS notice */}
      {withGps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-card/90 border border-border rounded-xl px-6 py-4 text-sm text-muted-foreground text-center shadow-lg">
            No GPS coordinates available yet.<br />
            Connect a device with location permissions enabled.
          </div>
        </div>
      )}

      {/* Leaflet CSS */}
      <style>{`
        .leaflet-container { background: hsl(var(--background, 220 13% 9%)); height: 100%; }
        .leaflet-popup-content-wrapper { border-radius: 10px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
        .leaflet-popup-tip { background: #0f172a; }
        .leaflet-popup-content { margin: 12px 14px; }
      `}</style>

      <div ref={containerRef} className={cn("flex-1")} style={{ minHeight: 0 }} />
    </div>
  )
}
