// src/components/listing/MapView.tsx

import { useEffect, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = any

interface MapViewProps {
  lat:     number
  lng:     number
  nama:    string
  alamat?: string
}

const MapView = ({ lat, lng, nama, alamat }: MapViewProps) => {
  const mapRef      = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const initMap = () => {
      if (!mapRef.current) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L: L = (window as any).L

      const map = L.map(mapRef.current, {}).setView([lat, lng], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)

      L.marker([lat, lng], {
        icon: L.divIcon({
          className:   '',
          html:        `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;
                          background:#f59e0b;border:3px solid #fff;
                          box-shadow:0 2px 8px rgba(0,0,0,0.3);
                          transform:rotate(-45deg);"></div>`,
          iconSize:    [36, 36],
          iconAnchor:  [18, 36],
          popupAnchor: [0, -36],
        }),
      })
        .addTo(map)
        .bindPopup(
          `<b>${nama}</b>${alamat
            ? `<br/><span style="font-size:12px;color:#666">${alamat}</span>`
            : ''}`
        )
        .openPopup()

      mapInstance.current = map
    }

    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link')
      link.id     = 'leaflet-css'
      link.rel    = 'stylesheet'
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).L) {
      initMap()
    } else if (!document.getElementById('leaflet-js')) {
      const script  = document.createElement('script')
      script.id     = 'leaflet-js'
      script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      const check = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).L) { clearInterval(check); initMap() }
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
