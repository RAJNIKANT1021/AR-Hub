import React, { useState, useEffect } from "react";
import {
  Avatar,
  Badge,
  Box,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import "./chat.css";
import FriendRequest from "./FriendRequest";
import Diversity1Icon from "@mui/icons-material/Diversity1";
import PersonIcon from "@mui/icons-material/Person";
import HttpsOutlinedIcon from "@mui/icons-material/HttpsOutlined";
import ChatTile from "./Chat_component/ChatTile";
import ArchiveIcon from "@mui/icons-material/Archive";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import FaceIcon from "@mui/icons-material/Face";

import ChatDescription from "./Chat_component/ChatDescription";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../userauth/FireAuth";
import { FiSearch } from "react-icons/fi";
import { MdOutlineCancel } from "react-icons/md";

import NotificationsIcon from "@mui/icons-material/Notifications";
import Userinfo from "./Chat_component/Userinfo";
import Myprofile from "./Chat_component/Myprofile";
import FriendsList from "./Chat_component/FriendsList";
import Myavatar from "./Myavatar";
import SearchList from "./Chat_component/SearchList";

function Chat({ uid }) {
  const[username,setusername]=useState('');
  const [showfriendrequest, setshowfriendrequest] = useState(false);
  const [showsearchlist, setshowsearchlist] = useState(false);
  const [showavatar, setshowavatar] = useState(false);
  const [showfriends, setshowfriends] = useState(false);
  const[showmyprofile,setshowmyprofile]=useState(false);
  const [isloading, setisloading] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [archieveview, setarchieveview] = useState(false);
  const [showmyaccount, setshowmyaccount] = useState(null);
  const [searchopen, setsearchopen] = useState(null);
  const [searchinput, setsearchinput] = useState('');
  const [chatid, setchatid] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const openarchieve = () => {
    setarchieveview(!archieveview);
    setshowmyprofile(false);
    setshowfriendrequest(false);
  
  };
  const handlesearchopen = () => {
    if (searchopen === null) {
      setsearchopen(true);
    } else if (searchopen === true) {
      setsearchopen(false);
    } else if (searchopen === false) {
      setsearchopen(true);
    }
  };
  const [sendrecid, setsendrecid] = useState(null);
  const [showchatdesc, setshowchatdesc] = useState(false);
  const [arraynames, setarraynames] = useState([]);
  const[status,setstatus]=useState('offline');

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

            
            if (key === uid) {
              const us = detail[key];
              setusername(us.name);
             
            
              
            
              
            
            }
            if (key !== uid) {
              const us = detail[key];
             
            
              
            
              
              arraynamed.push({
                name: us.name,
                bio: us.Bio,
                uid: key,
                status:us.status
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);



  // const userdatafetch =async()=>{

  // }
 
  const handlesearch=(e)=>{
    e.preventDefault();
  setsearchinput(document.getElementById('searchinput').value);
    setshowsearchlist(true)
    setshowavatar(false)
    setshowmyprofile(false);
    setshowfriendrequest(false);
    setarchieveview(false);
    setshowfriends(false);

  }
  const handlesearchclose=()=>{
    setsearchopen(false);
    setshowsearchlist(false)
    setshowavatar(false)
    setshowmyprofile(false);
    setshowfriendrequest(false);
    setarchieveview(false);
    setshowfriends(false);

  }


  const handleshowfriendlist = () => {
    
    setshowsearchlist(false)
    setshowavatar(false)
    setshowmyprofile(false);
    setshowfriendrequest(true);
    setarchieveview(false);
    setshowfriends(false);

  };



  const shwmyprofile=()=>{
    setshowfriends(false);
    setshowsearchlist(false)

    setshowavatar(false)
    setshowmyprofile(true);
    setshowfriendrequest(false);
    setarchieveview(false);
  }
  const shwmyavatar=()=>{
    setshowsearchlist(false)

    setshowfriends(false);
    setshowavatar(true)
    setshowmyprofile(false);
    setshowfriendrequest(false);
    setarchieveview(false);
  }

  const shwfriens=()=>{
    setshowsearchlist(false)

    setshowavatar(false);
    setshowmyprofile(false);
    setshowfriendrequest(false);
    setarchieveview(false);
    setshowfriends(true);

    
  }
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
    setchatid(id);
  };


  return (
    <div
      className="d-flex flex-column"
      style={{ backgroundColor: "", overflow: "hidden" }}
    >
      <div
        className="d-flex flex-row"
        style={{
          backgroundColor: "",

          overflow: "hidden",
          overflowX: "hidden",
        }}
      >
        <div
          className="d-flex flex-row"
          style={{ backgroundColor: "#1F2029", width: "100vw" }}
        >
          {/* header */}

          <div
            className="d-flex flex-column  bd-highlight"
            style={{
              borderWidth: "3px",
              borderColor: "#292A33",
              borderStyle: "solid",

              height: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex flex-column mx- position-sticky"
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
                    <MenuItem
                      onClick={() => {
                        handleClose();
                        shwmyprofile();
                      }}
                    >
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <PersonIcon fontSize="small" color="whitesmoke" />
                      </ListItemIcon>
                      My Account
                    </MenuItem>
                    <MenuItem  onClick={() => {
                        handleClose();
                        shwfriens();
                      }}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <HttpsOutlinedIcon
                          fontSize="small"
                          color="whitesmoke"
                        />
                      </ListItemIcon>
                      Friends
                    </MenuItem>

                    <MenuItem  onClick={() => {
                        handleClose();
                        shwmyavatar();
                      }}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <FaceIcon fontSize="small" color="whitesmoke" />
                      </ListItemIcon>
                      Avatar
                    </MenuItem>
                    <MenuItem onClick={handleClose}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <NotificationsIcon
                          fontSize="small"
                          color="whitesmoke"
                        />
                      </ListItemIcon>
                      Notification
                    </MenuItem>

                    <MenuItem
                      onClick={() => {
                        handleClose();
                        handleshowfriendlist();
                      }}
                    >
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <Badge badgeContent={4} color="primary">
                          <Diversity1Icon fontSize="small" color="whitesmoke" />
                        </Badge>
                      </ListItemIcon>
                      Friend Requests
                    </MenuItem>
                  </Menu>
                </Box>

                <div
                  class="d-flex align-items-center pl-3"
                  style={{ flex: 1, fontSize: "2rem", color: "#FFFFFF" }}
                >
                  {searchopen !== true && <span>{username}</span>}
                </div>

                {searchopen === true && (
                  <div className="d-flex flex-row">
                    <div
                      classs="d-flex align-items-center"
                      style={{ fontSize: "1.3rem", color: "#FFFFFF" }}
                    >
                      <form onSubmit={(e)=>{handlesearch(e)}}>
                      <input
                      id="searchinput"
                        className="animateee my-2 pb-1 pl-3"
                        type="text"
                        placeholder="search contacts"
                      
                   
                        style={{}}
                      />
                      </form>
                    </div>

                    <div
                      className="d-flex justify-content-center align-items-center animato"
                      style={{}}
                    >
                      <Tooltip title="Cancel  ">
                        <IconButton
                          onClick={() => {
                            handlesearchclose();
                            
                          }}
                        >
                          <MdOutlineCancel
                            style={{ color: "#ABABAE", fontSize: "2rem" }}
                          />
                        </IconButton>
                      </Tooltip>
                      {/* {isloading===true &&<CircularProgress color="primary" size={22}  />} */}
                    </div>
                  </div>
                )}

                {searchopen !== true && (
                  <div className="d-flex flex-row">
                    {/* <div classs="d-flex align-items-center" style={{  fontSize: "1.3rem", color: "#FFFFFF" }}>
                  <input className="animateee my-2 pb-1 pl-3" type="text" placeholder ="search contacts" style={{
               }}/>

                </div> */}

                    <div
                      className="d-flex justify-content-center align-items-center"
                      style={{ backgroundColor: "#1F2029" }}
                    >
                      <Tooltip title="Search Chats">
                        <IconButton
                          onClick={() => {
                            handlesearchopen();
                          }}
                        >
                          <FiSearch
                            style={{ color: "#ABABAE", fontSize: "2rem" }}
                          />
                        </IconButton>
                      </Tooltip>
                      {/* {isloading===true &&<CircularProgress color="primary" size={22}  />} */}
                    </div>
                  </div>
                )}
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
               { showsearchlist ===true &&
              <div className="d-flex flex-column" style={{flex:1,backgroundColor:''}}>

<SearchList searchinput={searchinput} uid={uid}/>
              </div>}

               { showmyprofile ===true &&
              <div className="d-flex flex-column" style={{flex:1,backgroundColor:''}}>

<Myprofile setshowmyprofile={setshowmyprofile}/>
              </div>}
               { showavatar ===true &&
              <div className="d-flex flex-column" style={{flex:1,backgroundColor:''}}>

<Myavatar setshowavatar={setshowavatar}/>
              </div>}
               { showfriends ===true &&
              <div className="d-flex flex-column" style={{flex:1,backgroundColor:''}}>

                <FriendsList setshowfriends={setshowfriends}/>

              </div>}
               
             { showfriendrequest ===true &&
              <div className="d-flex flex-column" style={{flex:1,backgroundColor:''}}>
<FriendRequest setshowfriendrequest={setshowfriendrequest}/>


              </div>}
{showfriendrequest===false && showmyprofile===false && showavatar===false && showfriends===false && showsearchlist===false&&
            <div className="d-flex flex-row px-4 mb-4" >
              <div className="d-flex flex-row mt-2" style={{ flex: 1 }}>
                <div className="d-flex flex-column" >
                  <div
                    className="d-flex"
                    style={{ flex: 1, color: "white", fontSize: "2rem" }}
                  >
                    <div className="d-flex" style={{ width: "10rem" }}>
                      Message{" "}
                      {isloading && (
                        <div className="pt-4 ">
                          <div
                            className="bouncing-loader mt-3 pl-1"
                            style={{ bottom: 0 }}
                          >
                            <div></div>
                            <div></div>
                            <div></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {archieveview === true ? (
                    <div
                      className="d-flex mt-3 px-1 tracking-in-expand"
                      style={{ flex: 1, color: "#595A61", fontSize: "1rem" }}
                    >
                      {`ARCHEVE CHAT`}
                    </div>
                  ) : (
                    <div
                      className="d-flex mt-3 px-1 tracking-in-expand"
                      style={{ flex: 1, color: "#595A61", fontSize: "1rem" }}
                    >
                      {`RECENT CHAT`}
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex" style={{ width: "" }}>
                <div
                  className="d-flex flex-row hello tracking-in-expand"
                  style={{
                    transition: "width 0.7s",
                    width: "9rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <div
                    className="d-flex flex-row px-2 py-2 mt-3  hello tracking-in-expand handy"
                    onClick={() => {
                      openarchieve();
                    }}
                    style={{
                      backgroundColor: "#E3F3FF",
                      height: "max-content",
                      width: "max-content",
                      transition: "width 0.7s",
                      borderRadius: "19px",
                    }}
                  >
                    <div className="d-flex hello mr-1">
                      {archieveview === true ? (
                        <ChatOutlinedIcon size={1} />
                      ) : (
                        <ArchiveIcon size={1} />
                      )}
                    </div>

                    <div
                      className="d-flex hello tracking-in-expand"
                      style={{
                        flex: 1,
                        fontSize: "1rem",
                        width: "max-content",
                      }}
                    >
                      {archieveview === true ? `Chats` : `Archive Chats`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
}

            {archieveview === true ? (
              <div
                className="d-flex flex-column openarchieve mostly-customized-scrollbar "
                style={{
                  backgroundColor: "#1f2029",
                  overflowY: "scroll",
                  overflowX: "hidden",
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
            ) : (
              <div
                className="d-flex closearchieve"
                id=""
                style={{ backgroundColor: "#1f2029" }}
              ></div>
            )}

            {showfriendrequest===false&&showmyprofile===false&&showavatar===false && showfriends===false &&showsearchlist===false &&

            <div
              className={
                archieveview === true
                  ? "d-flex flex-column pt-2 px-2 mostly-customized-scrollbar closechat"
                  : "d-flex flex-column pt-2 px-2 mostly-customized-scrollbar openchat"
              }
              style={{
                backgroundColor: "",
                position: "relative",

                overflowY: "scroll",
              }}
            >
              {arraynames.map((names, i) => (
                <div
                  className=""
                  tabIndex={i*19732}
                  id={names.uid}
                  onClick={(e) => {
                    descriptionheader(names.uid, names);
                  }}
                  style={{ backgroundColor: "#1F2029" }}
                  key={i*107}
                >
                  <ChatTile name={names.name} key={i} />
                </div>
              ))}
            </div>
}
          </div>
                
                   
          <div
            className="d-none d-sm-block mostly-customized-scrollbar"
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
                chatid={chatid}
                setshowmyaccount={setshowmyaccount}
              />
            )}
            {/* header */}
          </div>
          {showmyaccount === true ? (
            <div
              className="d-none d-lg-block userprofile scale"
              style={{
                borderWidth: "1px",
                borderColor: "#292A33",
                borderStyle: "solid",
              }}
            >
              <div
                className="d-flex flex-column scale"
                style={{ backgroundColor: "#1F2029", overflow: "hidden" }}
              >
                <Userinfo setshowmyaccount={setshowmyaccount} />
              </div>
            </div>
          ) : (
            showmyaccount === false && (
              <div
                className="d-none d-lg-block userprofile closscale"
                style={{ contain: "strict" }}
              >
                <div
                  className="d-flex flex-column closscale"
                  style={{ backgroundColor: "#1F2029", contain: "strict" }}
                >
                  <Userinfo setshowmyaccount={setshowmyaccount} />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
