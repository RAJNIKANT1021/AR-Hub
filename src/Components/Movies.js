import React from "react";
import "./Movies.css";
import { useState } from "react";
import Box from "@mui/material/Box";
import Rating from "@mui/material/Rating";

function Movies() {
  const [value, setValue] = React.useState(2);
  const [searchinput, setsearchinput] = useState("");
  return (
    <>
      <form className="searchbar4" action="">
        <input
          className="searchbar2"
          id="val"
          value={searchinput}
          type="search"
          onChange={(e) => {
            setsearchinput(e.value);
          }}
          required
        />
        <i class="fa fa-search"></i>
        <a
          className="searchbar3"
          id="clear-btn"
          onClick={() => {
            setsearchinput("");
          }}
          style={{ color: "white" }}
       href="okk" >
          Clear
        </a>
      </form>
      <div className="d-flex flex-column">
        <div className="d-flex py-4 flex-row justify-content-around">
          <div className="moviephoto">
            <img className="imagemov imagemov-contain" src="https://www.cnet.com/a/img/resize/cedc65214df4403e322281306f00b0684d84ad61/hub/2019/03/14/dd4d8d9c-5f16-4f6b-a7d8-65a00d095c2c/avengers-endgame-poster-square-crop.jpg?auto=webp&fit=crop&height=675&width=1200" alt="hey"/>
            <Box
            style={{marginLeft:'160px',marginTop:'-20px'}}
              sx={{ 
                "& > legend": { mt: 2},
              }}
            >
              <Rating
                name="simple-controlled "
                
                value={value}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
                
              />
            </Box>
          </div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
        </div>
        <div className="d-flex py-4 flex-row justify-content-around">
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
        </div>
        <div className="d-flex py-4 flex-row justify-content-around">
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
        </div>
        <div className="d-flex py-4 flex-row justify-content-around">
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
          <div className="moviephoto"></div>
        </div>
      </div>
    </>
  );
}

export default Movies;
