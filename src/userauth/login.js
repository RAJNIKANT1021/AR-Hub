import React, { useId } from 'react'
import './login.css' 
import {RiEyeFill} from 'react-icons/ri'
import {RiEyeCloseFill} from 'react-icons/ri'
import { createUserWithEmailAndPassword,signInWithEmailAndPassword } from 'firebase/auth'
import {auth,db} from './FireAuth';
import {useNavigate } from "react-router-dom";
import {doc, setDoc,getDoc,updateDoc} from "firebase/firestore";
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
    }
    await setDoc(doc(db, "A2B_USERS","Users") ,{
     [count]:uid
    }, { merge: true });

    await setDoc(doc(db, "searchList","Users") ,{
      [count]:{
      'uid':uid,
      name:Name,
      
      }
     }, { merge: true });

 
   
    await setDoc(doc(db, "A2B_USERS","Users",'usersdetails',"details"),{
   
    [uid]:{
    name:Name,
    email: Email,
      Bio: "hey i am using A2b",
      uid:uid,
      status:'online',
      friends:[],
      blocklist:[],
      Avatar:"https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740&t=st=1679001679~exp=1679002279~hmac=c53ea30da094c90d0bae1bf703599d8572b711d931d2bbe519571eae87eb5a23"
    

    }

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
     
       if(localStorage.getItem('user')){
        localStorage.removeItem('user')
       }
        
       localStorage.setItem('user', user.uid)
 
  createChat(Name,Email,user.uid)
  checker(true,user.uid);
    }
    
    ).catch((error)=>{
     
      alert(error)
    })
  }
  const changestatus = async (uid) => {
    const userstat = doc(db, "A2B_USERS", "Users", "usersdetails", "details");
    const updates = {};
    updates[uid + ".status"] = "online";
    await updateDoc(userstat, updates);
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
    if(localStorage.getItem('user')){
      const Email= document.getElementById('username').value;
   
      const Password=document.getElementById('password').value;
      signInWithEmailAndPassword(auth, Email, Password)
    .then((userCredential) => {
      navigate("/home")
      // createChat("heyy",Email);
      const user = userCredential.user;
      changestatus(user.uid);
      checker(true,user.uid);
    
    
    })
    
      
      // createChat("heyy",Email);
    
      
      
     

    }else{
    const Email= document.getElementById('username').value;
   
    const Password=document.getElementById('password').value;
    signInWithEmailAndPassword(auth, Email, Password)
  .then((userCredential) => {
    navigate("/home")
    // createChat("heyy",Email);
    const user = userCredential.user;
    localStorage.setItem('user',user.uid);
    changestatus(user.uid)
    checker(true,user.uid);

    //ggt
    // ...
  })
  .catch((error) => {
    const errorMessage = error.message;
    alert(errorMessage)
  });
    }
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