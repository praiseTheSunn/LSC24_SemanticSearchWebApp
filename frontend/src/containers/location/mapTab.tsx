import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import GeomanControl from '../../components/geomanControl'
import LocationTimeline from './locationTimeline'

const MapTab = ({ data } : { data: JSON[] }) => {
  const [geojsonFeature, setGeojsonFeature] = useState([])

  const myIcon = L.icon({
    iconUrl: require('../../assets/close.png'),
    iconSize: [64, 64],
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null,
  })

  useEffect(() => {
    if (data === undefined) {
      return
    }
    setGeojsonFeature(data)
  }, [data])

  return (
    <div className="p-5 flex">
      <div className="h-[500px] w-[1000px] flex-1">
        <MapContainer center={[53.38998, -6.1457602]} zoom={13}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeomanControl
            data={geojsonFeature}
            setData={setGeojsonFeature}
            dataSrc={data}
          />
        </MapContainer>
      </div>
      <div className="h-[500px] w-[1000px] flex-1 ml-5">
        <LocationTimeline data={geojsonFeature} />
      </div>
    </div>
  )
}

export default MapTab
