import './mapTab.css';
// import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import testgeojson from '../../assets/test.geojson'

import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
// import { GeomanControl } from "./geomanTest";
import GeomanControl from "../../components/geomanControl";
import LocationTimeline from './locationTimeline';

const imageList = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY2oYj5Olj4XiuIB5uEeaWbxc8Y6_Zup5lcfEUCt5IIidsiHIUR_2xua7vepE7RP4KHCw&usqp=CAU",
  "https://s1.ticketm.net/dam/a/a67/86eb84c0-ad6a-43c6-a55f-ff5d109c9a67_RETINA_PORTRAIT_3_2.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQANCqdY31uljrV73FJrq9RYPdHUbqqou5lXfTGDLH-dQ&s",
  "https://assets.teenvogue.com/photos/641b2a23912ddccbabf80f80/16:9/w_2560%2Cc_limit/GettyImages-1474459622.jpg",
  "https://m.media-amazon.com/images/I/71LVEINqZaL._UF1000,1000_QL80_.jpg",
  "https://e3.365dm.com/23/08/1600x900/skynews-taylor-swift-santa-clara_6237922.jpg?20230802101540",
  "https://ca-times.brightspotcdn.com/dims4/default/b598fb5/2147483647/strip/true/crop/4000x2667+0+0/resize/1200x800!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2Fe0%2Fde%2F9e80ee1545d9bc32a14a304bede6%2Ftaylor-swift-francia-07405.jpg",
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYFAXqcwl-tVJwjkdF3G3Fwry4ukTFtTNBcec4q2Hyfw&s",
  "https://i9.ytimg.com/s_p/OLAK5uy_mvRgYPh8u-KBTbU6mkGyrg5CBduos_LEY/sddefault.jpg?sqp=COiP8bEGir7X7AMICKL-0LEGEAE=&rs=AOn4CLD1G-WpT3xymRoMXy3Dk4aUennlzg&v=1714700066",
  "https://i.abcnewsfe.com/a/06f5ba1e-de2d-4b1a-b3df-4a1649608ac2/katy-perry-taylor-swift-01-ht-jt-240223_1708718542679_hpEmbed_4x5.jpg"
]


const timelineData = [
  { date: "2023-01-01", score: 7, img_link: imageList[0], location: "Location 1", activity: "Dancing" },
  { date: "2023-03-15", score: 9, img_link: imageList[1], location: "Location 2", activity: "Drive to work"  },
  { date: "2023-01-01", score: 3, img_link: imageList[4], location: "Location 1", activity: "Lecturing"  },
  { date: "2022-01-01", score: 1, img_link: imageList[8], location: "Location 2", activity: "Breakfast"  },
  { date: "2023-01-15", score: 3, img_link: imageList[2], location: "Location 3", activity: "Breakfast"  },
  { date: "2012-06-20", score: 3, img_link: imageList[3], location: "Location 1", activity: "Dancing"  },
  { date: "2022-01-01", score: 8, img_link: imageList[4], location: "Location 2", activity: "Drive to work"  },
  { date: "2023-12-15", score: 4, img_link: imageList[5], location: "Location 3", activity: "Breakfast"  },
  { date: "2023-01-01", score: 2, img_link: imageList[2], location: "Location 1", activity: "Breakfast"  },
  { date: "2023-01-01", score: 5, img_link: imageList[3], location: "Location 1", activity: "Drive to work"  },
  { date: "2023-01-01", score: 3, img_link: imageList[9], location: "Location 2", activity: "Drive to work"  },
  { date: "2023-01-01", score: 2, img_link: imageList[2], location: "Location 3", activity: "Lecturing"  },
  { date: "2023-01-02", score: 0, img_link: imageList[9], location: "Location 3", activity: "Lecturing"  },
  { date: "2012-06-20", score: 4, img_link: imageList[5], location: "Location 1", activity: "Dancing"  },
  { date: "2022-01-01", score: 8, img_link: imageList[0], location: "Location 2", activity: "Breakfast"  },
  { date: "2023-12-15", score: 4, img_link: imageList[1], location: "Location 2", activity: "Breakfast"  },
  { date: "2023-01-01", score: 2, img_link: imageList[5], location: "Location 4", activity: "Drive to work"  },
  { date: "2023-03-15", score: 8, img_link: imageList[2], location: "Location 4", activity: "Lecturing"  },
  { date: "2023-03-15", score: 5, img_link: imageList[3], location: "Location 4", activity: "Drive to work"  },
  { date: "2023-01-02", score: 3, img_link: imageList[7], location: "Location 1", activity: "Drive to work"  },
  { date: "2022-01-02", score: 1, img_link: imageList[8], location: "Location 2", activity: "Breakfast"  },
  { date: "2022-01-02", score: 2, img_link: imageList[0], location: "Location 3", activity: "Lecturing"  },
  { date: "2022-01-02", score: 2, img_link: imageList[3], location: "Location 3", activity: "Drive to work"  },
  { date: "2023-01-15", score: 3, img_link: imageList[2], location: "Location 4", activity: "Breakfast"  },
  { date: "2023-12-15", score: 8, img_link: imageList[4], location: "Location 2", activity: "Drive to work"  },
  { date: "2023-12-15", score: 4, img_link: imageList[7], location: "Location 4", activity: "Breakfast"  },
  { date: "2023-01-02", score: 2, img_link: imageList[5], location: "Location 4", activity: "Lecturing"  },
  { date: "2023-01-01", score: 5, img_link: imageList[5], location: "Location 1", activity: "Drive to work"  },
  { date: "2023-01-01", score: 3, img_link: imageList[6], location: "Location 2", activity: "Drive to work"  },
  { date: "2023-01-02", score: 2, img_link: imageList[8], location: "Location 1", activity: "Lecturing"  },
  { date: "2023-01-02", score: 0, img_link: imageList[9], location: "Location 2", activity: "Lecturing"  },
  { date: "2012-06-20", score: 3, img_link: imageList[3], location: "Location 1", activity: "Breakfast"  },
];

const MapTab = ({query, filters}) => {
    const [markers, setMarkers] = useState([
        // { position: new LatLng(51.505, -0.09), key: 1 },
        // { position: new LatLng(53.3854525, -6.2571793), key: 2 },
    ]);
    const [geojsonFeature, setGeojsonFeature] = useState([
    ]);

    const [currentImage, setCurrentImage] = useState(null);


    const myIcon = L.icon({
        iconUrl: require('../../assets/close.png'),
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
                {/* {geojsonFeature.features?.map((feature, index) => (
                  <Marker key={index} position={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]} icon={myIcon}
                  eventHandlers={{
                    click: (e) => {
                      console.log('marker clicked', e);
                      setCurrentImage(feature.properties.ImageID);
                    },
                  }}
                  >
                    <Popup>
                      <img src={feature.properties.ImageID} alt="Image" style={{ maxWidth: '100%' }} />
                    </Popup>
                  </Marker>
                ))} */}

                {/* <GeomanControl position="topleft" oneBlock /> */}
                <GeomanControl geoFeatures={geojsonFeature.features} />
            </MapContainer>
        </div>
        <div className="timeline-container">
            {/* <h1>Timeline</h1> */}
            {/* <h1>
            
              {currentImage}
            </h1> */}
          <LocationTimeline data={timelineData}/>
            
        </div>            
      </div>
    );
}

export default MapTab;