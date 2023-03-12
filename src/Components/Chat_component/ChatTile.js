import React from 'react'
import Avatar from '@mui/material/Avatar';
import { deepOrange, deepPurple } from '@mui/material/colors';
import './chattile.css'

function ChatTile() {
  return (
    <div className='tilehover' >
        <div className='d-flex flex-row ' style={{
            height:'4.4rem',
          
        }}>
            <div className='flex pt-1 px-1 ' style={{
                //   backgroundColor:'#212121',
                alignItems:'center',

                justifyContent:'center',
            }}>
            <Avatar sx={{ bgcolor: deepPurple[500], width: 56, height: 56  }}>AS</Avatar>
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
                    Ajitesh Srivastava

                </div>
                <div style={{
                    
                     color:'#686c72',
                     paddingRight:'9px'
                    
                }}>
                    sat

                </div>

           </div>
           <div className="d-flex flex-row pl-3"style={{
                //  backgroundColor:'#212121',
                 color:'#ffffff',   
                
            
            }}>
                <div className=''>
Pandey
                </div>
                <div style={{
                    paddingLeft:'3px',
                    color:'#aaaaaa'
                }}>
:Tanmoy randi hai bhai shi mein aaj fir sh...
                </div>
                

</div>

            </div>

        </div>
    </div>
  )
}

export default ChatTile