import { Avatar, IconButton } from '@mui/material'
import { deepPurple } from '@mui/material/colors'
import React from 'react'
import CancelIcon from '@mui/icons-material/Cancel'
import { BsPersonCheckFill } from 'react-icons/bs'
import {MdDelete} from 'react-icons/md'
function FriendRequest({setshowfriendrequest}) {
    return (
    <>
            <div>

            </div>
            <div className='d-flex flex-column ' style={{ flex: 1, backgroundColor: '',width:'50vh' }}>
                <div className='d-flex flex-row'>
                    <div className='ml-4 pt-2' style={{ fontSize: '1.6rem', color: 'whitesmoke', alignItems: 'center', justifyContent: 'center' ,flex:1}}>

                        Friend Requests
                    </div>
                    <div className='ml-2 handy' style={{}}>
        
                        <IconButton style={{ color: '#ababae' }} onClick={()=>{setshowfriendrequest(false)}}>
                            <CancelIcon sx={{ fontSize: 40 }} />
                        </IconButton>

                    </div>
                    <div>
                    </div>
                </div>
                <div className='d-flex flex-column mt-3'>

                    <div className="tilehover mt-md-3 handy">



                        {(<div className='d-flex flex-row px-2' style={{



                            height: '4.4rem',
                        }}>
                            <div className='d-flex flex-row' style={{





                                height: '4.4rem',
                                borderBottomColor: '#292A33',
                                borderWidth: '3px',
                                borderBottomStyle: 'solid',


                            }}>

                                <div className='flex pt-1 px-2' style={{
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
                                        <div className='ml-4 pl-2'style={{}} >
                                         <div className='d-flex flex-row py-1' style={{backgroundColor:'#0A1B3E' ,borderRadius:'14px'}}>
                                        <div className='d-flex flex-row'>
                                            <div className='mx-2'>
                                                    <BsPersonCheckFill style={{ color: 'green' ,fontSize:'1.8rem',backgroundColor:''}} />



                                                </div>
                                              
                                                <div className='pr-3' style={{backgroundColor:'',fontSize:'1.1rem'}}>  
                                                     Accept
                                                </div>
                                              
                                              

                                                </div>
                                              
                                            </div>
                                            </div>
                                            <div className='d-flex flex-row'>
                                            <div className=''>
                                                
                        <IconButton>
                        <MdDelete style={{ color: 'red' ,fontSize:'1.4rem',backgroundColor:''}} />
                        </IconButton>
                                                 



                                                </div>
                                              
                                               
                                                </div>
                                         

                                        </div>
                                        <div className="d-flex flex-row pl-3" style={{
                                            //  backgroundColor:'#212121',




                                        }}>




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

    
    
    
    
    
    
    
    </div>







                </div>
            </>

            )
}

            export default FriendRequest