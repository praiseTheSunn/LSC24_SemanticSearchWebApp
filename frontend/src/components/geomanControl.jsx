import "./geomanControl.css";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import * as turf from '@turf/turf'
import * as L from "leaflet";

const GeomanControl = ({data, setData, dataSrc}) => {
  const map = useMap();

  const [geoFeaturesState, setGeoFeaturesState] = useState(null);

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
    // received geofeatures from parent
    console.log("geoFeatures in events", data);
    if (data === undefined) {
      return;
    }
    setGeoFeaturesState(data);

    // create markers
    data.forEach(function (d) {
      console.log("why " + d.new_lat === null)
      if ((d.new_lat === null || d.new_lng === null)) {
        return;
      }
      var marker = L.marker([d.new_lat, d.new_lng], {icon: defaultIcon}).addTo(map);
      var imageUrl = d.img_link;

      var customPopup = "<img src='" + imageUrl + "' width='600px' height='600px' />";
      var customOptions = {
        'className' : 'custom-popup'
      }
      marker.bindPopup(customPopup, customOptions);
      marker.on('mouseover', function (e) {
        this.openPopup();
      });
      marker.on('mouseout', function (e) {
        this.closePopup();
      });

    });

  }, [data]);

  // process bounding box events
  map.on('pm:create', (e) => {  
    var feature = e.layer.toGeoJSON();
    if (geoFeaturesState === null) {
      return;
    }
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