import './App.css'
import Navbar from "./Components/Navbar";
import Login from "./userauth/login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Movies from "./Components/Movies";
import Home from "./Components/Home";
import Games from "./Components/Games";
function App() { 
<<<<<<< HEAD
  const location = useLocation();
  const [loggedin, setloggedin] = useState(false);
  const[uid,setuid]=useState(null);
  function checker(id,uid){
    setloggedin(id);
    setuid(uid);
=======
  const [loggedin, setloggedin] = useState(false);

  function checker(id){
    setloggedin(id);



  }


>>>>>>> parent of 7ab1c9d (hey)
  return(
    <BrowserRouter>
    <Navbar loggedin={loggedin} checker={checker} />
    <Routes>  
<<<<<<< HEAD
      <Route exact path="/" element={<Login checker={checker} key={location.key}/>}/>
      {loggedin && <Route  exact path="home" element={<Home key={location.key}/>}   />}
      {loggedin && <Route exact path="movies" element={<Movies key={location.key}/>}  />}
      {loggedin && <Route exact path="books" element={<Books key={location.key}/>} /> }
      {loggedin &&<Route exact path="books" element={<Books key={location.key}/>}/> }
      {loggedin && <Route exact path="games" element={<Games key={location.key}/>}  />}
      {loggedin && <Route exact path="feed" element={<Feed key={location.key}/>}  />}
      {loggedin && <Route exact path="chat" element={<Chat uid={uid}  key={location.key}/>}/> }
      {!loggedin && <Route exact path="home" element={<Home/>} />}
      {!loggedin && <Route exact path="movies" element={<ToShow/>}/>}
      {!loggedin && <Route exact path="books" element={<ToShow/>}/> }
      {!loggedin &&<Route exact path="books" element={<ToShow/>}/> }
      {!loggedin && <Route exact path="games" element={<ToShow/>}/>}
      {!loggedin && <Route exact path="feed" element={<ToShow/>}/>}
      {!loggedin && <Route exact path="chat" element={<ToShow/>}/> }
=======
      <Route path="/" element={<Login checker={checker}/>}/>
      {loggedin && <Route path="home" element={<Home/>} />}
      {loggedin && <Route path="movies" element={<Movies/>}/>}
      {loggedin && <Route path="books" element={<Books/>}/> }
      {loggedin &&<Route path="books" element={<Books/>}/> }
      {loggedin && <Route path="games" element={<Games/>}/>}
      {loggedin && <Route path="feed" element={<Feed/>}/>}
      {!loggedin && <Route path="chat" element={<Chat/>}/> }
      {!loggedin && <Route path="home" element={<Home/>} />}
      {!loggedin && <Route path="movies" element={<ToShow/>}/>}
      {!loggedin && <Route path="books" element={<ToShow/>}/> }
      {!loggedin &&<Route path="books" element={<ToShow/>}/> }
      {!loggedin && <Route path="games" element={<ToShow/>}/>}
      {!loggedin && <Route path="feed" element={<ToShow/>}/>}
      {!loggedin && <Route path="chat" element={<ToShow/>}/> }

>>>>>>> parent of 7ab1c9d (hey)
      
        
     
      
    </Routes>
  </BrowserRouter>  
  )
}
export default App;