import * as L from 'leaflet'
import type React from 'react'
import { useEffect, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import { useAppSelector } from '../../AppState'
import GeomanControl from '../../components/geomanControl'
import type { ImageRecord } from '../../types/image'
import LocationTimeline from './locationTimeline'

const MapTab = () => {
  const [geojsonFeature, setGeojsonFeature] = useState([])

  const data: ImageRecord[] = useAppSelector((state) => state.app.data)

  const myIcon = L.icon({
    iconUrl: require('../../assets/close.png'),
    iconSize: [64, 64],
    shadowUrl: undefined,
    shadowSize: undefined,
    shadowAnchor: undefined,
  })

  useEffect(() => {
    if (data === undefined) {
      return
    }
    setGeojsonFeature(data)
  }, [data])

  return (
    // <div className="p-5 flex">
    //   <div className="h-[500px] w-[1000px] flex-1">
    //     <MapContainer center={[53.38998, -6.1457602]} zoom={13}>
    //       <TileLayer
    //         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    //         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    //       />
    //       <GeomanControl
    //         data={geojsonFeature}
    //         setData={setGeojsonFeature as React.Dispatch<React.SetStateAction<JSON[]>>}
    //         dataSrc={data}
    //       />
    //     </MapContainer>
    //   </div>
    //   <div className="h-[500px] w-[1000px] flex-1 ml-5">
    //     <LocationTimeline data={geojsonFeature} />
    //   </div>
    // </div>
    <div style={{ padding: '20px', display: 'flex' }}>
      <div style={{ height: '500px', width: '1000px', flex: 1 }}>
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
            setData={
              setGeojsonFeature as React.Dispatch<React.SetStateAction<JSON[]>>
            }
            dataSrc={data}
          />
        </MapContainer>
      </div>
      <div
        style={{
          height: '500px',
          width: '1000px',
          flex: 1,
          marginLeft: '20px',
        }}
      >
        <LocationTimeline data={geojsonFeature} />
      </div>
    </div>
  )
}

export default MapTab
