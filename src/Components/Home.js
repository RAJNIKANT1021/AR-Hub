import React from "react";
import GoogleMapReact from 'google-map-react';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

export default function Home(){
  const defaultProps = {
    center: {
      lat: 10.99835602,
      lng: 77.01502627
    },
    zoom: 2
  };
  const handleApiLoaded = (map, maps) => {
    // use map and maps objects
    
  };

  return (
    // Important! Always set the container height explicitly
    <div style={{ height: '100vh', width: '100%' }}>
   <GoogleMapReact
  bootstrapURLKeys={{ key:"AIzaSyAGpbScvumaQMSPQC3LhtW39fJwBeUHUbA"}}
  defaultCenter={defaultProps.center}
  defaultZoom={defaultProps.zoom}
  yesIWantToUseGoogleMapApiInternals
  onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
>
  <AnyReactComponent
    lat={59.955413}
    lng={30.337844}
    text="My Marker"
  />
</GoogleMapReact>
    </div>
  );
}
