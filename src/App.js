import React ,{useContext,useState}from 'react'
import './App.css'
import Navbar from "./Components/Navbar";
import Login from "./userauth/login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Movies from "./Components/Movies";
import Home from "./Components/Home";
import Games from "./Components/Games";
import Feed from "./Components/Feed";
import Chat from "./Components/Chat";
import Books from "./Components/Books";
import LoginContext from './Context/LoginContext';
import ToShow from './Components/ToShow';


function App() { 
  const [loggedin, setloggedin] = useState(false);

  function checker(id){
    setloggedin(id);



  }


  return(
    <BrowserRouter>
    <Navbar loggedin={loggedin} checker={checker} />
    <Routes>  
      <Route path="/" element={<Login checker={checker}/>}/>
      {loggedin && <Route path="home" element={<Home/>} />}
      {!loggedin && <Route path="movies" element={<Movies/>}/>}
      {loggedin && <Route path="books" element={<Books/>}/> }
      {loggedin &&<Route path="books" element={<Books/>}/> }
      {loggedin && <Route path="games" element={<Games/>}/>}
      {loggedin && <Route path="feed" element={<Feed/>}/>}
      {loggedin && <Route path="chat" element={<Chat/>}/> }
      {!loggedin && <Route path="home" element={<Home/>} />}
      {loggedin && <Route path="movies" element={<ToShow/>}/>}
      {!loggedin && <Route path="books" element={<ToShow/>}/> }
      {!loggedin &&<Route path="books" element={<ToShow/>}/> }
      {!loggedin && <Route path="games" element={<ToShow/>}/>}
      {!loggedin && <Route path="feed" element={<ToShow/>}/>}
      {!loggedin && <Route path="chat" element={<ToShow/>}/> }

      
        
      
       
     
      
    </Routes>
  </BrowserRouter>  
  )
}
export default App;
