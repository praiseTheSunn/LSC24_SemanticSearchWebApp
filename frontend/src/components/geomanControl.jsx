import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import * as turf from '@turf/turf'

const GeomanControl = ({geoFeatures}) => {
  const map = useMap();

//   const [added, setAdded] = useState(false);
  const [geoFeaturesState, setGeoFeaturesState] = useState(null);

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

  useEffect(() => {
    console.log("geoFeatures in events", geoFeatures);
    if (geoFeatures === undefined) {
      return;
    }
    setGeoFeaturesState(geoFeatures);
  }, [geoFeatures]);

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