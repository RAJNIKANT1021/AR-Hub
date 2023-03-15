import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";
import { RxHamburgerMenu } from "react-icons/rx";
import "./chat.css";
import ChatTile from "./Chat_component/ChatTile";



import ChatDescription from "./Chat_component/ChatDescription";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "../userauth/FireAuth";

function Chat({ uid }) {

  const[sendrecid,setsendrecid]=useState(null);
  const[senderid,setsenderid]=useState(null);
  const[recieverid,setrecieverid]=useState(null);
  const [showchatdesc, setshowchatdesc] = useState(false);
  const [arraynames, setarraynames] = useState([]);
 
  const [descname, setdescname] = useState(null);
  const [bio, setbio] = useState(null);

  useEffect(() => {
    
    
    const unsub=onSnapshot(
      doc(db, "A2B_USERS", "Users", "usersdetails", "details"),
      (doc) => {
        const arraynamed = [];
        const detail = doc.data();

        for (const key in detail) {
          if (detail.hasOwnProperty(key)) {
            if(key !==uid){
            const us = detail[key];

            arraynamed.push({
              name: us.name,
              bio: us.Bio,
              uid: key,
            });
          }
        }}
        setarraynames(arraynamed) }
    );

    return () => {
     unsub()
    };
  }, [uid]);


  // const userdatafetch =async()=>{

  // }

  const descriptionheader = async(id, names) => {
    let onetooneid;

   
    
    if(uid>id){
      onetooneid=`${uid}${id}`
      setsenderid(uid);
      setrecieverid(id);
      
    }else{
      onetooneid=`${id}${uid}`
      setsenderid(uid);
      setrecieverid(id);
    }

    const docRef = doc(db, "userchats",onetooneid);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
      
    }else{
      setDoc(docRef,{messages:[]});
    }
   
    setshowchatdesc(true);
    setdescname(names.name);
    setbio(names.bio);
    setsendrecid(onetooneid);
  };
 

  return (
    <div>
      <div className="d-flex flex-row">
        <div style={{ height: "91vh" }}>
          {/* header */}
          <div
            className="d-flex flex-column bd-highlight mb-3"
            style={{
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex flex-column pt-2 px-2  position-sticky"
              style={{ backgroundColor: "#212121", position: "relative" }}
            >
              <div className="d-flex flex-row">
                <div
                  className="px-1"
                  style={{
                    backgroundColor: "#212121",
                    justifyItems: "center",
                    color: "#aaaaaa",
                    alignItems: "center",
                    padding: "10px",
                    fontSize: "20px",
                  }}
                >
                  <RxHamburgerMenu />
                </div>

                <div
                  class="search"
                  style={{
                    backgroundColor: "#212121",
                  }}
                >
                  <form action="http://www.google.com/search" method="get">
                    <div class="searchbar">
                      <input
                        class="search_input"
                        type="text"
                        name=""
                        placeholder="Search AR hub"
                      />
                      <a href="SERCH" class="search_icon">
                        <i class="fas fa-search"></i>
                      </a>
                    </div>
                  </form>
                </div>
              </div>

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
              className="d-flex flex-column pt-2 px-2"
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
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: "purple", flex: 1, height: "91vh" }}>
          {showchatdesc === true && (
            <ChatDescription descname={descname} bio={bio} key={descname} messageid={sendrecid}  uid={uid}/>
          )}
          {/* header */}
        </div>
      </div>
    </div>
  );
}

export default Chat;
