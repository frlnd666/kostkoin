// src/components/listing/LocationPicker.tsx

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, CheckCircle } from 'lucide-react'
// Tipe global Leaflet diambil dari src/types/leaflet.d.ts (otomatis)

interface LocationPickerProps {
  lat?:     number
  lng?:     number
  onChange: (lat: number, lng: number) => void
}

const LocationPicker = ({ lat, lng, onChange }: LocationPickerProps) => {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<LMap | null>(null)
  const markerRef   = useRef<LMarker | null>(null)
  const [coords,     setCoords]     = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [loadingGPS, setLoadingGPS] = useState(false)
  const [mapReady,   setMapReady]   = useState(false)

  const defaultLat = lat ?? -6.1201
  const defaultLng = lng ?? 106.1504

  // ── Load Leaflet CSS + JS via CDN ──
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link  = document.createElement('link')
      link.id     = 'leaflet-css'
      link.rel    = 'stylesheet'
      link.href   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    if (window.L) {
      setMapReady(true)
      return
    }
    if (document.getElementById('leaflet-js')) {
      // Script sudah ada, tunggu load
      const check = setInterval(() => {
        if (window.L) { clearInterval(check); setMapReady(true) }
      }, 100)
      return () => clearInterval(check)
    }
    const script  = document.createElement('script')
    script.id     = 'leaflet-js'
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setMapReady(true)
    document.head.appendChild(script)
  }, [])

  // ── Init peta setelah Leaflet siap ──
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstance.current) return

    const L   = window.L
    const map = L.map(mapRef.current, {}).setView([defaultLat, defaultLng], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    const makeIcon = (): LIcon => L.divIcon({
      className:   '',
      html:        `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#f59e0b;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
      iconSize:    [28, 28],
      iconAnchor:  [14, 28],
    })

    const placeMarker = (cLat: number, cLng: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([cLat, cLng])
      } else {
        const m = L.marker([cLat, cLng], { icon: makeIcon(), draggable: true }).addTo(map)
        m.on('dragend', () => {
          const pos = m.getLatLng()
          setCoords({ lat: pos.lat, lng: pos.lng })
          onChange(pos.lat, pos.lng)
        })
        markerRef.current = m
      }
      setCoords({ lat: cLat, lng: cLng })
      onChange(cLat, cLng)
    }

    if (lat && lng) placeMarker(lat, lng)

    map.on('click', (e) => placeMarker(e.latlng.lat, e.latlng.lng))

    mapInstance.current = map

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
      markerRef.current   = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady])

  // ── GPS ──
  const handleGPS = () => {
    if (!navigator.geolocation || !mapInstance.current) return
    setLoadingGPS(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords: c }) => {
        const map = mapInstance.current!
        map.setView([c.latitude, c.longitude], 17)

        if (markerRef.current) {
          markerRef.current.setLatLng([c.latitude, c.longitude])
        } else {
          const m = window.L.marker([c.latitude, c.longitude], {
            icon: window.L.divIcon({
              className:  '',
              html:       `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#f59e0b;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);transform:rotate(-45deg);"></div>`,
              iconSize:   [28, 28],
              iconAnchor: [14, 28],
            }),
            draggable: true,
          }).addTo(map)
          m.on('dragend', () => {
            const pos = m.getLatLng()
            setCoords({ lat: pos.lat, lng: pos.lng })
            onChange(pos.lat, pos.lng)
          })
          markerRef.current = m
        }

        setCoords({ lat: c.latitude, lng: c.longitude })
        onChange(c.latitude, c.longitude)
        setLoadingGPS(false)
      },
      () => setLoadingGPS(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleGPS}
        disabled={loadingGPS || !mapReady}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold text-blue-600 transition-colors disabled:opacity-50 w-fit"
      >
        <Navigation size={13} className={loadingGPS ? 'animate-spin' : ''} />
        {loadingGPS ? 'Mendeteksi lokasi...' : 'Gunakan Lokasi Saya (GPS)'}
      </button>

      {!mapReady ? (
        <div className="h-60 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-sm border border-slate-200">
          Memuat peta...
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div ref={mapRef} style={{ height: '240px', width: '100%' }} />
        </div>
      )}

      {coords ? (
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-2 rounded-xl">
          <CheckCircle size={12} />
          Lokasi ditandai: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
          <MapPin size={12} />
          Klik peta untuk menandai lokasi kost, atau gunakan GPS di atas
        </div>
      )}
    </div>
  )
}

export default LocationPicker
