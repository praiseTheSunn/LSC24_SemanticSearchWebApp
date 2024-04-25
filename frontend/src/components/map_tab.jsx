import './map_tab.css';
import 'leaflet/dist/leaflet.css';
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLng } from 'leaflet';
import L from 'leaflet';

import axios from "axios";

const MapTab = ({query, filters}) => {
    const [markers, setMarkers] = useState([
        { position: new LatLng(51.505, -0.09), key: 1 },
        { position: new LatLng(53.3854525, -6.2571793), key: 2 },
    ]);

    const myIcon = L.icon({
        iconUrl: require('../assets/close.png'),
        iconSize: [64,64],
        // iconAnchor: [32, 64],
        // popupAnchor: null,
        shadowUrl: null,
        shadowSize: null,
        shadowAnchor: null
    });

    useEffect(() => {
        axios.get('http://127.0.0.1:7001/coordinates', {
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                // console.log(response.data);
                setMarkers(preMarkers => {
                    var cnt = 0;
                    return response.data.map((marker) => {
                        // console.log(marker)
                        cnt += 1;
                        return { position: new LatLng(marker['new_lat'], marker['new_lng']), key: cnt }
                    });
                });
            })
            .catch(error => console.error(error));
    }, []);

    const printLabel = (position) => {
        console.log("clicked");
        console.log(position);
    }


    return (
        <div className="map-container">
            <MapContainer center={[51.505, -0.09]} zoom={13}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
                {
                
                markers.map(marker => 
                                
                    <Marker position={marker.position} key={marker.key} icon={myIcon}
                    
                    eventHandlers={{
                        click: (e) => {
                          console.log('marker clicked', e)
                        },
                      }}
                      interactive>

                        <Popup onclick={printLabel(marker.position)} interactive >
                            A pretty CSS3 popup. Easily customizable.
                        </Popup>
                    </Marker>)
                }
            </MapContainer>
            {/* <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
  <TileLayer
    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />
  <Marker position={[51.505, -0.09]}>
    <Popup>
      A pretty CSS3 popup. <br /> Easily customizable.
    </Popup>
  </Marker>
</MapContainer> */}
        </div>
    );
}

export default MapTab;