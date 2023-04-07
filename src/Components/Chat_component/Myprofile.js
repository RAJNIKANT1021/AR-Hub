import { Avatar, IconButton } from "@mui/material";
import React, { useState } from "react";
import CancelIcon from "@mui/icons-material/Cancel";
import { deepPurple } from "@mui/material/colors";
import { RxPencil1 } from "react-icons/rx";
import{AiOutlineCheck} from "react-icons/ai";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../userauth/FireAuth";

function Myprofile({setshowmyprofile,loggeduser}) {
  const [edit, setedit] = useState(false);
  const [bioedit, setbioedit] = useState(false);

  const[varusername,setvarusername]=useState(loggeduser.name)
  const[varbio,setvarbio]=useState(loggeduser.Bio)
  const handleedit=()=>{
    document.getElementById('username').readOnly=false;
    document.getElementById('username').focus();
  }
  const handleeditsubmit=async()=>{
    let usname=document.getElementById('username').value;
    console.log(usname);
  setvarusername(document.getElementById('username').value);
  let uid=loggeduser.uid;
      
  const userstat = doc(db, "A2B_USERS", "Users", "usersdetails", "details");
  const updates = {};
  updates[uid + ".name"] = usname;
  


  await updateDoc(userstat, updates);

  document.getElementById('username').readOnly=true;

  }

  const handlebioedit=()=>{
    document.getElementById('bio').readOnly=false;
    document.getElementById('bio').focus();
  }
  const handlebioeditsubmit=async()=>{
    let bio=document.getElementById('bio').value
  setvarbio(bio);
  let uid=loggeduser.uid;
      
  const userstat = doc(db, "A2B_USERS", "Users", "usersdetails", "details");
  const updates = {};
  updates[uid + ".Bio"] = bio;
  


  await updateDoc(userstat, updates);

  document.getElementById('bio').readOnly=true;

  }
  return (
    <>
      <div className="d-flex flex-column" style={{ width: "100%",contain:'',overflowY:'' }}>
        <div className="d-flex flex-row">
          <div
            className="d-flex ml-4"
            style={{
              flex: 1,
              color: "white",
              fontSize: "1.5rem",
              alignItems: "center",
            }}
          >
            My Profile
          </div>
          <div className="ml-2">
            <IconButton style={{ color: "#ababae" }} onClick={()=>{setshowmyprofile(false)}}>
              <CancelIcon sx={{ fontSize: 40 }} />
            </IconButton>
          </div>
        </div>
      </div>
      <div
        className="d-flex flex-column mt-1"
        style={{ flex: 1, backgroundColor: "" }}
      >
        <div
          className="d-flex flex-row pt-3 mt-1"
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Avatar
            sx={{ bgcolor: deepPurple[500], width: 240, height: 240 }}
            src={loggeduser.Avatar}
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
            style={{ color: "#007f68", fontSize: ".8rem" }}
          >
            Username
          </div>
          <div className="d-flex flex-row mt-1 mb-2 pb-1" style={{ flex: 1 }}>
            <input
            id="username"
              type="text"
              className="pl-2"
              
            
              // onChange={(e)=>{setvarusername(e.target.value)}}
          
            defaultValue={varusername}
              style={{
                outline: "none",
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
              }}
            readOnly/>
            <div>
              {
                edit===false &&
                <IconButton onClick={()=>{setedit(true);handleedit()}}>
                <RxPencil1 style={{ color: "#8696a0", fontSize: "1.4rem" }} />
              </IconButton>
              }
              {
                edit===true &&
                 <IconButton onClick={()=>{setedit(false);handleeditsubmit()}}>
                 <AiOutlineCheck style={{ color: "#8696a0", fontSize: "1.4rem" }} />
               </IconButton>

              }
            
            </div>
          </div>
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
            style={{ color: "#007f68", fontSize: ".8rem" }}
          >
            About
          </div>
          <div className="d-flex flex-row mt-1 mb-2 pb-1" style={{ flex: 1 }}>
            <input
            id="bio"
              type="text"
              className="pl-2"
              defaultValue={varbio}
              style={{
                outline: "none",
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
              }}
            readOnly/>
            <div>
            {
                bioedit===false &&
                <IconButton onClick={()=>{setbioedit(true);handlebioedit()}}>
                <RxPencil1 style={{ color: "#8696a0", fontSize: "1.4rem" }} />
              </IconButton>
              }
              {
                bioedit===true &&
                 <IconButton onClick={()=>{setbioedit(false);handlebioeditsubmit()}}>
                 <AiOutlineCheck style={{ color: "#8696a0", fontSize: "1.4rem" }} />
               </IconButton>

              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Myprofile;
