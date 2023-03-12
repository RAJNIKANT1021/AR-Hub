import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import "./Feed.css";
import NewsCard from "./Feed_component/NewsCard";
import { LazyLoadImage } from "react-lazy-load-image-component";

function Feed() { 
  return (
    <>
      <div className="d-flex flex-column">
        <div className="justify-content-center crousel">
          <Carousel
            className="crousel_insider"
            showStatus={false}
            showThumbs={false}
            autoPlay={true}
            infiniteLoop={true}
            interval={5000}
            stopOnHover={false}
          >
            <div>
              <LazyLoadImage
                class="d-block w-100"
                src="https://source.unsplash.com/category/cricket/1600x900"
                alt=""
              />
            </div>
            <div>
              <LazyLoadImage
                src="https://source.unsplash.com/category/food/1600x900"
                class="d-block w-100"
                alt=""
              />
            </div>
            <div>
              <LazyLoadImage
                src="https://source.unsplash.com/category/india/1600x900"
                class="d-block w-100"
                alt=""
              />
            </div>
            <div>
              <LazyLoadImage
                src="https://source.unsplash.com/category/dubai/1600x900"
                class="d-block w-100"
                alt=""
              />
            </div>{" "}
            <div>
              <LazyLoadImage
                src="https://source.unsplash.com/category/school/1600x900"
                class="d-block w-100 h-"
                alt=""
              />
            </div>{" "}
            <div>
              <LazyLoadImage
                src="https://source.unsplash.com/category/love/1600x900"
                class="d-block w-100 h-"
                alt=""
              />
            </div>{" "}
            <div>
              <LazyLoadImage
                src="https://source.unsplash.com/category/children/1600x900"
                class="d-block w-100 h-"
                alt=""
              />
            </div>{" "}
            <div>
              <LazyLoadImage
                src="https://source.unsplash.com/category/mother/1600x900"
                class="d-block w-100 h-"
                alt=""
              />
            </div>
          </Carousel>
        </div>
      </div>
      
        

      
      <div className="header" style={{
         marginTop:'100px',
       
      }}>
      
        
      <p className="px-4 heading" style ={{font: 'Work Sans',fontSize:'40px', color:'beige',margin:'2px'}}>Sports
          </p>
        <div className="row__posters" >
          
          {/* several row posters */}
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>{" "}
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
        </div>
      </div>
    
      <div className="header"   style={{
        marginTop:'100px'
      }}>
          <p className="px-4 heading" style ={{font: 'Work Sans',fontSize:'40px', color:'beige',margin:'2px'}}>Health
          </p>
        <div className="row__posters">
          {/* several row posters */}
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>{" "}
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
        </div>
      </div>
      <div className="header" style={{
        marginTop:'100px'
      }}>
          <p className="px-4 heading" style ={{font: 'Work Sans',fontSize:'40px', color:'beige',margin:'2px'}}>Business
          </p>
        <div className="row__posters">
          {/* several row posters */}
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>{" "}
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
        </div>
      </div>
      <div style={{
        marginTop:'100px'
      }}>
        <div className="row__posters">
          {/* several row posters */}
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>{" "}
          <div className="row__poster row__posterLarge">
            <NewsCard />
          </div>
        </div>
      </div>
    </>
  );
}
export default Feed;
