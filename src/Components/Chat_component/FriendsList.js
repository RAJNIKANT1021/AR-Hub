import { Avatar, IconButton } from '@mui/material'
import React from 'react'
import CancelIcon from '@mui/icons-material/Cancel'
import { deepPurple } from '@mui/material/colors'
function FriendsList({setshowfriends}) {
  return (
    <>
    <div className='d-flex flex-column' style={{width:'50vh'}}>
      <div className='d-flex flex-row'>
         <div className='d-flex ml-2 pl-2' style={{flex:1 ,color:'white',fontSize:'25px',alignItems:'center'}}>
               Friends 
         </div>
         <div className='d-flex'>
          
          <IconButton style={{ color: '#ababae' }} onClick={()=>{setshowfriends(false)}}>
                            <CancelIcon sx={{ fontSize: 40 }} />
                        </IconButton>

          
        

         </div>

      </div>
      <div className='d-flex flex-row justify-content-between px-3 mt-2' style={{fontSize:'1.2rem'}}>
        <div className='d-flex flex-row pb-2' style={{color:'grey'}}>
            <div>
Friends:
            </div>
            <div className='mx-2'>
32
            </div>

        </div>
        <div className='d-flex flex-row'>
        <div style={{color:'#008069'}}>
       Online:
        </div>
        <div style={{color:'#008069'}}>
11
        </div>

        </div>
       

      </div>

      



    </div>
    <div className='d-flex flex-column mt-3' style={{flex:1,backgroundColor:''}}>
    <div className='d-flex flex-row' style={{





height: '4.4rem',
borderBottomColor: '#292A33',
borderWidth: '3px',
borderBottomStyle: 'solid',


}}>

<div className='flex pt-1 px-2 ' style={{
    // alignItems:'center',


    // justifyContent:'center',
    //   backgroundColor:'#212121',

}}>
    <Avatar sx={{ bgcolor: deepPurple[500], width: 56, height: 56 }} src="https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740&t=st=1679001679~exp=1679002279~hmac=c53ea30da094c90d0bae1bf703599d8572b711d931d2bbe519571eae87eb5a23" alt="hwt" />
</div>
<div className='d-flex flex-column' style={{
    // backgroundColor:'#212121',
    paddingTop: '9px',
    color: '#ffffff',

    flex: 1,


}}>
    <div className="d-flex flex-row pl-2" style={{


    }}>
        <div className='d-flex flex-column' style={{ flex: 1 }}>
            <div className='d-flex flex-column' >
                <div style={{
                    flex: 1,
                    fontWeight: 600,


                    color: '#ffffff'
                }}>
                    Rajnikant
                </div>
                <div style={{
                    flex: 1,
                    fontWeight: 100,


                    color: 'grey'
                }}>
                    work on it
                </div>



            </div>



        </div>
        <div className=''style={{}} >
         <div className='d-flex flex-row mr-4' style={{backgroundColor:'' ,borderRadius:'16px'}}>
        <div className='d-flex flex-row px-1 mx-1'>
          
              
                <div className='' style={{color:'#008069',fontSize:'1.1rem',zIndex:'100',opacity:'1'}}>  
                     Online
                </div>
              
              

                </div>
              
            </div>
            </div>
</div>
</div></div>
</div>
          
              
               
    

      </>
  )
}

export default FriendsList