import "./geomanControl.css";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import * as turf from '@turf/turf'
import * as L from "leaflet";
// import 'leaflet.markercluster';


const GeomanControl = ({data, setData, dataSrc}) => {
  const map = useMap();
  const [isClicked, setIsClicked] = useState(false);
  const [prevClickItem, setPrevClickItem] = useState(null);

  // default icon
  const defaultIcon = L.icon({
    iconUrl: require('../assets/close.png'),
    iconSize: [32,32],
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null
});
  

  // add control map
  map.pm.addControls({  
    position: 'topleft',  
    drawMarker: false,
    drawPolyline: false,
    drawText: false,
    drawCircle: false,
    drawCircleMarker: false,
  }); 

  function getImageUrl(filename) {
    const baseUrl = "http://34.124.236.208/img_lsc/";
    const date = filename.slice(0, 8);  // Extract the date from the filename
    const year = date.slice(0, 4);
    const month = date.slice(4, 6);
    const day = date.slice(6, 8);
    return `${baseUrl}${year}${month}/${day}/${filename}.webp`;
  }

  useEffect(() => {
        // Calculate the median of the markers' positions
        const validData = dataSrc.filter(d => d.new_lat !== null && d.new_lng !== null);
        if (validData.length > 0) {
          const latitudes = validData.map(d => d.new_lat).sort((a, b) => a - b);
          const longitudes = validData.map(d => d.new_lng).sort((a, b) => a - b);
      
          const medianLat = latitudes.length % 2 === 0
            ? (latitudes[latitudes.length / 2 - 1] + latitudes[latitudes.length / 2]) / 2
            : latitudes[Math.floor(latitudes.length / 2)];
      
          const medianLng = longitudes.length % 2 === 0
            ? (longitudes[longitudes.length / 2 - 1] + longitudes[longitudes.length / 2]) / 2
            : longitudes[Math.floor(longitudes.length / 2)];
      
          // Set the map view to the median position
          console.log("median", medianLat, medianLng)
          map.setView([medianLat, medianLng], 13);  // You can adjust the zoom level as needed
        }
      }, [dataSrc]);

  useEffect(() => {
    // received geofeatures from parent
    console.log("geoFeatures in events", data);
    if (data === undefined) {
      return;
    }
  
    // Remove all existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
  
    // Define clustering radius (adjust as needed)
    const clusteringRadius = 0.01; // Example radius of 0.01 degrees
  
    // Group data into clusters based on proximity
    const clusters = {};
    dataSrc.forEach(function (d) {
      if (d.new_lat === null || d.new_lng === null) {
        return;
      }
  
      const clusterKey = `${Math.floor(d.new_lat / clusteringRadius)}_${Math.floor(d.new_lng / clusteringRadius)}`;
      if (!clusters[clusterKey]) {
        clusters[clusterKey] = [];
      }
      clusters[clusterKey].push(d);
    });
  
    // Create markers for each cluster
    for (const clusterKey in clusters) {
      const cluster = clusters[clusterKey];
      const clusterLatSum = cluster.reduce((sum, d) => sum + d.new_lat, 0);
      const clusterLngSum = cluster.reduce((sum, d) => sum + d.new_lng, 0);
      const clusterLat = clusterLatSum / cluster.length;
      const clusterLng = clusterLngSum / cluster.length;
  
      const marker = L.marker([clusterLat, clusterLng], { icon: defaultIcon });
  
      // Construct scrollable popup content
    const clusterPopupContent = `<div style="width: 200px; max-height: 200px; overflow-y: auto;">` +
    cluster.map(d => `<img src='${d.img_link}' max-width='300px' height='500px' />`).join('<br/>') +
    `</div>`;
      marker.bindPopup(clusterPopupContent);
  
      marker.on('mouseover', function (e) {
        this.openPopup();
      });
  
      // marker.on('mouseout', function (e) {
      //   this.closePopup();
      // });

      marker.on('click', function (e) {
        // Retrieve data associated with the clicked marker
        const clickedMarkerData = clusters[clusterKey];
        setPrevClickItem(clusterKey);
        console.log("clickedMarkerData", clickedMarkerData);
        // Do something with the data, for example, update state
        setIsClicked(!isClicked);
        setData(!isClicked ? dataSrc : clickedMarkerData);
        
      });

      marker.getPopup().on('remove', function() {
        //Your code here
        // setData(dataSrc);
    });
  
      marker.addTo(map);
    }
  

  
  }, [data]);
  

  // process bounding box events
  map.on('pm:create', (e) => {  
    var feature = e.layer.toGeoJSON();
    if (dataSrc === null) {
      return;
    }
    
    let newData = [];
    for (let [index, value] of dataSrc.entries()) {
      if (typeof(value.new_lat) !== 'number' || typeof(value.new_lng) !== 'number') {
        console.log("not a number", value.new_lat, value.new_lng);
        continue;
      }

      value.within = turf.booleanWithin(turf.point([value.new_lng, value.new_lat]), feature );
      if (value.within) {
        console.log(value, "within");
        newData.push(value);
      }
    }
    setData(newData);

  });

  map.on('pm:remove', (e) => {
    setData(dataSrc);;
  });



  return null;
};

export default GeomanControl;