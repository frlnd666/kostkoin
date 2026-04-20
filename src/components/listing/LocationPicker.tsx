// src/components/listing/LocationPicker.tsx

import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation }          from 'lucide-react'

interface LocationPickerProps {
  lat?:      number
  lng?:      number
  onChange:  (lat: number, lng: number, alamat?: string) => void
}

const LocationPicker = ({ lat, lng, onChange }: LocationPickerProps) => {
  const mapRef      = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<unknown>(null)
  const markerRef   = useRef<unknown>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  )
  const [loadingGPS, setLoadingGPS] = useState(false)

  // Default center: Banten
  const defaultLat = lat ?? -6.1201
  const defaultLng = lng ?? 106.1504

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id    = 'leaflet-css'
      link.rel   = 'stylesheet'
      link.href  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const script  = document.createElement('script')
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      const L = (window as { L?: typeof import('leaflet') }).L
      if (!L || !mapRef.current) return

      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)

      // Custom marker amber
      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;
          background:#f59e0b;border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.35);
          transform:rotate(-45deg);
        "></div>`,
        iconSize: [32, 32], iconAnchor: [16, 32],
      })

      // Jika sudah ada koordinat, langsung pasang marker
      if (lat && lng) {
        markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map)
        ;(markerRef.current as { on: (e: string, cb: () => void) => void })
          .on('dragend', () => {
            const pos = (markerRef.current as { getLatLng: () => { lat: number; lng: number } }).getLatLng()
            setCoords({ lat: pos.lat, lng: pos.lng })
            onChange(pos.lat, pos.lng)
          })
      }

      // Klik peta → pindahkan/buat marker
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        const { lat: cLat, lng: cLng } = e.latlng

        if (markerRef.current) {
          (markerRef.current as { setLatLng: (pos: [number, number]) => void })
            .setLatLng([cLat, cLng])
        } else {
          markerRef.current = L.marker([cLat, cLng], { icon, draggable: true }).addTo(map)
          ;(markerRef.current as { on: (e: string, cb: () => void) => void })
            .on('dragend', () => {
              const pos = (markerRef.current as { getLatLng: () => { lat: number; lng: number } }).getLatLng()
              setCoords({ lat: pos.lat, lng: pos.lng })
              onChange(pos.lat, pos.lng)
            })
        }

        setCoords({ lat: cLat, lng: cLng })
        onChange(cLat, cLng)
      })

      mapInstance.current = map
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove()
        mapInstance.current = null
        markerRef.current   = null
      }
    }
  }, [])

  // Tombol "Gunakan Lokasi Saya"
  const handleGPS = () => {
    if (!navigator.geolocation) return
    setLoadingGPS(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        const L = (window as { L?: typeof import('leaflet') }).L
        if (!L || !mapInstance.current) { setLoadingGPS(false); return }

        const map  = mapInstance.current as { setView: (c: [number, number], z: number) => void }
        map.setView([latitude, longitude], 17)

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:32px;height:32px;border-radius:50% 50% 50% 0;
            background:#f59e0b;border:3px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
            transform:rotate(-45deg);
          "></div>`,
          iconSize: [32, 32], iconAnchor: [16, 32],
        })

        if (markerRef.current) {
          (markerRef.current as { setLatLng: (p: [number, number]) => void })
            .setLatLng([latitude, longitude])
        } else {
          const mapFull = mapInstance.current as { addLayer?: (l: unknown) => void } & ReturnType<typeof L.map>
          markerRef.current = L.marker([latitude, longitude], { icon, draggable: true }).addTo(mapFull)
        }

        setCoords({ lat: latitude, lng: longitude })
        onChange(latitude, longitude)
        setLoadingGPS(false)
      },
      () => setLoadingGPS(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Tombol GPS */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={loadingGPS}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold text-blue-600 transition-colors disabled:opacity-50"
      >
        <Navigation size={13} className={loadingGPS ? 'animate-spin' : ''} />
        {loadingGPS ? 'Mendeteksi lokasi...' : 'Gunakan Lokasi Saya (GPS)'}
      </button>

      {/* Peta */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div ref={mapRef} style={{ height: '240px', width: '100%' }} />
      </div>

      {/* Info klik */}
      <p className="text-[11px] text-slate-400 text-center">
        {coords
          ? `📍 Titik dipilih: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
          : '👆 Klik peta untuk menentukan lokasi kost atau gunakan GPS'
        }
      </p>

      {/* Koordinat tersembunyi untuk validasi */}
      {!coords && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
          <MapPin size={12} />
          Belum ada titik lokasi yang dipilih. Klik peta untuk menandai lokasi kost.
        </div>
      )}
    </div>
  )
}

export default LocationPicker
