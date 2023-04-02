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

function App() { 
 const[locuser,setlocuser]=useState( localStorage.getItem('user'))
 useEffect(() => {
  
if(locuser){
checker(true,locuser);}
  
 }, [locuser]);
  const location = useLocation();
  const [loggedin, setloggedin] = useState(false);
  const[uid,setuid]=useState(null);

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
      {loggedin && <Route exact path="chat" element={<Chat uid={uid}  key={location.key}/>}/> }
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
