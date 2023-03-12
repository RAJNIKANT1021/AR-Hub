import React from 'react'
import './notlog.css'
import {  useNavigate } from 'react-router-dom'

function ToShow() {
    const Navigate=useNavigate();
    return (
      <div className="d-flex flex-row  notloggedin" style={{
       height:'40rem',
       justifyContent:'center',
       alignItems:'center',
      }}>
        <div className="logcontent"style={{height:'32rem',width:'40rem'}}>
          <div className='d-flex flex-column'>
          <div className='d-flex flex-row headeer'style={{ justifyContent:'center',alignItems:'center'}}>
            <div  style={{paddingLeft:'5rem',color:'green',fontSize:'40px'}}>
              Hii
              </div>
              <div className='pl-2' style={{color:'green',fontSize:'37px'}}>
              <div className='hand'>
              👋
                </div>
                </div>
  
              <div className='px-3' style={{flex:1,color:'white',fontSize:'40px'}}>
   
              Welcome to A2R HUB
              </div>
             
          </div>
          <div className='headeer pb-4 pt-3' style={{height:'23rem' }}>
  description
          </div>
          <div className='d-flex flex-column pt-2 mb-4'style={{justifyContent:'center',alignItems:'center'}}>
            <div>
            <button className='btn btn-primary' style={{width:'31rem'}} onClick={()=>{Navigate('/')}}>please login to continue  ------></button>   
  
            </div>
            
  
          </div>
  
          </div>
          
  
  
        </div>
  
  
      </div>
    )
  }

export default ToShow