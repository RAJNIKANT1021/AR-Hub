import React from 'react'
import './navbar.css'
function Navbar() {
  return (
    
 <nav class="navbar navbar-expand-lg navbar-dark fixed-top "  >
  <a class="navbar-brand" href="#">AR HUB</a>
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>

  <div class="collapse navbar-collapse" id="navbarSupportedContent">
    <ul class="navbar-nav mr-auto">
      <li class="nav-item">
        <a class="nav-link" href="#">Home <span class="sr-only">(current)</span></a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#">Movies </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#">Books</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#">Games </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#">Feed</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="#">Chat</a>
      </li>
      <li class="nav-item dropdown">
        <a class="nav-link dropdown-toggle" href="hello" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Dropdown
        </a>
        <div class="dropdown-menu" aria-labelledby="navbarDropdown">
          <a class="dropdown-item" href="#">Action</a>
          <a class="dropdown-item" href="#">Another action</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="#">Something else here</a>
        </div>
      </li>
      
    </ul>
    <form class="form-inline my-2 my-lg-0">
      <input class="searchbar form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search"/>
      <button class="btn btn-primary my-2 my-sm-0 " style={{color:"white"}}type="submit">Search</button>
    </form>
    <button class="btn btn-primary my-2 my-sm-0 mx-2" style={{color:"white"}}type="submit">Logout</button>
  
  </div>
</nav>
    
  )
}

export default Navbar