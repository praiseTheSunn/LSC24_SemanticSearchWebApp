import "./geomanControl.css";
import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import * as turf from '@turf/turf'
import * as L from "leaflet";

const GeomanControl = ({geoFeatures}) => {
  const map = useMap();

//   const [added, setAdded] = useState(false);
  const [geoFeaturesState, setGeoFeaturesState] = useState(null);

  // default icon
  const defaultIcon = L.icon({
    iconUrl: require('../assets/close.png'),
    // iconUrl: URL.createObjectURL(new Blob([imageList[0]], {type: 'image/png'})),
    iconSize: [32,32],
    // iconAnchor: [32, 64],
    // popupAnchor: null,
    shadowUrl: null,
    shadowSize: null,
    shadowAnchor: null
});
  

  // add control map
  map.pm.addControls({  
    position: 'topleft',  
    // drawCircleMarker: false,
    // rotateMode: false,
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
    console.log("geoFeatures in events", geoFeatures);
    if (geoFeatures === undefined) {
      return;
    }
    setGeoFeaturesState(geoFeatures);

    // map.eachLayer( function(layer) {
    //   if(layer instanceof L.Marker) {
    //     if(map.getBounds().contains(layer.getLatLng())) {
    //       // features.push(layer.feature);
    //       console.log(layer)
    //       layer.setIcon(myIcon2);
    //     }
    //   }
    // });

    // create markers
    geoFeatures.forEach(function (d) {
      var marker = L.marker([d.geometry.coordinates[1], d.geometry.coordinates[0]], {icon: defaultIcon}).addTo(map);
      var file_name = d.properties.ImageID;
      var imageUrl = getImageUrl(file_name);

      imageUrl = imageUrl.replace(/\.jpg/gi, "");

      var customPopup = "<img src='" + imageUrl + "' width='600px' height='600px' />";
      var customOptions = {
        // 'maxWidth': '400',
        // 'width': '200',
        // 'height': '200',
        'className' : 'custom-popup'
      }
      marker.bindPopup(customPopup, customOptions);
      marker.on('mouseover', function (e) {
        this.openPopup();
      });

      // fetchImageAsBlob("https://assets.teenvogue.com/photos/641b2a23912ddccbabf80f80/16:9/w_2560%2Cc_limit/GettyImages-1474459622.jpg")
      // .then(blob => {
      //     // You can use the blob here
      //     // console.log(blob);
      //     // let blob = await fetch(imageUrl).then(r => r.blob());
      //     let url = URL.createObjectURL(blob);
      //     var newIcon = L.icon({iconUrl: url})
      //     console.log("new icon here", newIcon);
      //     marker.setIcon(newIcon);
      //     // console.log("newIcon", newIcon);
      // })
      // .catch(e => {
      //     console.error('There has been a problem with your fetch operation: ' + e.message);
      // });


      // let blob = await fetch(imageUrl).then(r => r.blob());
      // let url = URL.createObjectURL(blob);
      // var newIcon = L.icon({iconUrl: url})

      // const newIcon = L.icon({
      //   iconUrl: url,
      //   // iconUrl: URL.createObjectURL(new Blob([imageList[0]], {type: 'image/png'})),
      //   iconSize: [64,64],
      //   // iconAnchor: [32, 64],
      //   // popupAnchor: null,
      //   shadowUrl: null,
      //   shadowSize: null,
      //   shadowAnchor: null
      // });

      // console.log("imageUrl", imageUrl);
      // marker.bindPopup(d.properties.name);
    });

  }, [geoFeatures]);

  // process bounding box events
  map.on('pm:create', (e) => {  
    var feature = e.layer.toGeoJSON();
    if (geoFeaturesState === null) {
      return;
    }
    

    for (let [index, value] of geoFeatures.entries()) {
      // console.log(value);
      // console.log(value.geometry.coordinates[1], value.geometry.coordinates[0])
      value.within = turf.booleanWithin(turf.point([value.geometry.coordinates[0], value.geometry.coordinates[1]]), feature );
      if (value.within) {
        console.log(value, "within");
      }
    }

    // for (let i = 0; i < geoFeatures.length; i++) {
    //   let d = geoFeatures[i];
    // //   d.within = turf.booleanWithin(turf.point([d.longitude, d.latitude]), feature );
    // //   if (d.within) {
    // //     console.log(d);
    // //   }
    //     console.log(d);
    // }
    // geoFeatures.forEach(function (d) {
    //       d.within = turf.booleanWithin(turf.point([d.longitude, d.latitude]), feature );
    //       if (d.within) {
    //         console.log(d);
    //       }
    //     });
    console.log("created", e.layer.toGeoJSON());
  });





  return null;
};

export default GeomanControl;