// src/components/listing/MapView.tsx

import { useEffect, useRef } from 'react'

// ── Tipe lokal Leaflet (CDN) ──
interface LeafletMap {
  setView: (center: [number, number], zoom: number) => LeafletMap
  remove:  () => void
}
interface LeafletMarker {
  addTo:      (map: LeafletMap) => LeafletMarker
  bindPopup:  (content: string) => LeafletMarker
  openPopup:  () => LeafletMarker
}
interface LeafletLayer {
  addTo: (map: LeafletMap) => LeafletLayer
}
interface LeafletIcon {}
interface LeafletStatic {
  map:       (el: HTMLElement, opts?: object) => LeafletMap
  tileLayer: (url: string, opts?: object) => LeafletLayer
  marker:    (pos: [number, number], opts?: object) => LeafletMarker
  divIcon:   (opts: object) => LeafletIcon
}
declare global {
  interface Window { L: LeafletStatic }
}

// ──────────────────────────────────────────────────────

interface MapViewProps {
  lat:     number
  lng:     number
  nama:    string
  alamat?: string
}

const MapView = ({ lat, lng, nama, alamat }: MapViewProps) => {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const initMap = () => {
      if (!mapRef.current) return
      const L   = window.L
      const map = L.map(mapRef.current, {}).setView([lat, lng], 16)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:#f59e0b;border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          transform:rotate(-45deg);"></div>`,
        iconSize:    [36, 36],
        iconAnchor:  [18, 36],
        popupAnchor: [0, -36],
      })

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${nama}</b>${alamat ? `<br/><span style="font-size:12px;color:#666">${alamat}</span>` : ''}`)
        .openPopup()

      mapInstance.current = map
    }

    // Load CSS
    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link')
      link.id     = 'leaflet-css'
      link.rel    = 'stylesheet'
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load JS atau langsung init jika sudah ada
    if (window.L) {
      initMap()
    } else if (!document.getElementById('leaflet-js')) {
      const script  = document.createElement('script')
      script.id     = 'leaflet-js'
      script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      // Script sedang loading, tunggu
      const check = setInterval(() => {
        if (window.L) { clearInterval(check); initMap() }
      }, 100)
    }

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [lat, lng, nama, alamat])

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      <div ref={mapRef} style={{ height: '220px', width: '100%' }} />
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors border-t border-slate-100"
      >
        🗺️ Buka di Google Maps
      </a>
    </div>
  )
}

export default MapView
