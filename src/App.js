import React ,{useState}from "react";
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
function App() { 
  return(
    <BrowserRouter>
    <Navbar/>
    <Routes>  
      <Route path="login" element={<Login/>}/>
      <Route path="home" element={<Home/>} />
      <Route path="movies" element={<Movies/>}/>
      <Route path="books" element={<Books/>}/>
      <Route path="games" element={<Games/>}/>
      <Route path="feed" element={<Feed/>}/>
      <Route path="chat" element={<Chat/>}/>
    </Routes>
  </BrowserRouter>  
  )
}
export default App;
