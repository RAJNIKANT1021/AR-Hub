import React from 'react'
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from 'react-responsive-carousel';
import './Feed.css'
function Feed() {
  return (

    <div className='d-flex justify-content-center'>
        <Carousel className='crousel_insider'
          showStatus={false}
          showThumbs={false}
          autoPlay={true}
         
          infiniteLoop={true}
          interval={5000}
          stopOnHover={false}
         
        >
          
                <div>
                <img class="d-block w-10" src="https://source.unsplash.com/category/cricket/1600x900" alt=''/>
                   
                </div>
                <div>
                <img src="https://source.unsplash.com/category/food/1600x900" class="d-block w-100" alt=""/>
                    
                </div>
                <div>
                <img src="https://source.unsplash.com/category/india/1600x900" class="d-block w-100" alt=""/>
                   
                </div>
                <div>
                <img src="https://source.unsplash.com/category/dubai/1600x900" class="d-block w-100" alt=""/>
                    
                </div>  <div>
                <img src="https://source.unsplash.com/category/school/1600x900" class="d-block w-100 h-" alt=""/>
                    
                </div>  <div>
                <img src="https://source.unsplash.com/category/love/1600x900" class="d-block w-100 h-" alt=""/>
                    
                </div>  <div>
                <img src="https://source.unsplash.com/category/children/1600x900" class="d-block w-100 h-" alt=""/>
                    
                </div>  <div>
                <img src="https://source.unsplash.com/category/mother/1600x900" class="d-block w-100 h-" alt=""/>
                    
                </div>
              
            </Carousel>

    </div>
  
   
  )
}

export default Feed