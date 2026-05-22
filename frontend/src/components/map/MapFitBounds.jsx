import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const FIT_PADDING = [56, 56]
const SINGLE_POINT_ZOOM = 10

export default function MapFitBounds({ positions }) {
  const map = useMap()

  useEffect(() => {
    if (!positions?.length) return

    let cancelled = false

    const fit = () => {
      if (cancelled) return
      map.invalidateSize({ animate: false })

      if (positions.length === 1) {
        map.setView(positions[0], SINGLE_POINT_ZOOM, { animate: false })
        return
      }

      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, {
        padding: FIT_PADDING,
        maxZoom: 12,
        animate: false,
      })
    }

    const frame = requestAnimationFrame(fit)
    const container = map.getContainer()?.parentElement
    let resizeObserver

    if (container && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(fit)
      })
      resizeObserver.observe(container)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
    }
  }, [map, positions])

  return null
}
