import React ,{useState,useEffect}from 'react'
import './App.css'
import Navbar from "./Components/Navbar";
import Login from "./userauth/login";
import {  Routes, Route,useLocation } from "react-router-dom";
import Movies from "./Components/Movies";
import Home from "./Components/Home";
import Games from "./Components/Games";
import Feed from "./Components/Feed";
import Chat from "./Components/Chat";
import Books from "./Components/Books";

import ToShow from './Components/ToShow';
import ChatDescription from './Components/Chat_component/ChatDescription';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './userauth/FireAuth';

function App() { 
  const [showmyaccount, setshowmyaccount] = useState(null);
  const[id,setid]=useState('');
 
  const[username,setusername]=useState('');

  const [showfriendrequest, setshowfriendrequest] = useState(false);
  const [showsearchlist, setshowsearchlist] = useState(false);
  const [showavatar, setshowavatar] = useState(false);
  const [showfriends, setshowfriends] = useState(false);
  const[showmyprofile,setshowmyprofile]=useState(false);

 
  const [archieveview, setarchieveview] = useState(false);
  const [searchopen, setsearchopen] = useState(null);
  const [searchinput, setsearchinput] = useState('');
  const [chatid, setchatid] = useState(null);
  const [isloading, setisloading] = useState(false);
  const [sendrecid, setsendrecid] = useState(null);
  const [showchatdesc, setshowchatdesc] = useState(false);
  const [arraynames, setarraynames] = useState([]);
  const[status,setstatus]=useState('offline');
  const [descname, setdescname] = useState(null);
  const [bio, setbio] = useState(null);
  const[uid,setuid]=useState(null);
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
 const[locuser,setlocuser]=useState( localStorage.getItem('user'))
 useEffect(() => {
  
if(locuser){
checker(true,locuser);}
  
 }, [locuser]);
  const location = useLocation();
  const [loggedin, setloggedin] = useState(false);


  function checker(id,uid){
    setloggedin(id);
    setuid(uid);



  }


  return(
    
   <>
   <div className='d-flex flex-column' style={{width:'100vw',height:'100vh'}}>
   <div classNamw="d-flex flex-column mx- position-sticky">
   <Navbar loggedin={loggedin} checker={checker} uid={uid} />
  </div>
   
  <div className='d-flex' style={{flex:1,contain:'strict'}}>
  
    <Routes>  
      <Route exact path="/" element={<Login checker={checker} key={location.key}/>}/>
      {loggedin && <Route  exact path="home" element={<Home key={location.key}/>}   />}
      {loggedin && <Route exact path="movies" element={<Movies key={location.key}/>}  />}
      {loggedin && <Route exact path="books" element={<Books key={location.key}/>} /> }
      {loggedin &&<Route exact path="books" element={<Books key={location.key}/>}/> }
      {loggedin && <Route exact path="games" element={<Games key={location.key}/>}  />}
      {loggedin && <Route exact path="feed" element={<Feed key={location.key}/>}  />}
      {loggedin && arraynames.length &&
      
      <Route  path="chat">

     
      
      <Route  path="" element={<Chat {...{uid,setshowmyaccount,showmyaccount,id,setid,username,setusername,showfriendrequest,setshowfriendrequest,showsearchlist,setshowsearchlist,showavatar,setshowavatar,showfriends,setshowfriends,showmyprofile,setshowmyprofile,archieveview,setarchieveview,searchopen,setsearchopen,searchinput,setsearchinput,chatid,setchatid,sendrecid,setsendrecid,showchatdesc,setshowchatdesc,arraynames,setarraynames,status,setstatus,descname,setdescname,bio,setbio,isloading,setisloading}}/>}>
         <Route path=':hey'>   
        <Route path="" element={    <ChatDescription
              
              descname={descname}
              bio={bio}
              key={descname}
              messageid={sendrecid}
              uid={uid}
              chatid={chatid}
              setshowmyaccount={setshowmyaccount}
            />}/>
  </Route>
  </Route>
        </Route>
      
      
      
      }
      {!loggedin && <Route exact path="home" element={<Home/>} />}
      {!loggedin && <Route exact path="movies" element={<ToShow/>}/>}
      {!loggedin && <Route exact path="books" element={<ToShow/>}/> }
      {!loggedin &&<Route exact path="books" element={<ToShow/>}/> }
      {!loggedin && <Route exact path="games" element={<ToShow/>}/>}
      {!loggedin && <Route exact path="feed" element={<ToShow/>}/>}
      {!loggedin && <Route exact path="chat" element={<ToShow/>}/> }

      
        
      
       
     
      
    </Routes>
    </div>
    </div>
    </>
    
  )
}
export default App;
