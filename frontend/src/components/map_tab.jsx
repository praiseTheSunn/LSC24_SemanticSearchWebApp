import './map_tab.css';
// import 'leaflet/dist/leaflet.css';
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import { LatLng } from 'leaflet';
// import L from 'leaflet';

import json from '../assets/metadata_coordinates.geojson'
import testgeojson from '../assets/test.geojson'

import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
// import { GeomanControl } from "./geomanTest";
import GeomanControl from "./geomanControl";

import axios from "axios";

const MapTab = ({query, filters}) => {
    const [markers, setMarkers] = useState([
        // { position: new LatLng(51.505, -0.09), key: 1 },
        // { position: new LatLng(53.3854525, -6.2571793), key: 2 },
    ]);
    const [geojsonFeature, setGeojsonFeature] = useState([
    ]);

    const [currentImage, setCurrentImage] = useState(null);

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
        
        // var geojsonLayer = new L.GeoJSON.AJAX("D:\UltimateDownload\_Yr3Sem1\LSC24\LSC24_SemanticSearchWebApp\metadata_coordinates.geojson");       
        // geojsonLayer.addTo(map);
        // console.log(geojsonLayer);
        // axios.get('http://127.0.0.1:7001/coordinates', {
        //     headers: {
        //         'Content-Type': 'application/json',
        //     }
        // })
        //     .then(response => {
        //         // console.log(response.data);
        //         setMarkers(preMarkers => {
        //             var cnt = 0;
        //             return response.data.map((marker) => {
        //                 // console.log(marker)
        //                 cnt += 1;
        //                 return { position: new LatLng(marker['new_lat'], marker['new_lng']), key: cnt }
        //             });
        //         });
        //     })
        //     .catch(error => console.error(error));
        
    let xhr = new XMLHttpRequest();
    xhr.open('GET', testgeojson);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';
    xhr.onload = function() {
        if (xhr.status !== 200) return
        // L.geoJSON(xhr.response).addTo(map);
        // console.log(xhr.response)
        // geojsonFeature = ();
        setGeojsonFeature(xhr.response);
    };
    xhr.send();
    }, []);

    const printLabel = (position) => {
        console.log("clicked");
        console.log(position);
    }

    useEffect(() => {
        console.log("geojsonFeature", geojsonFeature)
    }, [geojsonFeature]);


    return (
        <div className="tab-container">

        <div className="map-container">
            <MapContainer center={[53.38998, -6.1457602]} zoom={13}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
                {markers.map(marker =>       
                    <Marker position={marker.position} key={marker.key} icon={myIcon}
                    eventHandlers={{
                        click: (e) => {
                          console.log('marker clicked', e);
                        },
                      }}
                      interactive>
                        <Popup onclick={printLabel(marker.position)} interactive >
                            A pretty CSS3 popup. Easily customizable.
                        </Popup>
                    </Marker>)
                }
                {geojsonFeature.features?.map((feature, index) => (
                  <Marker key={index} position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]} icon={myIcon}
                  eventHandlers={{
                    click: (e) => {
                      console.log('marker clicked', e);
                      setCurrentImage(feature.properties.ImageID)
                    },
                  }}
                  >
                    <Popup>
                      <img src={feature.properties.ImageID} alt="Image" style={{ maxWidth: '100%' }} />
                    </Popup>
                  </Marker>
                ))}

                {/* <GeomanControl position="topleft" oneBlock /> */}
                <GeomanControl geoFeatures={geojsonFeature.features} />
            </MapContainer>
        </div>
        <div className="timeline-container">
            <h1>Timeline</h1>
            <h1>
              {currentImage}
            </h1>
        </div>            
      </div>
    );
}

export default MapTab;