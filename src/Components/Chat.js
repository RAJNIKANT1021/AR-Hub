import React, { useState, useEffect } from "react";
import {
  Avatar,
  Box,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import "./chat.css";
import Diversity1Icon from '@mui/icons-material/Diversity1';
import PersonIcon from '@mui/icons-material/Person';
import HttpsOutlinedIcon from '@mui/icons-material/HttpsOutlined';
import ChatTile from "./Chat_component/ChatTile";
import ArchiveIcon from '@mui/icons-material/Archive';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import FaceIcon from '@mui/icons-material/Face';





import ChatDescription from "./Chat_component/ChatDescription";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../userauth/FireAuth";
import { FiSearch } from "react-icons/fi";
import NotificationsIcon from '@mui/icons-material/Notifications';
import Userinfo from "./Chat_component/Userinfo";

function Chat({ uid }) {
  const [isloading, setisloading] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [archieveview, setarchieveview] = useState(false);
  const [showmyaccount, setshowmyaccount] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const openarchieve = () => {
    setarchieveview(!archieveview);


  }
  const openmyaccount = () => {
    


  }
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
    <div className="d-flex flex-column" style={{ backgroundColor: "", overflow: 'hidden' }}>
      <div
        className="d-flex flex-row"
        style={{
          backgroundColor: "",

          overflow: "hidden",
          overflowX: "hidden"
        }}
      >
        <div className="d-flex flex-row" style={{ backgroundColor: "#1F2029", width: "100vw" }}>
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
                    <MenuItem onClick={() => { handleClose(); openmyaccount() }}>
                      <ListItemIcon style={{ color: "whitesmoke" }}>
                        <PersonIcon fontSize="small" color="whitesmoke" />
                      </ListItemIcon>

                      My Account
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

                <div
                  class="d-flex align-items-center pl-3"
                  style={{ flex: 1, fontSize: "2rem", color: "#FFFFFF" }}
                >
                  Aman
                </div>

                <div
                  className="d-flex justify-content-center align-items-center mx-3"
                  style={{ backgroundColor: "#1F2029" }}
                >
                  <Tooltip title="Search Chats">
                    <IconButton>
                      <FiSearch style={{ color: "#ABABAE", fontSize: "2rem" }} />
                    </IconButton>
                  </Tooltip>
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



              <div className="d-flex flex-row mt-2" style={{ flex: 1 }}>
                <div className="d-flex flex-column">



                  <div className="d-flex" style={{ flex: 1, color: 'white', fontSize: '2rem' }}>
                    <div className="d-flex" style={{ width: '10rem' }}>


                      Message {isloading && <div className="pt-4 ">
                        <div className="bouncing-loader mt-3 pl-1" style={{ bottom: 0 }}>
                          <div></div>
                          <div></div>
                          <div></div>

                        </div>

                      </div>}
                    </div>

                  </div>
                  {
                    archieveview === true ?  <div className="d-flex mt-3 px-1 tracking-in-expand" style={{ flex: 1, color: '#595A61', fontSize: '1rem' }}>
                    {`ARCHEVE CHAT`}
                  </div>: <div className="d-flex mt-3 px-1 tracking-in-expand" style={{ flex: 1, color: '#595A61', fontSize: '1rem' }}>
                    {`RECENT CHAT`}
                  </div>

                  }
                 
                </div>
              </div>
              <div className="d-flex" style={{ width: '' }}>

                <div className="d-flex flex-row hello tracking-in-expand" style={{ transition: 'width 0.7s', width: '9rem', justifyContent: 'flex-end' }}>

                  <div className="d-flex flex-row px-2 py-2 mt-3  hello tracking-in-expand handy" onClick={() => { openarchieve() }} style={{
                    backgroundColor: '#E3F3FF', height: 'max-content', width: 'max-content', transition: 'width 0.7s',
                    borderRadius: '19px'
                  }}>

                    <div className="d-flex hello mr-1" >
                      {archieveview === true ? <ChatOutlinedIcon size={1} /> : <ArchiveIcon size={1} />}



                    </div>



                    <div className="d-flex hello tracking-in-expand" style={{ flex: 1, fontSize: '1rem', width: 'max-content' }}>
                      {archieveview === true ? `Chats` : `Archive Chats`}
                    </div>


                  </div>



                </div>

              </div>
            </div>

            {
              archieveview === true ? (


                <div className="d-flex flex-column openarchieve mostly-customized-scrollbar " style={{ backgroundColor: '#1f2029', overflowY: 'scroll', overflowX: 'hidden' }}>


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







              ) : <div className="d-flex closearchieve" id="" style={{ backgroundColor: '#1f2029' }}>




              </div>
            }



            <div
              className={archieveview === true ? "d-flex flex-column pt-2 px-2 mostly-customized-scrollbar closechat" : "d-flex flex-column pt-2 px-2 mostly-customized-scrollbar openchat"}
              style={{
                backgroundColor: "",
                position: "relative",

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
                setshowmyaccount={setshowmyaccount}
              />
            )}
            {/* header */}
          </div>
          {
            showmyaccount === true ? (<div className='d-none d-lg-block userprofile scale' style={{       borderWidth: "1px",
            borderColor: "#292A33",
            borderStyle: "solid",
          
}}>
              <div className="d-flex flex-column scale" style={{ backgroundColor: '#1F2029' ,overflow:'hidden'}}>
              <Userinfo setshowmyaccount={setshowmyaccount}/>

              </div>
              </div>):(   showmyaccount === false && <div className="d-none d-lg-block userprofile closscale" style={{contain:'strict'}}>
              <div className="d-flex flex-column closscale"style={{ backgroundColor: '#1F2029' ,contain:'strict'}}>
              <Userinfo setshowmyaccount={setshowmyaccount}/>
                

              </div>

              </div>)

          
        
        }
        </div>

      </div>
    </div>
  );
}

export default Chat;
