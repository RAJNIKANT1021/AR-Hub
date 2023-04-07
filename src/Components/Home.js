import React, { useState } from "react";
import './home.css'
import GoogleMapReact from 'google-map-react';
import { useEffect } from "react";


const AnyReactComponent = ({ text, lat, lng }) => {
  const [prevLat, setPrevLat] = useState(lat);
  const [prevLng, setPrevLng] = useState(lng);

  useEffect(() => {
    // Detect changes in lat and lng props
    if (prevLat !== lat || prevLng !== lng) {
      // Perform animation here
      // You can use CSS animations or JavaScript animations
      // Example using CSS animations
      const markerElement = document.getElementById("marker");
      markerElement.style.animation = "markerAnimation 1s"; // Set your animation properties here
      setTimeout(() => {
        markerElement.style.animation = ""; // Reset animation
      }, 1000); // Set the duration of your animation here
      // Update previous lat and lng
      setPrevLat(lat);
      setPrevLng(lng);
    }
  }, [lat, lng, prevLat, prevLng]);

  return (
    <div
      id="marker"
      style={{
        backgroundColor: "red",
        width: "max-content",
        zIndex: 100,
        position: "absolute",
        // left: `${lng}px`, // Set the left position based on the current lng prop
        // top: `${lat}px`, // Set the top position based on the current lat prop
      }}
    >
      {text}
    </div>
  );
};

export default function Home(){
    const [lat, setLat] = useState(48.8566);
  const [lng, setLng] = useState(2.3522);

  // Update lat and lng whenever they change
  const handleLatLongChange = (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
  };
  const defaultProps = {
    center: {
      lat: 22.2604,
      lng: 84.8536
    },
    zoom: 0,
  };
  const handleApiLoaded = (map, maps) => {
    // use map and maps objects
    
  };

  return (
    // Important! Always set the container height explicitly
    <div class="d-flex flex-row" style={{width:"100vw",height:'100%',alignItems:'center',justifyContent:'center'}}>

  
    <div id='map' style={{ height: '60vh', width: '90%' ,contain:'strict'}}>
   <GoogleMapReact 
  bootstrapURLKeys={{ key:"AIzaSyAGpbScvumaQMSPQC3LhtW39fJwBeUHUbA"}}
  // defaultCenter={defaultProps.center}
  defaultZoom={0}
  center={{ lat, lng }}
  
      options={{
         mapTypeId: "satellite",
      styles:[
        
  {
    featureType: "all",
    elementType: "labels",
    stylers: [
      { visibility: "off" }
    ]
  },
        { elementType: "geometry", stylers: [{ color: "#323231",visibility:'off' }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e",visibility:'off' }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855",visibility:'off' }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563",visibility:'off' }],
        },
        {
          featureType: "poi",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" ,visibility:'off' }],
        },
        {
          featureType: "poi.park",
          elementType: "geometry",
          stylers: [{ color: "#263c3f" ,visibility:'off' }],
        },
        {
          featureType: "poi.park",
          elementType: "labels.text.fill",
          stylers: [{ color: "#6b9a76",visibility:'off'  }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e",visibility:'off'  }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" ,visibility:'off' }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" ,visibility:'off' }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#746855" ,visibility:'off' }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry.stroke",
          stylers: [{ color: "#1f2835" ,visibility:'off' }],
        },
        {
          featureType: "road.highway",
          elementType: "labels.text.fill",
          stylers: [{ color: "#f3d19c" ,visibility:'off' }],
        },
        {
          featureType: "transit",
          elementType: "geometry",
          stylers: [{ color: "#2f3948",visibility:'off' }],
        },
        {
          featureType: "transit.station",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563",visibility:'off'  }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#000000",visibility:'off' }],
        },
        {
          featureType: "water",
          elementType: "labels.text.fill",
          stylers: [{ color: "#515c6d",visibility:'off' }],
        },
        {
          featureType: "water",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#353333" ,visibility:'off'}],
        },
      ]}}
    
  yesIWantToUseGoogleMapApiInternals
  // onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
>
  <AnyReactComponent
    lat={lat}
    lng={lng}
    text="My Marker"
  />
</GoogleMapReact>
    </div>
    </div>
  );
}
