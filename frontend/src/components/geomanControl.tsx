// turf is for Javascript
import * as turf from '@turf/turf'
import * as L from 'leaflet'
import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import type React from 'react'

interface locationJSON {
  new_lat: number
  new_lng: number
  within: boolean
  img_link: string
}

const GeomanControl = ({ data, setData, dataSrc } : { data: locationJSON[], setData: React.Dispatch<React.SetStateAction<locationJSON[]>>, dataSrc: locationJSON[] }) => {
  const map = useMap()
  const [prevClickItem, setPrevClickItem] = useState(null)

  // default icon
  const defaultIcon = L.icon({
    iconUrl: require('../assets/close.png'),
    iconSize: [32, 32],
    shadowUrl: undefined,
    shadowSize: undefined,
    shadowAnchor: undefined,
  })

  // add control map
  map.pm.addControls({
    position: 'topleft',
    drawMarker: false,
    drawPolyline: false,
    drawText: false,
    drawCircle: false,
    drawCircleMarker: false,
  })

  useEffect(() => {
    // Calculate the median of the markers' positions
    const validData = dataSrc.filter(
      (d) => d.new_lat !== null && d.new_lng !== null,
    )
    if (validData.length > 0) {
      const latitudes = validData.map((d) => d.new_lat).sort((a, b) => a - b)
      const longitudes = validData.map((d) => d.new_lng).sort((a, b) => a - b)

      const medianLat =
        latitudes.length % 2 === 0
          ? (latitudes[latitudes.length / 2 - 1] +
              latitudes[latitudes.length / 2]) /
            2
          : latitudes[Math.floor(latitudes.length / 2)]

      const medianLng =
        longitudes.length % 2 === 0
          ? (longitudes[longitudes.length / 2 - 1] +
              longitudes[longitudes.length / 2]) /
            2
          : longitudes[Math.floor(longitudes.length / 2)]

      // Set the map view to the median position
      console.log('median', medianLat, medianLng)
      map.setView([medianLat, medianLng], 13) // You can adjust the zoom level as needed
    }
  }, [dataSrc, map.setView])

  useEffect(() => {
    // received geofeatures from parent
    console.log('geoFeatures in events', data)
    if (data === undefined) {
      return
    }

    // Remove all existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    // Define clustering radius (adjust as needed)
    const clusteringRadius = 0.01 // Example radius of 0.01 degrees

    // Group data into clusters based on proximity
    const clusters: { [key: string]: locationJSON[] } = {}
    // dataSrc.forEach((d) => {
    //   if (d.new_lat === null || d.new_lng === null) {
    //     return
    //   }

    //   const clusterKey = `${Math.floor(d.new_lat / clusteringRadius)}_${Math.floor(d.new_lng / clusteringRadius)}`
    //   if (!clusters[clusterKey]) {
    //     clusters[clusterKey] = []
    //   }
    //   clusters[clusterKey].push(d)
    // })

    for (const d of dataSrc) {
      if (d.new_lat === null || d.new_lng === null) {
        continue;
      }
    
      const clusterKey = `${Math.floor(d.new_lat / clusteringRadius)}_${Math.floor(d.new_lng / clusteringRadius)}`;
      if (!clusters[clusterKey]) {
        clusters[clusterKey] = [];
      }
      clusters[clusterKey].push(d);
    }
    

    // Create markers for each cluster
    for (const clusterKey in clusters) {
      const cluster = clusters[clusterKey]
      const clusterLatSum = cluster.reduce((sum, d) => sum + d.new_lat, 0)
      const clusterLngSum = cluster.reduce((sum, d) => sum + d.new_lng, 0)
      const clusterLat = clusterLatSum / cluster.length
      const clusterLng = clusterLngSum / cluster.length

      const marker = L.marker([clusterLat, clusterLng], { icon: defaultIcon })

      // Construct scrollable popup content
      const clusterPopupContent = `<div style="width: 200px; max-height: 200px; overflow-y: auto;"><img src='${cluster[0].img_link}' max-width='300px' height='500px' /></div>`
      marker.bindPopup(clusterPopupContent)

      marker.on('mouseover', (e) => {
        this.openPopup()
      })

      marker.on('click', (e) => {
        // Retrieve data associated with the clicked marker
        const clickedMarkerData = clusters[clusterKey]
        setData(clickedMarkerData)
        console.log('clickedMarkerData', clickedMarkerData)
        // console.log("prevClickItem", prevClickItem)
        // if (JSON.stringify(prevClickItem) === JSON.stringify(clickedMarkerData)) {
        //   console.log("clicked same marker");
        //   setData(dataSrc);
        //   setPrevClickItem(null);
        //   return;
        // }
        // else {
        //   console.log("clicked different marker");
        // }
        // setPrevClickItem(clickedMarkerData);
      })

      marker.addTo(map)
    }
  }, [data, dataSrc, map.eachLayer, map.removeLayer, setData, defaultIcon , map])  

  // useEffect(() => {
  //   if (prevClickItem === null) {
  //     return;
  //   }
  //   setData(prevClickItem)
  // }, [prevClickItem]);

  // process bounding box events
  map.on('pm:create', (e) => {
    const feature = e.layer.toGeoJSON()
    if (dataSrc === null) {
      return
    }

    const newData = []
    for (const [index, value] of dataSrc.entries()) {
      if (
        typeof value.new_lat !== 'number' ||
        typeof value.new_lng !== 'number'
      ) {
        console.log('not a number', value.new_lat, value.new_lng)
        continue
      }

      value.within = turf.booleanWithin(
        turf.point([value.new_lng, value.new_lat]),
        feature,
      )
      if (value.within) {
        console.log(value, 'within')
        newData.push(value)
      }
    }
    setData(newData)
  })

  map.on('click', (e) => {
    setData(dataSrc)
  })

  map.on('pm:remove', (e) => {
    setData(dataSrc)
  })

  return null
}

export default GeomanControl
