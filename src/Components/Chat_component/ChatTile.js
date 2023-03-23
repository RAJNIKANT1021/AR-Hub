import React from 'react'
import Avatar from '@mui/material/Avatar';
import {  deepPurple } from '@mui/material/colors';
import './chattile.css'
import {  Chip } from '@mui/material';


function ChatTile({name}) {
   
  
   
    
   
    
    

    
;
    
    
  return (

  
    <div className="tilehover mt-md-3 handy">
        
        
              
{ (<div className='px-4'style={{ 
                         
        
                   
                        height:'4.4rem',
                   }}>
<div className='d-flex flex-row' style={{
  
  
                        
        
                   
  height:'4.4rem',
borderBottomColor:'#292A33',
borderWidth:'3px',
borderBottomStyle:'solid',

                  
                }}>
                     
                    <div className='flex pt-1 px-1 ' style={{
                        // alignItems:'center',
                        
        
                        // justifyContent:'center',
                        //   backgroundColor:'#212121',
                        
                    }}>
                    <Avatar sx={{ bgcolor: deepPurple[500], width: 56, height: 56  }} src="https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740&t=st=1679001679~exp=1679002279~hmac=c53ea30da094c90d0bae1bf703599d8572b711d931d2bbe519571eae87eb5a23" alt="hwt"/>
                    </div>
                    <div className='d-flex flex-column' style={{
                        // backgroundColor:'#212121',
                        paddingTop:'9px',
                        color:'#ffffff',
                    
                    flex:1,
        
            
                    }}>
                   <div  className="d-flex flex-row pl-3"style={{
                       
                        
                    }}>
                        <div style={{
                            flex:1,
                            fontWeight:600,
        
                            
                            color:'#ffffff'
                        }}>
                           {name}   
        
                        </div>
                        <div style={{
                            
                             color:'#65656C',
                             paddingRight:'9px',
                             fontSize:'14px'
                            
                        }}>
                            12:12
        
                        </div>
        
                   </div>
                   <div className="d-flex flex-row pl-3"style={{
                        //  backgroundColor:'#212121',
                       
                         
                        
                    
                    }}>
                        <div style={{  color:'#65666C',   
                         fontSize:'14px',flex:1}}>
                        working on it
                            </div>
                            <div className='px-3'> 
                            <Chip label="4" color="success" size="small" />
                                </div>
                        
                        
                        {/* <div className=''>
    
                        </div> */}
                        {/* <div style={{
                            paddingLeft:'3px',
                            color:'#aaaaaa',
                            overflow:'hidden',
                        }}>
       
                        </div> */}
                        
        
        </div>
        
                    </div>
                   
                </div>
            
                </div>
            )}
               
        
               
    </div>

            
  )
}

export default ChatTile