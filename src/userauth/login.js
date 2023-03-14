import React from 'react'
import './login.css' 
import {RiEyeFill} from 'react-icons/ri'
import {RiEyeCloseFill} from 'react-icons/ri'
import { createUserWithEmailAndPassword,signInWithEmailAndPassword } from 'firebase/auth'
import {auth,db} from './FireAuth';
import {useNavigate } from "react-router-dom";
import { collection, doc, setDoc,getDoc, addDoc } from "firebase/firestore";
function Login({checker}) {
  const navigate = useNavigate();
  
  

  const createChat=async(Name,Email,uid)=>{
    const docRef = doc(db, "A2B_USERS",'Users')
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
     var myObject=docSnap.data()
     var count = Object.keys(myObject).length+1;
     console.log(count)
    } else {
      // doc.data() will be undefined in this case
    count=1;
      console.log("No such document!");
    }

   
    await setDoc(doc(db, "A2B_USERS","Users",uid,'displayname') ,{
      name: Name,
      email: Email,
      Bio: "hey i am using A2b"
    });
    await setDoc(doc(db, "A2B_USERS","Users"), {
      [count]:uid
  }, { merge: true })
   
  
  
  }
  const  handleclick=async()=>{
    const Email= document.getElementById('username').value;
    const Name= document.getElementById('name').value;
    const Password=document.getElementById('password').value;
    console.log({Email,Password})
   

    createUserWithEmailAndPassword(auth,Email,Password).then((userCredential)=>{
    navigate("/home")
    const user = userCredential.user;
 

  
    
       user.displayName=Name;
     
       
        
      
 
  createChat(Name,Email,user.uid)
  checker(true,user.uid);
    }
    
    ).catch((error)=>{
     
      alert(error)
    })
  }
  const handlelogin =async()=>{
    // const docRef = doc(db, "A2B_USERS",'Users')
    // const docSnap = await getDoc(docRef);
    // if (docSnap.exists()) {
    //  var myObject=docSnap.data()
    //  var count = Object.keys(myObject).length+1;
    //  console.log(count)
    // } else {
    //   // doc.data() will be undefined in this case
    
    //   console.log("No such document!");
    // }
    const Email= document.getElementById('username').value;
   
    const Password=document.getElementById('password').value;
    signInWithEmailAndPassword(auth, Email, Password)
  .then((userCredential) => {
    navigate("/home")
    createChat("heyy",Email);
    const user = userCredential.user;
   
    checker(true,user.uid);
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    alert(errorMessage)
  });

  }
  return (<div className='flex space-evenly'>

  <div className="background">
  <div className="shape"></div>
  <div className="shape"></div>
</div>

 
<div className='form_login'>
  <label htmlFor="username" style={{color:'white'}}>Username</label>
  <input className='input_login' type="text" placeholder="Display Name" id="name"  />
  <label htmlFor="username" style={{color:'white'}}>Email</label>
  <input className='input_login' type="text" placeholder="Email or Phone" id="username"  />

  <label htmlFor="password"  style={{color:'white'}}> Password</label>
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
<button className='btn btn-primary buttonlogin' onClick={()=>{handlelogin()}}>Log In</button>   
  <button className='btn btn-primary  buttonlogin' onClick={()=>{handleclick()}}>Sign Up</button> 
</div>

  
  </div>
  </div>
  )
}

export default Login;