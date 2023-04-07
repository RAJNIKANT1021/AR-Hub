import { Avatar, IconButton } from '@mui/material'
import React,{useState} from 'react'
import CancelIcon from '@mui/icons-material/Cancel'
import { deepPurple } from '@mui/material/colors'
import{AiOutlineCheck} from "react-icons/ai";

function Myavatar({setshowavatar}) {
    const[edit,setedit]=useState(false)
    const [editavater, seteditavater] = useState('');
    const handlechange=()=>{





    }
  return (
    <>
    <div className='d-flex flex-column' style={{width:'100%',contain:'strict'}}>
      <div className='d-flex flex-row pl-2'>
         <div className='d-flex ml-2' style={{flex:1 ,color:'white',fontSize:'25px',alignItems:'center'}}>
               Set Avatar 
         </div>
         <div className='d-flex'>
          <div className='d-flex'>
          <IconButton style={{ color: '#ababae' }} onClick={()=>{setshowavatar(false)}}>
                            <CancelIcon sx={{ fontSize: 40 }} />
                        </IconButton>

          </div>
        

         </div>

      </div>

      <div>

      </div>



    </div>
    <div className='d-flex flex-column' style={{flex:1,backgroundColor:''}}>
      <div
        className="d-flex flex-column mt"
        style={{ flex: 1, backgroundColor: "" }}
      >
        <div
          className="d-flex flex-row pt-3 mt-1"
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Avatar
            sx={{ bgcolor: deepPurple[500], width: 240, height: 240 }}
            src="https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740&t=st=1679001679~exp=1679002279~hmac=c53ea30da094c90d0bae1bf703599d8572b711d931d2bbe519571eae87eb5a23"
            alt="hwt"
          />
           </div>
           <div
          className="d-flex flex-column mx-3 pt-1 mt-4"
          style={{
            borderRadius: "",
            backgroundColor: "",
            borderBottom: "3px",
            borderBottomColor: "#292A33",
            borderBottomStyle: "solid",
          }}
        >
          <div
            className="d-flex flex-row pl-2 "
            style={{ color: "#007f68", fontSize: ".8rem"}}
          >
            Avatar Custom Url
          </div>
          <div className="d-flex flex-row mt-1 mb-2 pb-1" style={{ flex: 1 }}>
            <input
            id="editurl"
            placeholder='Custom Avatar Url'
              type="text"
              className="pl-2"
              onChange={()=>{setedit(true);handlechange()}}
              onBlur={()=>{setedit(false);}}
              defaultValue={editavater}
              style={{
                outline: "none",
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
              }}
            />
            {
                <div>{
                    edit===true &&
                    <IconButton onClick={()=>{setedit(false)}}>
                    <AiOutlineCheck style={{ color: "#8696a0", fontSize: "1.4rem" }} />
                  </IconButton>
                     }
                     
           
                    </div>
            }
           
          </div>
        </div>
        <div className='d-flex flex-column pt-3 pr-3' style={{alignItems:'center',justifyContent:'center'}}>
            <p style={{color:'grey',fontSize:'1rem'}}> Add your custom Avatar URL. 
            Visit <a style={{color:'green'}}href='https://www.freepik.com/vectors/avatar' target='_blank' rel='norefferer'>Flaticon</a> <br></br>
             open Avatar in new Page, copy Url and <br></br>paste in Avatar Custom Url.
                
                </p >
            
            
        </div>
        </div>
       

      </div>
      </>
  )
}

export default Myavatar