// src/components/listing/MapView.tsx

import { useEffect, useRef } from 'react'

interface MapViewProps {
  lat:     number
  lng:     number
  nama:    string
  alamat?: string
}

const MapView = ({ lat, lng, nama, alamat }: MapViewProps) => {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link    = document.createElement('link')
      link.id       = 'leaflet-css'
      link.rel      = 'stylesheet'
      link.href     = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS lalu init map
    const script = document.createElement('script')
    script.src   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as { L?: typeof import('leaflet') }).L
      if (!L || !mapRef.current) return

      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], 16)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      // Custom marker amber
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:36px;height:36px;border-radius:50% 50% 50% 0;
          background:#f59e0b;border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          transform:rotate(-45deg);
        "></div>`,
        iconSize:   [36, 36],
        iconAnchor: [18, 36],
        popupAnchor:[0, -36],
      })

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${nama}</b>${alamat ? `<br/><span style="font-size:12px;color:#666">${alamat}</span>` : ''}`)
        .openPopup()

      mapInstance.current = map
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove()
        mapInstance.current = null
      }
    }
  }, [lat, lng, nama, alamat])

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      <div ref={mapRef} style={{ height: '220px', width: '100%' }} />
      {/* Link buka Google Maps */}
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
