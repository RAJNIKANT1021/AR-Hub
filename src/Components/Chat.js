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
import { RxHamburgerMenu } from "react-icons/rx";
import "./chat.css";
import ChatTile from "./Chat_component/ChatTile";

import ChatDescription from "./Chat_component/ChatDescription";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../userauth/FireAuth";
import { Logout, PersonAdd, Settings } from "@mui/icons-material";

function Chat({ uid }) {
  const[isloading,setisloading]=useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [sendrecid, setsendrecid] = useState(null);
  const [senderid, setsenderid] = useState(null);
  const [recieverid, setrecieverid] = useState(null);
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
    setisloading(false)  }
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
      setsenderid(uid);
      setrecieverid(id);
    } else {
      onetooneid = `${id}${uid}`;
      setsenderid(uid);
      setrecieverid(id);
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
    <div style={{ backgroundColor: "#212121" }}>
      <div
        className="d-flex flex-row"
        style={{
          backgroundColor: "#212121",
          height: "90vh",
          overflow: "hidden",
        }}
      >
        <div>
          {/* header */}
          <div
            className="d-flex flex-column bd-highlight"
            style={{
              backgroundColor: "#212121",
              height: "91vh",
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex flex-column  px-2  position-sticky"
              style={{ position: "relative", backgroundColor: "##212121" }}
            >
              <div className="d-flex flex-row mb-3 mt-3 my-3">
                <Divider />
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
                      <Avatar sx={{ width: 56, height: 56 }}>M</Avatar>
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
                  class=" d-flex justify-content-center align-items-center search "
                  style={{
                    backgroundColor: "#212121",
                  }}
                >
                  <form action="http://www.google.com/search" method="get">
                    <div class=" d-flex flex-row searchbar">
                    <a href="SERCH" class="search_icon">
                        <i class="fas fa-search"></i>
                      </a>
                      <input
                        class="search_input"
                        type="text"
                        name=""
                        placeholder="Search AR hub"
                      />
                      <div className="d-flex px-2">
                      {isloading===true &&<CircularProgress color="primary" size={22}  />}
                      </div>
                     
                      
                    
                     
                    </div>
                   
                  </form>
                </div>
                <Divider /> <Divider /> <Divider /> <Divider />
                <Divider />
                <div
                  className="px-1"
                  style={{
                    backgroundColor: "#212121",
                    justifyItems: "center",
                    color: "#aaaaaa",
                    alignItems: "center",
                    // padding: "10px",
                    fontSize: "10px",
                  }}
                >
                  <Divider />
                </div>
                <Divider />
              </div>
              <Divider /> <Divider />

              <div
                className="d-flex flex-row justify-content-around py-1 mt-1"
                style={{
                  backgroundColor: "#212121",

                  color: "black",
                }}
              >
                <div class="chatnav">
                  <Button
                    variant="contained"
                    style={{
                      color: "##8774e1",
                      backgroundColor: "transparent",
                    }}
                  >
                    All
                    <div
                      className="px-1 mx-2"
                      style={{
                        borderRadius: "80px",
                        backgroundColor: "#8774e1",
                        color: "white",
                        minWidth: "31px",
                      }}
                    >
                      12
                    </div>
                  </Button>
                </div>
                <div class="chatnav">
                  <Button
                    variant="contained"
                    style={{
                      color: "#9b9b9b",
                      backgroundColor: "transparent",
                    }}
                  >
                    Personal{" "}
                    <div
                      className="px-1 mx-2"
                      style={{
                        borderRadius: "80px",
                        backgroundColor: "#8774e1",
                        color: "white",
                        minWidth: "31px",
                      }}
                    >
                      1
                    </div>
                  </Button>
                </div>

                <div class="chatnav">
                  <Button
                    variant="contained"
                    style={{
                      color: "#9b9b9b",
                      backgroundColor: "transparent",
                    }}
                  >
                    Unreads{" "}
                    <div
                      className="px-1 mx-2"
                      style={{
                        borderRadius: "80px",
                        backgroundColor: "#8774e1",
                        color: "white",
                        minWidth: "31px",
                      }}
                    >
                      125
                    </div>
                  </Button>
                </div>
               
              </div>
             
            </div>
            <div
              className="d-flex flex-column pt-2 px-2 mostly-customized-scrollbar"
              style={{
                backgroundColor: "#212121",
                position: "relative",
                height: "33.2rem",
                overflowY: "scroll",
              }}
            >
              {arraynames.map((names, i) => (
                <div
                  className="tab hoverr"
                  tabIndex={i}
                  id={names.uid}
                  onFocus={(e) => {
                    descriptionheader(e.target.id, names);
                  }}
                  key={i}
                >
                  <ChatTile name={names.name} key={i} />
                  <Divider /> <Divider />
                <Divider /> 
                  <Divider />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mostly-customized-scrollbar"
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
  );
}

export default Chat;
