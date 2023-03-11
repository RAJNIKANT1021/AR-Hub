import React from 'react'
import './login.css' 
import {RiEyeFill} from 'react-icons/ri'
import {RiEyeCloseFill} from 'react-icons/ri'
function Login() {
  return (<div className='flex space-evenly'>

  <div className="background">
  <div className="shape"></div>
  <div className="shape"></div>
</div>

 
<form className='form_login'>
  <label htmlFor="username" style={{color:'white'}}>Username</label>
  <input className='input_login' type="text" placeholder="Email or Phone" id="username"/>

  <label htmlFor="password" style={{color:'white'}}>Password</label>
  <div className='d-flex'>
  <input className='input_login'type="password" placeholder="Password" id="password" />
  <RiEyeCloseFill  className="icon" id="close" onClick={()=>{
    document.getElementById('close').style.display = "none";
    document.getElementById('open').style.display="flex";
    document.getElementById('password').type = "";


  }} style={{
    position:'absolute',
    right:0,
    fontSize:27,
    marginRight:'46px',
    marginTop:'18px'
    
 }}/>
    <RiEyeFill  className="icon" id="open" onClick={()=>{
    document.getElementById('close').style.display = "flex";
    document.getElementById('open').style.display="none";
    document.getElementById('password').type = "password";


  }}  style={{
         display:"none",
    position:'absolute',
    right:0,
    fontSize:27,
    marginRight:'46px',
    marginTop:'18px',
   
    
 }}/>


  </div>
<div className="flex my-3">
<button className='btn btn-primary buttonlogin'>Log In</button>   
  <button className='btn btn-primary  buttonlogin'>Sign Up</button> 
</div>

  
  </form>
  </div>
  )
}

export default Login;