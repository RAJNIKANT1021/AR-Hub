import React ,{useState}from "react";
import './App.css'
import Navbar from "./Components/Navbar";
import Login from "./userauth/login";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
function App() { 
  return(<>
 
    
     
  <div >

      {/* <Navbar/> */}
      <Login/>
    {/* <div className="main d-flex flex-row">
      <div className="hey">
        </div> 
        <div className="hey">
        </div> 
        <div className="hey">
        </div> 
        <div className="hey">
        </div> 

    </div>
    <div className="main d-flex flex-row">
      <div className="hey">
        </div> 
        <div className="hey">
        </div> 
        <div className="hey">
        </div> 
        <div className="hey">
        </div> 

    </div>
    <div className="main d-flex flex-row">
      <div className="hey">
        </div> 
        <div className="hey">
        </div> 
        <div className="hey">
        </div> 
        <div className="hey">
        </div> 

    </div>
    <div className="main d-flex flex-row">
      <div className="hey">
        </div> 
        <div className="hey">
        </div> 
        <div className="hey">
        </div> 
        <div className="hey">
        </div> 

    </div> */}
  </div></>)
}
export default App;
