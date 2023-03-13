import React ,{useContext}from 'react'
import './navbar.css'
import { Link, Navigate, useNavigate } from 'react-router-dom';
import LoginContext from '../Context/LoginContext';

function Navbar({loggedin,checker}) {
  const Navigate=useNavigate();

  const logout =()=>{
    checker(false);
    Navigate('/');
  }
 

  
  
  return (   
 <nav className="flex navbar navbar-expand-lg navbar-dark navbar-default">
  <Link  className="navbar-brand" to="#">A2R HUB</Link >
  <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <span className="navbar-toggler-icon"></span>
  </button>

  <div className="collapse navbar-collapse" id="navbarSupportedContent">
    <ul className="navbar-nav mr-auto">
      <li className="nav-item">
        <Link  className="nav-link" to="/home">Home <span className="sr-only">(current)</span></Link >
      </li>
      <li className="nav-item">
        <Link  className="nav-link" to="/movies">Movies </Link >
      </li>
      <li className="nav-item">
        <Link  className="nav-link" to="/books">Books</Link >
      </li>
      <li className="nav-item">
        <Link  className="nav-link" to="/games">Games </Link >
      </li>
      <li className="nav-item">
        <Link  className="nav-link" to="/feed">Feed</Link >
      </li>
      <li className="nav-item">
        <Link  className="nav-link" to="/chat">Chat</Link >
      </li>
      <li className="nav-item dropdown">
        <Link  className="nav-link dropdown-toggle" to="hello" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Dropdown
        </Link >
        <div className="dropdown-menu" aria-labelledby="navbarDropdown">
          <Link  className="dropdown-item" to="/">Login</Link >
          <Link  className="dropdown-item" to="#">Another action</Link >
          <div className="dropdown-divider"></div>
          <Link  className="dropdown-item" to="#">Something else here</Link >
        </div>
      </li>
      
    </ul>
    <div className="form-inline my-2 my-lg-0">
      <input className="searchbar form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search"/>
      <button className="btn btn-primary my-2 my-sm-0 " style={{color:"white"}}type="submit">Search</button>
    </div>
   {!loggedin && 
    <Link to="/" style={{
        textDecoration:'none',
        color:'white'
      }}>
        <button className="  btn btn-primary my-2 my-sm-0 mx-2" style={{color:"white"}}type="submit">Login</button>
      
        </Link>
      
    
        
      
  } 
    {loggedin && <button className="  btn btn-primary my-2 my-sm-0 mx-2" style={{color:"white"}}type="submit" onClick={()=>{logout()}}>
   
      Logout
      
      
    
        
      
    </button> }
  
  </div>
</nav>
    
  )
}

export default Navbar;