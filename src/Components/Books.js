import React from 'react'
import axios from 'axios';
import { useEffect } from 'react';

function Books() {

  useEffect(()=>{
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': '44900e0b4cmshe404629f1d731f7p155df7jsnd4dd9c56de49',
        'X-RapidAPI-Host': 'books17.p.rapidapi.com'
      }
    };
    
    fetch('https://books17.p.rapidapi.com/authors/8418015', options)
      .then(response => response.json())
      .then(response => console.log(response))
      .catch(err => console.error(err));


  },[])

  
  return (
    <div>Books</div>
  )
}

export default Books