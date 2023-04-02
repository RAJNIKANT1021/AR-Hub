import React from 'react'
import './login.css' 
import {RiEyeFill} from 'react-icons/ri'
import {RiEyeCloseFill} from 'react-icons/ri'
import { createUserWithEmailAndPassword,signInWithEmailAndPassword } from 'firebase/auth'
import {auth,db} from './FireAuth';
import {useNavigate } from "react-router-dom";
import {doc, setDoc,getDoc} from "firebase/firestore";
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

 
   
    await setDoc(doc(db, "A2B_USERS","Users",'usersdetails',"details"),{
   
    [uid]:{
    name:Name,
    email: Email,
      Bio: "hey i am using A2b",
      uid:uid,
    

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
    // createChat("heyy",Email);
    const user = userCredential.user;
   
    checker(true,user.uid);
    
    // ...
  })
  .catch((error) => {
    const errorMessage = error.message;
    alert(errorMessage)
  });

  }
  return(
    <>
    

    <div className='d-flex flex-column' style={{flex:1,justifyContent:'center'}}>
      <div className="d-flex flex-column crt" style={{height:'35vh',marginLeft:'4.7vw',width:'max-content'}}>
        <div className='mb-2' style={{fontSize:'1.3rem',color:'white'}}>START FOR FREE</div>
        <div className='d-flex flex-row mb-3'style={{fontSize:'2.4rem',color:'white',fontWeight:700}}>Create new account <div className='ml-1' style={{color:'blue'}}>.</div></div>
        <div className='mb-3' style={{fontSize:'1.3rem',color:'white'}}>Already A Member? <a className='handy22'style={{color:'blue'}}>Log In</a></div>
        <div className='d-flex flex-wrap' style={{alignItems:'center'}}>
          <div className='d-flex mr-4' style={{backgroundColor:'#323644',borderRadius:'12px',height:'8vh',alignItems:'center'}}>
            {/* firstname */}
          <div className='d-flex' style={{position:'relative',alignItems:'center'}}>
              <div className='d-flex pl-2 mt-1 mx-2 gry' id='logg' style={{position:'absolute',zIndex:50}}>
                First Name
              </div>

            <input className='d-flex flex-row pl-3 pt-1 px-2 onff' type="text" tabIndex={112345321} onBlur={(e)=>{if(e.target.value.length===0){document.getElementById('logg').classList.remove("animo");document.getElementById('logg').classList.add("gry")} }} onFocus={(e)=>{document.getElementById('logg').classList.remove("gry");document.getElementById('logg').classList.add("animo")}} style={{flex:1,position:'relative',backgroundColor:'transparent ',color:'white',borderRadius:'12px',borderWidth:'1px',borderColor:'transparent',zIndex:100}}/>


            </div>

          </div>
          <div className='d-flex' style={{position:'relative',backgroundColor:'#323644',borderRadius:'12px',height:'8vh',alignItems:'center'}}>
        
              <div className='pl-2 mt-1 mx-2 gry' id='logge' style={{position:'absolute',zIndex:50}}>
                Last Name
              </div>

              <input className='d-flex flex-row pl-3 pt-1 px-2 onff' type="text" tabIndex={112345321} onBlur={(e)=>{if(e.target.value.length===0){document.getElementById('logge').classList.remove("animo");document.getElementById('logge').classList.add("gry")} }} onFocus={(e)=>{document.getElementById('logge').classList.remove("gry");document.getElementById('logge').classList.add("animo")}} style={{flex:1,position:'relative',backgroundColor:'transparent ',color:'white',borderRadius:'12px',borderWidth:'1px',borderColor:'transparent',zIndex:100}}/>


            

          </div>
            {/* lastname */}
            

        

        </div>
        <div>
        <div className='d-flex my-3' style={{position:'relative',backgroundColor:'#323644',borderRadius:'12px',height:'8vh',alignItems:'center'}}>
          
              <div className='pl-2 mt-1 mx-2 gry' id='loggein' style={{position:'absolute',zIndex:50}}>
                Email
              </div>

              <input className='d-flex flex-row pl-3 pt-1 px-2 onff' type="text" tabIndex={112345321} onBlur={(e)=>{if(e.target.value.length===0){document.getElementById('loggein').classList.remove("animo");document.getElementById('loggein').classList.add("gry")} }} onFocus={(e)=>{document.getElementById('loggein').classList.remove("gry");document.getElementById('loggein').classList.add("animo")}} style={{flex:1,position:'relative',backgroundColor:'transparent ',color:'white',borderRadius:'12px',borderWidth:'1px',borderColor:'transparent',zIndex:100}}/>


        

          </div>
          <div className='d-flex my-3' style={{position:'relative',backgroundColor:'#323644',borderRadius:'12px',height:'8vh',alignItems:'center'}}>
          
              <div className='pl-2 mt-1 mx-2 gry' id='loggenp' style={{position:'absolute',zIndex:50}}>
              Password
              </div>

              <input className='d-flex flex-row pl-3 pt-1 px-2 onff' type="password" tabIndex={112345321} onBlur={(e)=>{if(e.target.value.length===0){document.getElementById('loggenp').classList.remove("animo");document.getElementById('loggenp').classList.add("gry")} }} onFocus={(e)=>{document.getElementById('loggenp').classList.remove("gry");document.getElementById('loggenp').classList.add("animo")}} style={{flex:1,position:'relative',backgroundColor:'transparent ',color:'white',borderRadius:'12px',borderWidth:'1px',borderColor:'transparent',zIndex:100}}/>


            </div>

      
        </div>

       <div className='d-flex flex-row mt-3'>
<div className='d-flex px-4 py-3 handy22' style={{justifyContent:'center',backgroundColor:'#555b69',color:'white',fontSize:'1.1rem',borderRadius:'1rem',width:'47%'}}>
    Change method
  </div>  
  <div style={{flex:1}}>

  </div>
  <div className='d-flex px-4 py-3 handy22' style={{justifyContent:'center', backgroundColor:'#1d90f5',color:'white',fontSize:'1.1rem',borderRadius:'1rem',width:'47%'}}>
    Create account

  </div>
    </div>
    </div>
   
    </div>
    </>
  )
}

export default Login;