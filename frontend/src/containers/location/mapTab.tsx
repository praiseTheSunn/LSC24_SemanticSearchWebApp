import { useEffect, useState } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { useAppSelector } from '../../AppState'
import GeomanControl from '../../components/geomanControl'
import type { MapCenter, MapCluster } from '../../components/geomanControl'
import type { ImageRecord } from '../../types/image'
import LocationTimeline from './locationTimeline'
import './mapTab.css'

const MapTab = () => {
  const [geojsonFeature, setGeojsonFeature] = useState<ImageRecord[]>([])
  const [clusters, setClusters] = useState<MapCluster[]>([])
  const [mapCenter, setMapCenter] = useState<MapCenter>({
    lat: 53.38998,
    lng: -6.1457602,
  })
  const data: ImageRecord[] = useAppSelector((state) => state.app.data)

  useEffect(() => {
    if (!Array.isArray(data)) {
      return
    }
    setGeojsonFeature(data)
  }, [data])

  return (
    <div className="tab-container">
      <div className="map-container" style={{ zIndex: 0 }}>
        <MapContainer
          center={[53.38998, -6.1457602]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeomanControl
            data={geojsonFeature}
            setData={setGeojsonFeature}
            dataSrc={data}
            onClustersChange={setClusters}
            onMapCenterChange={setMapCenter}
          />
        </MapContainer>
      </div>
      <div className="timeline-container">
        <LocationTimeline clusters={clusters} mapCenter={mapCenter} />
      </div>
    </div>
  )
}

export default MapTab
