import * as React from 'react';
import './NewsCard.css';
import { LazyLoadImage } from "react-lazy-load-image-component";
function NewsCard() {
  return (
    <div className='px-3 my-2' style={{
    
    }}>

<div class="container">
     <div class="card" style={{backgroundColor:'#374045'}}>
       <div class="face face1">
         <div class="content">
            <LazyLoadImage
                src="https://source.unsplash.com/category/food/1600x900"
                class="d-block w-100"
                alt=""
              />
         </div>
       </div>
       <div class="face face2">
         <div class="content">
           <p> Lorem ipsum dolor sit amet consectetur adipisicing elit. Unde ab repudiandae, explicabo voluptate et hic cum ratione a. Officia delectus illum perferendis maiores quia molestias vitae fugiat aspernatur alias corporis?</p>
           <a href="#" type="button">Read More</a>
         </div>
       </div>
    </div>
    
    
    </div>
    
    
    
  
    
    
    
    
    
    
  </div>

  )
}

export default NewsCard;