import React from 'react'
import './navbar.css'
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@mui/material';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../userauth/FireAuth';

function Navbar({loggedin,checker,uid}) {
  const Navigate=useNavigate();

  const logout =async()=>{


      const userstat = doc(db, "A2B_USERS", "Users", "usersdetails", "details");
      const updates = {};
      updates[uid + ".status"] = "offline";
      await updateDoc(userstat, updates);
      localStorage.removeItem('user');
    
    checker(false,null);
    Navigate('/');
  }
 

  
  
  return (   
<nav className="flex navbar navbar-expand-lg navbar-dark navbar-default" style={{position:'sticky'}}>
  <Link className="navbar-brand" to="#">A2R HUB</Link>
  <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <span className="navbar-toggler-icon"></span>
  </button>

  <div className="collapse navbar-collapse" id="navbarSupportedContent">
    <ul className="navbar-nav mr-auto">
      <li className="nav-item">
        <Link className="nav-link" to="/home" data-toggle="collapse" data-target=".navbar-collapse.show">Home</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/movies" data-toggle="collapse" data-target=".navbar-collapse.show">Movies</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/books" data-toggle="collapse" data-target=".navbar-collapse.show">Books</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/games" data-toggle="collapse" data-target=".navbar-collapse.show">Games</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/feed" data-toggle="collapse" data-target=".navbar-collapse.show">Feed</Link>
      </li>
      <li className="nav-item">
        <Link className="nav-link" to="/chat" data-toggle="collapse" data-target=".navbar-collapse.show">
          <Badge badgeContent={4} color="secondary">Chat</Badge>
        </Link>
      </li>
      <li className="nav-item dropdown">
        <Link className="nav-link dropdown-toggle" to="hello" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-toggle="collapse" data-target=".navbar-collapse.show">
          Dropdown
        </Link>
        <div className="dropdown-menu" aria-labelledby="navbarDropdown">
          <Link className="dropdown-item" to="/">Login</Link>
          <Link className="dropdown-item" to="#">Another action</Link>
          <div className="dropdown-divider"></div>
          <Link className="dropdown-item" to="#">Something else here</Link>
        </div>
      </li>
    </ul>
    <div className="form-inline my-2 my-lg-0">
      <input className="searchbar form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search"/>
      <button className="btn btn-primary my-2 my-sm-0" style={{color:"white"}} type="submit">Search</button>
    </div>
    {!loggedin && 
      <Link to="/" style={{textDecoration:'none', color:'white'}}>
        <button className="btn btn-primary my-2 my-sm-0 mx-2" style={{color:"white"}} type="submit" data-toggle="collapse" data-target=".navbar-collapse.show">Login</button>
      </Link>
    } 
    {loggedin && 
      <button className="btn btn-primary my-2 my-sm-0 mx-2" style={{color:"white"}} type="submit" onClick={()=>{logout()}} data-toggle="collapse" data-target=".navbar-collapse.show">Logout</button>
    }
  </div>
</nav>
    
  )
}

export default Navbar;