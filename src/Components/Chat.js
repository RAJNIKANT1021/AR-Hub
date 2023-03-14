import React,{useState,useEffect} from "react";
import { Button } from "@mui/material";
import { RxHamburgerMenu } from "react-icons/rx";
import "./chat.css";
import ChatTile from "./Chat_component/ChatTile";
import Avatar from "@mui/material/Avatar";
import { BsEmojiSmile, BsFillSendFill } from "react-icons/bs";
import { deepOrange, deepPurple } from "@mui/material/colors";

import { HiStatusOnline, HiOutlineDotsVertical } from "react-icons/hi";
import ChatDescription from "./Chat_component/ChatDescription";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../userauth/FireAuth";
import { useLocation } from "react-router-dom";
function Chat({uid,key}) {
  
const[showchatdesc,setshowchatdesc]=useState(false);
  const[arraynames,setarraynames]=useState([]);
  const[userid,setuserid]=useState(null)
  const[descname,setdescname]=useState(null)
  const[bio,setbio]=useState(null)

  useEffect(()=>{
    
   
   
    
    const setup =async() => {
      setuserid(uid)
      
      const docRef = doc(db, "A2B_USERS","Users")
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        let population= docSnap.data();
        let array=[]
        for (const key in population) {
          if (population.hasOwnProperty(key)) {

          
            
        
            array.push(population[key])}
            
          
        }
     const arraynamed=[];
     for(let j=0;j<array.length;j++){
      if(array[j]!==uid){
      const docRef = doc(db, "A2B_USERS","Users",array[j],'displayname')
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        arraynamed.push({name:docSnap.data().name,
          bio:docSnap.data().Bio,
          uid:array[j],
        
        })
       
    
        
        
       } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
    }
    }}
    setarraynames(arraynamed)
    
    } else {
        // doc.data() will be undefined in this case
        console.log("No such document!");
      }
      
      
    };
    setup();

  },[key,uid,userid])

  
    
  
    
      
  
  
  
  


  // const userdatafetch =async()=>{
 
  // }

  
    const descriptionheader=(id)=>{
      setshowchatdesc(true);
      
      for(let j=0;j<arraynames.length;j++){
        
        if(id===arraynames[j].uid){
          console.log(arraynames[j])
          setdescname(arraynames[j].name);
          setbio(arraynames[j].bio)
        }
      }


    }
    
  
  
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
                      <a href="#" class="search_icon">
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
            >{
              arraynames.length!==0 &&
              arraynames.map((names,i) =>  <div className="tab hoverr" tabIndex={i} id={names.uid} onFocus={(e)=>{descriptionheader(e.target.id)}} key={i} >
              <ChatTile name={names.name}  key={i} />

              </div>)
            
                
              
            }
             
         
             
            
             
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: "purple", flex: 1, height: "91vh" }}>
         {showchatdesc===true && <ChatDescription descname={descname} bio={bio} key={descname}/>}
          {/* header */}
          </div>
          </div>
    </div>
  );
}

export default Chat;
