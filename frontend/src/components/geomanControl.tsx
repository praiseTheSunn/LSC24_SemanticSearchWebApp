import * as turf from '@turf/turf'
import * as L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { useMap } from 'react-leaflet'
import type { ImageRecord } from '../types/image'
import './geomanControl.css'

interface LocationJSON extends ImageRecord {
  new_lat: number
  new_lng: number
  within?: boolean
}

export interface MapCluster {
  key: string
  lat: number
  lng: number
  locationLabel: string
  images: ImageRecord[]
  distanceToCenterMeters: number
  isClosestToCenter: boolean
}

export interface MapCenter {
  lat: number
  lng: number
}

const escapeHtml = (unsafe: string): string =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const getClusterRadius = (zoom: number): number => {
  const baseRadius = 0.01
  const scaled = baseRadius * Math.pow(2, 13 - zoom)
  return Math.min(Math.max(scaled, 0.0007), 0.15)
}

const getClusterLocationLabel = (cluster: LocationJSON[]): string => {
  const counts = new Map<string, number>()
  cluster.forEach((item) => {
    const label = item.location_displayed || item.location || `Location ${item.location_id}`
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  let bestLabel = 'Unknown location'
  let bestCount = 0

  counts.forEach((count, label) => {
    if (count > bestCount) {
      bestCount = count
      bestLabel = label
    }
  })

  return bestLabel
}

const buildClusterPopup = (cluster: LocationJSON[], locationLabel: string): string => {
  const previewItems = cluster.slice(0, 6)
  const gallery = previewItems
    .map((item) => {
      const safeUrl = escapeHtml(item.img_link ?? '')
      return `<img class="cluster-popup-image" src="${safeUrl}" alt="cluster preview" />`
    })
    .join('')

  const remaining = cluster.length - previewItems.length
  const footer = remaining > 0 ? `<div class="cluster-popup-more">+${remaining} more</div>` : ''

  return `<div class="cluster-popup-wrapper"><div class="cluster-popup-title">${escapeHtml(locationLabel)}</div><div class="cluster-popup-grid">${gallery}</div>${footer}</div>`
}

const buildClusterIcon = (
  cluster: LocationJSON[],
  locationLabel: string,
  isClosest: boolean,
): L.DivIcon => {
  const sample = cluster[0]?.img_link ?? ''
  const safeUrl = escapeHtml(sample)
  const count = cluster.length
  const safeLabel = escapeHtml(locationLabel)
  const closestClass = isClosest ? 'closest' : ''
  const closestBadge = isClosest
    ? '<span class="image-cluster-closest-badge" title="Closest to map center">◎</span>'
    : ''

  const html = `
    <div class="image-cluster-marker ${closestClass}">
      <img src="${safeUrl}" alt="cluster" class="image-cluster-thumb" />
      <span class="image-cluster-count">${count}</span>
      ${closestBadge}
      <span class="image-cluster-location">${safeLabel}</span>
    </div>
  `

  return L.divIcon({
    html,
    className: 'image-cluster-icon-root',
    iconSize: [58, 58],
    iconAnchor: [29, 29],
    popupAnchor: [0, -26],
  })
}

const GeomanControl = ({
  data,
  setData,
  dataSrc,
  onClustersChange,
  onMapCenterChange,
}: {
  data: ImageRecord[]
  setData: React.Dispatch<React.SetStateAction<ImageRecord[]>>
  dataSrc: ImageRecord[]
  onClustersChange?: (clusters: MapCluster[]) => void
  onMapCenterChange?: (center: MapCenter) => void
}) => {
  const map = useMap()
  const [viewportVersion, setViewportVersion] = useState(0)

  const validData = useMemo(
    () =>
      data.filter(
        (d): d is LocationJSON =>
          typeof d.new_lat === 'number' && typeof d.new_lng === 'number',
      ),
    [data],
  )

  useEffect(() => {
    const mapAny = map as unknown as {
      pm?: {
        addControls?: (options: Record<string, unknown>) => void
      }
    }

    if (!mapAny.pm?.addControls) {
      return
    }

    mapAny.pm.addControls({
      position: 'topleft',
      drawMarker: false,
      drawPolyline: false,
      drawText: false,
      drawCircle: false,
      drawCircleMarker: false,
    })
  }, [map])

  useEffect(() => {
    const handleViewportChange = () => {
      setViewportVersion((prev) => prev + 1)
    }

    map.on('zoomend', handleViewportChange)
    map.on('moveend', handleViewportChange)

    return () => {
      map.off('zoomend', handleViewportChange)
      map.off('moveend', handleViewportChange)
    }
  }, [map])

  useEffect(() => {
    if (validData.length === 0) {
      return
    }

    const latitudes = validData
      .map((d) => d.new_lat)
      .sort((a, b) => a - b)
    const longitudes = validData
      .map((d) => d.new_lng)
      .sort((a, b) => a - b)

    const medianLat =
      latitudes.length % 2 === 0
        ? (latitudes[latitudes.length / 2 - 1] + latitudes[latitudes.length / 2]) / 2
        : latitudes[Math.floor(latitudes.length / 2)]

    const medianLng =
      longitudes.length % 2 === 0
        ? (longitudes[longitudes.length / 2 - 1] + longitudes[longitudes.length / 2]) / 2
        : longitudes[Math.floor(longitudes.length / 2)]

    map.setView([medianLat, medianLng], 13)
  }, [validData, map])

  useEffect(() => {
    if (!Array.isArray(data)) {
      return
    }

    const markers: L.Marker[] = []

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    const clusteringRadius = getClusterRadius(map.getZoom())
    const clusters: Record<string, LocationJSON[]> = {}

    validData.forEach((item) => {
      const clusterKey = `${Math.floor(item.new_lat / clusteringRadius)}_${Math.floor(item.new_lng / clusteringRadius)}`
      if (!clusters[clusterKey]) {
        clusters[clusterKey] = []
      }
      clusters[clusterKey].push(item)
    })

    const center = map.getCenter()
    const centerPoint: MapCenter = { lat: center.lat, lng: center.lng }
    onMapCenterChange?.(centerPoint)

    const clusterEntries = Object.entries(clusters).map(([clusterKey, cluster]) => {
      const clusterLat = cluster.reduce((sum, d) => sum + d.new_lat, 0) / cluster.length
      const clusterLng = cluster.reduce((sum, d) => sum + d.new_lng, 0) / cluster.length
      const locationLabel = getClusterLocationLabel(cluster)
      const distanceToCenterMeters = map.distance([clusterLat, clusterLng], [center.lat, center.lng])

      return {
        clusterKey,
        cluster,
        clusterLat,
        clusterLng,
        locationLabel,
        distanceToCenterMeters,
      }
    })

    const closestClusterKey =
      clusterEntries.length > 0
        ? clusterEntries.reduce((best, current) =>
            current.distanceToCenterMeters < best.distanceToCenterMeters ? current : best,
          ).clusterKey
        : null

    const mappedClusters: MapCluster[] = clusterEntries.map((entry) => ({
      key: entry.clusterKey,
      lat: entry.clusterLat,
      lng: entry.clusterLng,
      locationLabel: entry.locationLabel,
      images: entry.cluster,
      distanceToCenterMeters: entry.distanceToCenterMeters,
      isClosestToCenter: entry.clusterKey === closestClusterKey,
    }))

    mappedClusters.sort((a, b) => a.distanceToCenterMeters - b.distanceToCenterMeters)
    onClustersChange?.(mappedClusters)

    clusterEntries.forEach(({ clusterKey, cluster, clusterLat, clusterLng, locationLabel }) => {
      const isClosest = clusterKey === closestClusterKey

      const marker = L.marker([clusterLat, clusterLng], {
        icon: buildClusterIcon(cluster, locationLabel, isClosest),
      })
      const clusterPopupContent = buildClusterPopup(cluster, locationLabel)

      marker.bindPopup(clusterPopupContent, { className: 'custom-popup' })
      marker.on('mouseover', () => marker.openPopup())
      marker.on('mouseout', () => marker.closePopup())
      marker.on('click', () => {
        setData(clusters[clusterKey])
      })

      marker.addTo(map)
      markers.push(marker)
    })

    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [data, validData, map, onClustersChange, onMapCenterChange, setData, viewportVersion])

  useEffect(() => {
    const handleCreate = (e: L.LeafletEvent & { layer?: { toGeoJSON?: () => GeoJSON.Feature } }) => {
      const feature = e.layer?.toGeoJSON?.()
      if (!feature || !Array.isArray(dataSrc)) {
        return
      }

      const newData = dataSrc.filter((value) => {
        if (typeof value.new_lat !== 'number' || typeof value.new_lng !== 'number') {
          return false
        }

        return turf.booleanWithin(
          turf.point([value.new_lng, value.new_lat]),
          feature as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
        )
      })

      setData(newData)
    }

    const handleMapClick = () => {
      setData(dataSrc)
    }

    const handleRemove = () => {
      setData(dataSrc)
    }

    map.on('pm:create', handleCreate as L.LeafletEventHandlerFn)
    map.on('click', handleMapClick)
    map.on('pm:remove', handleRemove as L.LeafletEventHandlerFn)

    return () => {
      map.off('pm:create', handleCreate as L.LeafletEventHandlerFn)
      map.off('click', handleMapClick)
      map.off('pm:remove', handleRemove as L.LeafletEventHandlerFn)
    }
  }, [dataSrc, map, setData])

  return null
}

export default GeomanControl
