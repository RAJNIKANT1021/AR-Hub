import React from "react";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import "./Feed.css";
import NewsCard from "./Feed_component/NewsCard";

function Feed() {
  return (
    <>
      <div className="d-flex flex-column">
        <div className="p-2 justify-content-center crousel">
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
              <img
                class="d-block w-100"
                src="https://source.unsplash.com/category/cricket/1600x900"
                alt=""
              />
            </div>
            <div>
              <img
                src="https://source.unsplash.com/category/food/1600x900"
                class="d-block w-100"
                alt=""
              />
            </div>
            <div>
              <img
                src="https://source.unsplash.com/category/india/1600x900"
                class="d-block w-100"
                alt=""
              />
            </div>
            <div>
              <img
                src="https://source.unsplash.com/category/dubai/1600x900"
                class="d-block w-100"
                alt=""
              />
            </div>{" "}
            <div>
              <img
                src="https://source.unsplash.com/category/school/1600x900"
                class="d-block w-100 h-"
                alt=""
              />
            </div>{" "}
            <div>
              <img
                src="https://source.unsplash.com/category/love/1600x900"
                class="d-block w-100 h-"
                alt=""
              />
            </div>{" "}
            <div>
              <img
                src="https://source.unsplash.com/category/children/1600x900"
                class="d-block w-100 h-"
                alt=""
              />
            </div>{" "}
            <div>
              <img
                src="https://source.unsplash.com/category/mother/1600x900"
                class="d-block w-100 h-"
                alt=""
              />
            </div>
          </Carousel>
        </div>
      </div>
      <div className="p-2">
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
      <div className="p-2">
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
      <div className="p-2">
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
      <div className="p-2">
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
