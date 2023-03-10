import React from 'react'
import './login.css' 
import {RiEyeFill} from 'react-icons/ri'
import {RiEyeCloseFill} from 'react-icons/ri'
function Login() {
  return (<>

  <div class="background">
  <div class="shape"></div>
  <div class="shape"></div>
</div>

  <h3>Login Here</h3>
<form>
  <label for="username">Username</label>
  <input type="text" placeholder="Email or Phone" id="username"/>

  <label for="password">Password</label>
  <div className='d-flex'>
  <input type="password" placeholder="Password" id="password" />
  <RiEyeCloseFill  className="icon" id="close"  style={{
    position:'absolute',
    right:0,
    fontSize:27,
    marginRight:'46px',
    marginTop:'18px'

 }}/>
    


  </div>

  <button>Log In</button>   
  <div class="social">
    <div class="go"><i class="fab fa-google"></i>  Google</div>
    <div class="fb"><i class="fab fa-facebook"></i>  Facebook</div>
  </div>
  </form>
</>
  )
}

export default Login;