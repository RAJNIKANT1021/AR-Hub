import React from "react";
import LoginContext from "./LoginContext";
import { useState } from "react";
const LoginState=(props)=>{

    const[logincheck,setlogincheck]=useState('false');
   

    return(
        <LoginContext.Provider value={{logincheck}}>
            {props.children}
        </LoginContext.Provider>
    )

}
export default LoginState;