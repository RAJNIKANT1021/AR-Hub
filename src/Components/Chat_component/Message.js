import React from "react";
import "./Message.css";
import Avatar from '@mui/material/Avatar';
import {deepPurple } from '@mui/material/colors';
import uuid from "react-uuid";

const Message = ({ message ,sender}) => {
  console.log(message)
  return (
  

    <>
    {
      sender===true?    <div className="my-1 sender mostly-customized-scrollbar" style={{backgroundColor:''}}>
      <div className="d-flex flex-row">
      <div className="text1 d-flex flex-column" style={{backgroundColor:'#FDF5D3'}} >
       

      <div className="msgcontainer" style={{backgroundColor:'',color:'black'}} key={uuid()}>{message.inputValue}
     
      
      </div>
       <div className="msgtime" style={{backgroundColor:'',color:'black'}}>
       10:45 AM
      </div>
     
      </div>
      <div className="d-flex flex-column my-3 ml-2 mr-5" style={{backgroundColor:'',justifyContent:'center'}}>
      <Avatar sx={{ bgcolor: deepPurple[500], width: 46, height: 46 }}  src="https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=740&t=st=1678994453~exp=1678995053~hmac=d2710921626e1f50d2bc064ce0f480e7088c2eb7c1b9e1ad0c281abaf69fe49d"
                        alt="google"/>
      </div>
    </div>
    </div>:    <div className="my-1 reciever" style={{backgroundColor:''}}>
      <div className="d-flex flex-row">
      <div className="d-flex flex-column my-3 mr-2 ml-5" style={{backgroundColor:'',justifyContent:'center'}}>
      <Avatar sx={{ bgcolor: deepPurple[500], width: 46, height: 46 }}src="https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740&t=st=1679001679~exp=1679002279~hmac=c53ea30da094c90d0bae1bf703599d8572b711d931d2bbe519571eae87eb5a23" alt="hwt"/>
      </div>
      <div className="text1 d-flex flex-column" style={{backgroundColor:'#1F2029'}} >
       

      <div className="msgcontainer" style={{backgroundColor:''}} key={uuid()}>{message.inputValue}
     
      
      </div>
       <div className="msgtime" style={{backgroundColor:'transparent'}}>
       10:45 AM
      </div>
     
      </div>
     
    </div>
    </div>
    }
    </>

  );
};

export default Message;
