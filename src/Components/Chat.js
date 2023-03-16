import React, { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import "./chat.css";
import { Loading } from 'react-loading-dot'
import ChatTile from "./Chat_component/ChatTile";
import ArchiveIcon from '@mui/icons-material/Archive';

import ChatDescription from "./Chat_component/ChatDescription";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../userauth/FireAuth";
import { Logout, PersonAdd, Settings } from "@mui/icons-material";
import { FiSearch } from "react-icons/fi";

function Chat({ uid }) {
  const [isloading, setisloading] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [sendrecid, setsendrecid] = useState(null);
  const [showchatdesc, setshowchatdesc] = useState(false);
  const [arraynames, setarraynames] = useState([]);

  const [descname, setdescname] = useState(null);
  const [bio, setbio] = useState(null);

  useEffect(() => {
    setisloading(true);
    const unsub = onSnapshot(
      doc(db, "A2B_USERS", "Users", "usersdetails", "details"),
      (doc) => {
        const arraynamed = [];
        const detail = doc.data();

        for (const key in detail) {
          if (detail.hasOwnProperty(key)) {
            if (key !== uid) {
              const us = detail[key];

              arraynamed.push({
                name: us.name,
                bio: us.Bio,
                uid: key,
              });
            }
          }
        }
        setarraynames(arraynamed);
        setisloading(false);
      }
    );

    return () => {
      unsub();
    };
  }, [uid]);

  // const userdatafetch =async()=>{

  // }

  const descriptionheader = async (id, names) => {
    let onetooneid;

    if (uid > id) {
      onetooneid = `${uid}${id}`;
    } else {
      onetooneid = `${id}${uid}`;
    }

    const docRef = doc(db, "userchats", onetooneid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
    } else {
      setDoc(docRef, { messages: [] });
    }

    setshowchatdesc(true);
    setdescname(names.name);
    setbio(names.bio);
    setsendrecid(onetooneid);
  };

  return (
    <div style={{ backgroundColor: "" }}>
      <div
        className="d-flex flex-row"
        style={{
          backgroundColor: "",
          height: "91vh",
          overflow: "hidden",
        }}
      >
        <div  className="d-flex flex-row" style={{ backgroundColor: "#1F2029", width: "100vw" }}>
          {/* header */}

          <div
            className="d-flex flex-column bd-highlight"
            style={{
              width:'65vh',
              borderWidth: "3px",
              borderColor: "#292A33",
              borderStyle: "solid",

              height: "91vh",
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex flex-column px-2  position-sticky"
              style={{
                position: "relative",
                backgroundColor: "#1F2029",
                borderBottom: "3px",
                borderBottomColor: "#292A33",
                borderBottomStyle: "solid",
              }}
            >
              <div
                className="d-flex flex-row mt-3 mb-3"
                style={{ backgroundColor: "#1F2029" }}
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
                      <Avatar
                        sx={{ width: 50, height: 50 }}
                        src="https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=740&t=st=1678994453~exp=1678995053~hmac=d2710921626e1f50d2bc064ce0f480e7088c2eb7c1b9e1ad0c281abaf69fe49d"
                        alt="google"
                      />
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
                        backgroundColor: "#1F2029",
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
                          left: 32,
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

                <div
                  class="d-flex align-items-center pl-3"
                  style={{ flex: 1, fontSize: "27px", color: "#FFFFFF" }}
                >
                  Aman Kumar
                </div>

                <div
                  className="d-flex justify-content-center align-items-center mx-3"
                  style={{ backgroundColor: "#1F2029" }}
                >
                  <FiSearch style={{ color: "#ABABAE", fontSize: "32px" }} />
                  {/* {isloading===true &&<CircularProgress color="primary" size={22}  />} */}
                </div>
              </div>

              {/* <div
                  className=""
                  style={{
                    backgroundColor: "#212121",
                    justifyItems: "center",
                    color: "#aaaaaa",
                    alignItems: "center",
                    // padding: "10px",
                    fontSize: "10px",
                  }}
                >
            
                </div> */}
            </div>

            {/* <div
                className="d-flex flex-row justify-content-around py-1 mt-1"
                style={{
                  backgroundColor: "#212121",

                  color: "black",
                }}
              >
              
               
              </div> */}
              <div className="d-flex flex-row px-4 mb-4">
              
                

               <div className="d-flex flex-row mt-2" style={{flex:1}}>
                <div className="d-flex flex-column">

              
                
                <div className="d-flex" style={{flex:1,color:'white',fontSize:'37px'}}>
Message {isloading &&<div className="pt-4 "> 
<div className="bouncing-loader mt-3 pl-1" style={{bottom:0}}>
        <div></div>
        <div></div>
        <div></div>
       
      </div>

</div>}

                </div>
                <div className="d-flex mt-3 px-1" style={{flex:1,color:'#595A61',fontSize:'16px'}}>
RECENT CHAT
                </div>
                </div>
                </div>
                <div className="d-flex"  style={{}}>
                  <div className="d-flex flex-row">
                    <div  className="d-flex flex-row px-3 py-2 mt-4" style={{backgroundColor:'#E3F3FF',height:'max-content',borderRadius:'19px'}}>
                    <div className="d-flex" >
                    <ArchiveIcon/>


                  </div>
                  <div className="d-flex" style={{flex:1}}>
Archive Chat
                  </div>
                      </div>
                  
               
                </div>
              </div>
              </div>
              
           
          <div
             className="d-flex flex-column pt-2 px-2 mostly-customized-scrollbar"
            style={{
              backgroundColor: "",
              position: "relative",
              height: "33.2rem",
              overflowY: "scroll",
            }}
          >
            {arraynames.map((names, i) => (
              <div
                className=""
                tabIndex={i}
                id={names.uid}
                onFocus={(e) => {
                  descriptionheader(e.target.id, names);
                }}
                style={{ backgroundColor: "#1F2029" }}
                key={i}
              >
                <ChatTile name={names.name} key={i} />
                
              </div>
            ))}
          </div>
        </div>

        <div
          className="mostly-customized-scrollbar"
          style={{
            backgroundColor: "black",
            flex: 1,
            height: "91vh",
            contain: "strict",
          }}
        >
          {showchatdesc === true && (
            <ChatDescription
              descname={descname}
              bio={bio}
              key={descname}
              messageid={sendrecid}
              uid={uid}
            />
          )}
          {/* header */}
        </div>
      </div>
    </div>
    </div>
  );
}

export default Chat;
