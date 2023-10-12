import React from 'react'
import CancelIcon from '@mui/icons-material/Cancel';
import { Avatar, IconButton } from '@mui/material';
import { deepPurple } from '@mui/material/colors';

import { IoIosVideocam}  from 'react-icons/io';
import {IoMdCall} from 'react-icons/io';
import{ImBlocked}  from 'react-icons/im';
import{AiTwotoneDislike}  from 'react-icons/ai';
import{MdDelete}  from 'react-icons/md';
function Userinfo({setshowmyaccount,userfriendprof}) {
  return (<>
    <div className='d-flex flex-row py-2' style={{  backgroundColor: "#1F2029",
    borderBottom: "3px",
    borderBottomColor: "#292A33",
    borderBottomStyle: "solid",
    borderRight: "4px",
    borderRightColor: "#292A33",
    borderRightStyle: "solid",
    
    }}> 
    <div className='mx-1 mr-2 handy'style={{}}>
        <IconButton style={{color:'#ababae'}} onClick={()=>{setshowmyaccount(false)}}>
        <CancelIcon sx={{ fontSize:40}}/>
        </IconButton>
       
    </div>
    <duv className="d-flex" style={{flex:1,justifyContent:'center',alignItems:'center',color:'#dceef8',fontSize:'1.6rem'}}>
    
        Member Info
    
    </duv>
    
    
    </div>
    <div className='d-flex flex-column'>

    <div className='d-flex mt-3 pb-2' style={{alignItems:'center',justifyContent:'center',
 
}}>
    <Avatar
              sx={{ bgcolor: deepPurple[500], width: 200, height: 200}}
              src={userfriendprof.url}
              alt="hwt"
            />


    </div>
    <div  className="d-flex flex-row" style={{color:'#fffffa',justifyContent:'center',alignItems:'center',fontSize:'2rem'}}>
       {userfriendprof.name}
    </div>
    <div className="d-flex flex-row pb-3"style={{color:'#fffffa',justifyContent:'center',alignItems:'center',   borderBottom: "4px",
    borderBottomColor: "#292A33",
    borderBottomStyle: "solid",}} >
        <div >
        <div className='d-flex flex-column mr-4' style={{color:'#fffffa',justifyContent:'center',alignItems:'center'}}>

<div>
<IconButton  
                      
                      sx={{ color:'#009588' }}
                     >
    <IoMdCall style={{fontSize:'40px'}} />
    </IconButton>
  
</div>
<div style={{color:'#009588'}}>
    Audio
</div>
</div>
        </div>
        <div className='d-flex flex-column ml-2' style={{color:'#fffffa',justifyContent:'center',alignItems:'center'}}>

<div>
<IconButton   
                      sx={{ color:'#009588' }}>
    <IoIosVideocam style={{fontSize:'42px'}}/>
    </IconButton>
</div>
<div style={{color:'#009588'}}>
    
   Video
</div>
</div>
     
</div>


</div>
<div class="px-3 mt-1"style={{color:'#7c7c76'}}>
    About
 </div>
 <div className='px-3 mt-1 pb-3'style={{color:'whitesmoke',fontSize:'1.1rem', borderBottom: "4px",
    borderBottomColor: "#292A33",
    borderBottomStyle: "solid",}} >
{userfriendprof.bio}
 </div>

 <div className="d-flex flex-row mt-1 handy" style={{color:'#b74b59'}}>
    <div className="mx-2"style={{fontSize:"24px"}}>
    <ImBlocked/>
    </div>
    <div classname="pr-4">
    Block {" "}{userfriendprof.name}
    </div>

 </div>
 <div className="d-flex flex-row handy">
    <div className="mx-2" style={{fontSize:"24px",color:'#b74b59'}}>
        <AiTwotoneDislike/>

    </div>
    <div classname="pr-4" style={{color:'#b74b59'}}>
    Report{" "} {userfriendprof.name}
    </div>

 </div>
 <div className="d-flex flex-row handy">
    <div className="mx-2" style={{fontSize:"24px",color:'#b74b59'}}>
<MdDelete/>
    </div>
    <div classname="pr-4"style={{color:'#b74b59'}}>
    Delete Chat
    </div>

 </div>
</>
  )
}

export default Userinfo