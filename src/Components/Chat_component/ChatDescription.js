import React, { useState, useEffect, useRef } from "react";

import uuid from "react-uuid";
import "../chat.css";
import "./chatdesc.css"
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Avatar from "@mui/material/Avatar";
import { BsEmojiSmile } from "react-icons/bs";
import { deepPurple } from "@mui/material/colors";
import Message from "./Message";
import Diversity1Icon from "@mui/icons-material/Diversity1";
import PersonIcon from "@mui/icons-material/Person";
import HttpsOutlinedIcon from "@mui/icons-material/HttpsOutlined";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CallIcon from '@mui/icons-material/Call';
import { IoIosVideocam}  from 'react-icons/io';
import { BsSearch}  from 'react-icons/bs';
import useSound from 'use-sound';
import sentmsgsound from './Sounds/sentmsg.mp3'
import recmsgsound from './Sounds/msgrec.mp3'


import {
  arrayUnion,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../userauth/FireAuth";
import {
  Box,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import FaceIcon from "@mui/icons-material/Face";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import EmojiPicker from "emoji-picker-react";
import { useParams } from "react-router-dom";

function ChatDescription({ descname, bio, messageid, uid, setshowmyaccount,chatid,avtrurl}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const[status,setstatus]=useState('');

  
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {

    const unsub = onSnapshot(
      doc(db, "A2B_USERS", "Users", "usersdetails", "details"),
      (doc) => {
        
        const detail = doc.data();
      

        for (const key in detail) {
          if (detail.hasOwnProperty(key)) {
            
              const us = detail[key];
              if(chatid!==null && chatid===key){
            
                setstatus(us.status);
              }
              
        
              
            
              
            
            
          }
        }
     
      }
    );

    return () => {
      unsub();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
 

  const [playsent] = useSound(sentmsgsound);
  const [palyrec] = useSound(recmsgsound);
  const [showemoji, setshowemoji] = useState(false);
  const[recievesmsg,setrecievesmsg]=useState(0);


  

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "userchats", messageid), (doc) => {
      if(doc.exists()) {

        
        let msg=doc.data().messages;
        for(let i=0;i<msg.length;i++)
{
  let str=msg[i].inputValue;
  let varray=[];

  for(let i=0;i<str.length;i++){
    varray.push(str.charCodeAt(i)+121312);
    
  }

  msg[i].inputValue= String.fromCharCode(...varray);


}      
        
        setMessages(msg);
        let array=doc.data().messages;
        let count=0;
        for(let i=0;i<array.length;i++){
          if(  array[i].senderId !== uid ){

            count++;

          }
          
        }
        if(count-recievesmsg===1){
          palyrec();


        } 
        setrecievesmsg(count);
      
      
      }
    });

    return () => {
      unSub();
    };
  }, [messageid,recievesmsg,uid,palyrec,status]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (event) => {
    setInputValue(event);
  };
  const handleSubmit = async (event,check) => {
    if(check==='no'){
    event.preventDefault();}
if(inputValue.length){
   
    playsent();



    let text = inputValue;
    let array=[];

    for(let i=0;i<text.length;i++){
      array.push(text.charCodeAt(i)-121312)
      
    }
    
 let vary= String.fromCharCode(...array)
 

  



    setInputValue("");
    document.getElementById('focus').focus();
    if(vary.length){

    await updateDoc(doc(db, "userchats", messageid), {
      messages: arrayUnion({
        id: uuid(),
        inputValue: vary,
        senderId: uid,
        date: Timestamp.now(),
      }),
    });}
  }};

  const handlefocus=()=>{
    document.getElementById('focus').focus();

  }
  return (
    <>
      <div
        class="d-flex flex-row"
        style={{
          backgroundColor: "#1F2029",
          height: "",
          zIndex: "2000",
          overflowX: "",

          borderTop: "3px",
          borderTopColor: "#292A33",
          borderTopStyle: "solid",

          borderRight: "3px",
          borderRightColor: "#292A33",
          borderRightStyle: "solid",
        }}
      >
        <div
          className="d-flex flex-row pt-1 mt-1"
          style={{width:'100%',
          contain:'',
            // borderBottom: "2px",
            // borderBottomColor: "#292A33",
            // borderBottomStyle: "solid",
            
          }}
        >
        
          <div className="d-flex mx-2  ml-4 pl-2 pb-1" style={{contain:''}}>
            <Avatar
              sx={{ bgcolor: deepPurple[500], width: 50, height: 50 }}
              src={avtrurl}
              alt="hwt"
            />
          </div>
          <div
            className="d-flex flex-column "
            style={{  backgroundColor: "#1F2029", overflowX: "hidden" }}
          >
            <div
              className="ml-3"
              style={{
                backgroundColor: "#1F2029",
                fontSize: "13px",

                color: "white",
              }}
            >
              <blockquote class="blockquote" style={{marign:"0 0 0rem"}}>
   {descname}
   {
              status==="offline"&&   <div
              className="pl-1"
              style={{
                color: "grey",
                fontSize: "13px",
                top: 0,
                backgroundColor: "",
              }}
            >
              offline{" "}
            </div>
            }{
              status==="online"&&   <div
              className="pl-1"
              style={{
                color: "#2e7d32",
                fontSize: "13px",
                top: 0,
                backgroundColor: "",
              }}
            >
              online{" "}
            </div>

            }
</blockquote>
            
            </div>
           
          
          </div>
          
        </div>
        <div className="d-flex flex-row" style={{flex:1}}>
          </div>
        <div className="d-flex flex-row " style={{justifyContent:'flex-end',alignItems:'center'}}>

        <div
            className="d-flex "
            style={{ color: "#a8a8a8", fontSize: "20px" ,marginRight:'3vw' }}
          >
          <BsSearch/>
          </div>
          
        <div
            className="d-flex"
            style={{ color: "#a8a8a8", fontSize: "33px",marginRight:'3vw' }}
          >
          <CallIcon fontSize="medium"/>
          </div>
          <div
            className="d-flex "
            style={{ color: "#a8a8a8", fontSize: "35px" ,marginRight:'3vw'}}
          >
          <IoIosVideocam/>
          </div>
        <div
            className="d-flex"
            style={{ color: "#a8a8a8", fontSize: "30px", marginRight:'1vw' }}
          >
             <Box>
                  <Tooltip title="Account settings">
                    <IconButton
                      onClick={handleClick}
                      size="small"
                      sx={{ color:'#a8a8a8' }}
                      aria-controls={open ? "account-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? "true" : undefined}
                    >
                    <MoreVertIcon fontSize="large"/>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    id="account-menu"
                    open={open}
                    onClose={handleClose}
                    onClick={handleClose}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        backgroundColor: "black",
                        color: "white",
                        overflow: "visible",
                        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                        mt: 1.5,
                        "& .MuiAvatar-root": {
                          width: 32,
                          height: 32,
                          ml: -0.5,
                          mr: 1,
                        },
                        "&:before": {
                          backgroundColor: "black",
                          content: '""',
                          display: "block",
                          position: "absolute",
                          top: 0,
                          right: 16,
                          width: 10,
                          height: 10,

                          transform: "translateY(-50%) rotate(45deg)",
                          zIndex: 0,
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: "right", vertical: "top" }}
                    anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  >
                    <MenuItem onClick={() => { handleClose(); setshowmyaccount(true) }}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <PersonIcon fontSize="small" color="whitesmoke" />
                      </ListItemIcon>

                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <HttpsOutlinedIcon fontSize="small" color="whitesmoke" />
                      </ListItemIcon>

                      Privacy
                    </MenuItem>

                    <MenuItem onClick={handleClose}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <FaceIcon fontSize="small" color="whitesmoke" />
                      </ListItemIcon>
                      Avatar
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <NotificationsIcon fontSize="small" color="whitesmoke" />
                      </ListItemIcon>
                      Notification
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <Diversity1Icon fontSize="small" color="whitesmoke" />
                      </ListItemIcon>
                      Invite a friend
                    </MenuItem>
                  </Menu>
                </Box>
          </div>

        </div>
      </div>

      <div class="d-flex flex-column justify-content-between mostly-customized-scrollbar" style={{flex:1,width:'100%'}}>
        <div
          className="d-flex flex-column chatdata mostly-customized-scrollbar"
          style={{
            flex:1,
            backgroundColor: "#17181F",

            overflowX: "hidden",

            borderTop: "3px",
            borderTopColor: "#292A33",
            borderTopStyle: "solid",
            borderBottom: "3px",
            borderBottomColor: "#292A33",
            borderBottomStyle: "solid",

            borderRight: "3px",
            borderRightColor: "#292A33",
            borderRightStyle: "solid",
          }}
        >
          
          <div className="chat-box mostly-customized-scrollbar">
            
          
              {messages.map((m) =>
                m.senderId === uid ? (
                  <Message
                    key={m.id}
                    descname={descname}
                    message={m}
                    sender={true}
                  />
                ) : (
                  <Message
                    key={m.id}
                    descname={descname}
                    message={m}
                    sender={false}
                  />
                )
              )}
        
            <div ref={messagesEndRef} />

            {/* <img src="https://4kwallpapers.com/images/walls/thumbs_3t/10307.jpg"/> */}
          </div>
          {
            showemoji===true &&
            <div className="animateemoji mx-1" style={{position:'absolute', bottom:'0',marginBottom:'.2rem',backgroundColor:'',height:'',width:'',contain:''}}>

            <EmojiPicker  theme={'auto'} width={'40vmax'}  onEmojiClick={(e)=>{setInputValue(`${inputValue}${e.emoji}`)}}/>
          </div>
          }
       
        </div>
        <div  
          className="d-flex flex-row mostly-customized-scrollbar"
          style={{width:'100%',
            height: "",
            backgroundColor: "#1F2029",
          }}
        >
          <div
            className="d-flex flex-row"
            style={{
              backgroundColor: "#1F2029",
              flex: 1,
              paddingLeft: "1rem",
              paddingRight: "1rem",
            }}
          >
            <div class="d-flex flex-row" style={{ flex: 1 }}>
              <form
                style={{ flex: 1, backgroundColor: "" }}
                onSubmit={(e) => {
              
                  handleSubmit(e,'no');
                }}
              >
                <div
                  class="d-flex flex-row inputter mostly-customized-scrollbar mt-2 mb-2"
                  style={{ flex: 1, width: "100%" }}
                >
                  <div tabIndex={100} class="iemoji handy">
                 
                      <BsEmojiSmile style={{ fontSize: "5rem" }} onClick={()=>{setshowemoji(!showemoji)}}/>
                 
                  </div>

                  <input
                  id="focus"
                    style={{ flex: 1,width:'70%' }}
                    class="pl-4 search_input blinking-cursor"
                    type="text"
                    name=""
                    value={inputValue}
                    placeholder="Message"
                    onChange={(e) => {
                      handleInputChange(e.target.value);
                    }}
                  />

                  <div
                    className="p-1"
                  
                  >
                    <div class="imoji" onClick={(e)=>{handleSubmit(e,'clicked');handlefocus()}}>
                      <SendRoundedIcon />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatDescription;
