import React, { useState,useEffect, useRef } from "react";

import uuid from 'react-uuid';
import "../chat.css";

import Avatar from "@mui/material/Avatar";
import { BsEmojiSmile, BsFillSendFill } from "react-icons/bs";
import { deepPurple } from "@mui/material/colors";
import Message from "./Message";

import { arrayUnion, doc, onSnapshot, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../../userauth/FireAuth";
import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import { Logout, MoreVert, PersonAdd, Settings } from "@mui/icons-material";




function ChatDescription({descname,bio,messageid,uid}) {
 
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
 
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "userchats",messageid), (doc) => {
      doc.exists() && setMessages(doc.data().messages);
    });

    return () => {
      unSub();
    };
  }, [messageid]);

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleInputChange = (event) => {
    setInputValue(event);
  };
  const handleSubmit = async(event) => {
    event.preventDefault();
    

  let text =inputValue;
   setInputValue("");


       await updateDoc(doc(db, "userchats", messageid), {
      messages: arrayUnion({
        id:uuid(),
        inputValue:text,
        senderId:uid,
        date: Timestamp.now(),
      }),
    });
   




    
  };

  return (
    <>
      <div
        class="d-flex flex-row"
        style={{ backgroundColor: "#1F2029", height: "13.6vh" ,zIndex:'2000' ,
      
      
        borderTop: "3px",
        borderTopColor: "#292A33",
        borderTopStyle: "solid",

        
        borderRight: "3px",
        borderRightColor: "#292A33",
       borderRightStyle: "solid",
     
      
      
      }}
      >
        <div
          className="d-flex flex-row mt-3 "
          style={{
            borderBottom: "2px",
            borderBottomColor: "#292A33",
            borderBottomStyle: "solid",
      
            
            
            flex: 1,
          }}
        >
          <div className="mr-4 pt-1 ml-4 pl-2">
            <Avatar sx={{ bgcolor: deepPurple[500], width: 56, height: 56 }} src="https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740&t=st=1679001679~exp=1679002279~hmac=c53ea30da094c90d0bae1bf703599d8572b711d931d2bbe519571eae87eb5a23" alt="hwt"/>
            
          </div>
          <div
            className="d-flex flex-column "
            style={{ flex: 1, backgroundColor: "#1F2029" }}
          >
            <div
              className="mt-1"
              style={{
              
                backgroundColor: "#1F2029",
                fontSize: "23px",
                
                color: "white",
              }}
            >
              {descname}
            </div>
            <div
              className="pl-1"
              style={{ color: "#a8a8a8", fontSize: "13px",top:0,backgroundColor:'' }}
            >
             online            </div>
          </div>

         

          <div
            className="pt-2 ml-4 pr-3 mr-3"
            style={{ color: "#a8a8a8", fontSize: "30px" }}
          >
             <Box>
                  <Tooltip title="Account settings">
                    <IconButton  
                      onClick={handleClick}
                      size="small"
                      sx={{ ml: 2 }}
                      aria-controls={open ? "account-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? "true" : undefined}
                    >
                      <MoreVert/>
                      {/* <Avatar sx={{ width: 56, height: 56 }}>M</Avatar> */}
                      
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
                          right: 12,
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
                    <MenuItem onClick={handleClose}>
                      <Avatar /> Profile
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <Avatar /> My account
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <PersonAdd fontSize="small" color="whitesmoke" />
                      </ListItemIcon>
                      Add another account
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <Settings fontSize="small" color="whitesmoke" />
                      </ListItemIcon>
                      Settings
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <Logout fontSize="small" color="whitesmoke" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
           
          </div>
        </div>
      </div>
      <div class="d-flex flex-column justify-content-between mostly-customized-scrollbar">
        <div
          className="d-flex flex-column chatdata mostly-customized-scrollbar"
          style={{
            height: "68.5vh",
            backgroundColor: "#17181F",

             
      
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
          <div className="chat-box mostly-customized-scrollbar" >
            <div className="messsage1 mostly-customized-scrollbar">
              {messages.map((m) => (
                m.senderId===uid?
                <Message key={m.id} descname={descname} message={m} sender={true}/>
                :
                <Message key={m.id} descname={descname}message={m} sender={false}/>
              ))}
            </div>
            <div ref={messagesEndRef} />

            {/* <img src="https://4kwallpapers.com/images/walls/thumbs_3t/10307.jpg"/> */}
          </div>
          
          
        </div>
        <div
            className="d-flex flex-row justify-content-center mostly-customized-scrollbar"
            style={{
              height: "9vh",
              backgroundColor: "#1F2029",
            }}
          >
            <div
              className="d-flex flex-row"
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              <div class="d-flex flex-row" style={{}}>
                <form
                  onSubmit={(e) => {
                    handleSubmit(e);
                  }}
                >
                  <div
                    class="d-flex flex-row inputter mostly-customized-scrollbar"
                    style={{ flex: 1, width: "66rem" }}
                  >
                    <div>
                      <a href="PIC" class="imoji">
                        <BsEmojiSmile style={{ fontSize: "29px" }} />
                      </a>
                    </div>

                    <input
                      class="search_input px-3"
                      type="text"
                      name=""
                      value={inputValue}
                      placeholder="Message"
                      onChange={(e) => {
                        handleInputChange(e.target.value);
                      }}
                      style={{
                        flex: 1,
                      }}
                    />

                    <div className="p-1">
                      <button
                        class="imoji"
                        onClick={() => {
                          handleSubmit();
                        }}
                      >
                        <BsFillSendFill
                          style={{ fontSize: "29px", float: "left" }}
                        />
                      </button>
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
