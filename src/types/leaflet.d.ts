// src/types/leaflet.d.ts
// Deklarasi global Leaflet (dimuat via CDN) — SATU file, tidak boleh duplikat

interface LeafletDivIconOptions {
  className?: string
  html?: string
  iconSize?: [number, number]
  iconAnchor?: [number, number]
  popupAnchor?: [number, number]
}

interface LeafletMarkerOptions {
  icon?: unknown
  draggable?: boolean
}

interface LeafletTileLayerOptions {
  attribution?: string
  maxZoom?: number
}

interface LeafletMapOptions {
  zoomControl?: boolean
}

interface LMap {
  setView(center: [number, number], zoom: number): LMap
  on(event: string, handler: (e: { latlng: { lat: number; lng: number } }) => void): void
  remove(): void
}

interface LMarker {
  addTo(map: LMap): LMarker
  on(event: string, handler: () => void): LMarker
  getLatLng(): { lat: number; lng: number }
  setLatLng(pos: [number, number]): LMarker
  bindPopup(content: string): LMarker
  openPopup(): LMarker
}

interface LLayer {
  addTo(map: LMap): LLayer
}

interface LIcon {}

interface LeafletStatic {
  map(el: HTMLElement, opts?: LeafletMapOptions): LMap
  tileLayer(url: string, opts?: LeafletTileLayerOptions): LLayer
  marker(pos: [number, number], opts?: LeafletMarkerOptions): LMarker
  divIcon(opts: LeafletDivIconOptions): LIcon
}

declare global {
  interface Window {
    L: LeafletStatic
  }
}

export {}
