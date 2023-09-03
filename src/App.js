import React, { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./Components/Navbar";
import Login from "./userauth/login";
import { Routes, Route, useLocation } from "react-router-dom";
import Movies from "./Components/Movies";
import Home from "./Components/Home";
import Games from "./Components/Games";
import Feed from "./Components/Feed";
import Chat from "./Components/Chat";
import Books from "./Components/Books";

import ToShow from "./Components/ToShow";
import ChatDescription from "./Components/Chat_component/ChatDescription";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./userauth/FireAuth";
import Myprofile from "./Components/Chat_component/Myprofile";
import Myavatar from "./Components/Myavatar";
import FriendsList from "./Components/Chat_component/FriendsList";
import FriendRequest from "./Components/FriendRequest";
import SearchList from "./Components/Chat_component/SearchList";

function App() {
  const [showmyaccount, setshowmyaccount] = useState(null);
  const [id, setid] = useState("");

  const [username, setusername] = useState("");

  const [showfriendrequest, setshowfriendrequest] = useState(false);
  const [showsearchlist, setshowsearchlist] = useState(false);
  const [showavatar, setshowavatar] = useState(false);
  const [showfriends, setshowfriends] = useState(false);
  const [showmyprofile, setshowmyprofile] = useState(false);

  const [archieveview, setarchieveview] = useState(false);
  const [searchopen, setsearchopen] = useState(null);
  const [searchinput, setsearchinput] = useState("");
  const [chatid, setchatid] = useState(null);
  const [isloading, setisloading] = useState(false);
  const [sendrecid, setsendrecid] = useState(null);
  const [showchatdesc, setshowchatdesc] = useState(false);
  const [arraynames, setarraynames] = useState([]);
  const [status, setstatus] = useState("offline");
  const [descname, setdescname] = useState(null);
  const [bio, setbio] = useState(null);
  const [uid, setuid] = useState(null);
  const[loggeduser,setloggeduser]=useState({});
  const [containerHeight, setContainerHeight] = useState(window.innerHeight);
const[avtrurl,setavtrurl]=useState('');
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleResize = () => {
    setContainerHeight(window.innerHeight);
  };

  useEffect(() => {
    setisloading(true);
    const unsub = onSnapshot(
      doc(db, "A2B_USERS", "Users", "usersdetails", "details"),
      (doc) => {
        const arraynamed = [];
        const detail = doc.data();

        for (const key in detail) {
          if (detail.hasOwnProperty(key)) {
            if (key === uid) {
              const us = detail[key];
              setloggeduser(us);
              setusername(us.name);
            }
            if (key !== uid) {
              const us = detail[key];
      console.log(us.Avatar);
              arraynamed.push({
                name: us.name,
                bio: us.Bio,
                uid: key,
                status: us.status,
                avatar:us.Avatar,
              });
            }
          }
        }
        setarraynames(arraynamed);
        setisloading(false);
      }
    );

    return () => {
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);
  const [locuser, setlocuser] = useState(localStorage.getItem("user"));
  useEffect(() => {
    if (locuser) {
      checker(true, locuser);
    }
  }, [locuser]);
  const location = useLocation();
  const [loggedin, setloggedin] = useState(false);

  function checker(id, uid) {
   
    const unsub = onSnapshot(
      doc(db, "A2B_USERS", "Users", "usersdetails", "details"),
      (doc) => {
        
        const detail = doc.data();
let checks=true;
        for (const key in detail) {
          if (detail.hasOwnProperty(key)) {
            if (key === uid) {
              const us = detail[key];
               setloggedin(id);
              setuid(uid);
checks=false;
            }

            
          }}
          if(checks===true){
            localStorage.removeItem('user');
            setloggedin(false);

          }
        
        })
          
  }
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const heightDifference =
        window.innerHeight - document.documentElement.clientHeight;
      setKeyboardHeight(heightDifference > 0 ? heightDifference : 0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <div
        className="d-flex flex-column"
        style={{
          flex: 1,
          overflow: keyboardHeight > 0 ? "auto" : "hidden",
          height: `calc(100vh - ${keyboardHeight}px)`,
        }}
      >
        <div
          className="d-flex flex-column"
          style={{ width: "100vw", height: "100vh", contain: "strict" }}
        >
          <div
            classNamw="d-flex flex-column mx- position-sticky"
            style={{ position: "sticky" }}
          >
            <Navbar loggedin={loggedin} checker={checker} uid={uid} />
          </div>

          <div className="d-flex" style={{ flex: 1, contain: "strict" }}>
            <Routes>
              <Route
                exact
                path="/"
                element={<Login checker={checker} key={location.key} />}
              />
              {/* {loggedin && (
                <Route
                  exact
                  path="home"
                  element={<Home key={location.key} />}
                />
              )} */}
              {/* {loggedin && (
                <Route
                  exact
                  path="movies"
                  element={<Movies key={location.key} />}
                />
              )} */}
              {/* {loggedin && (
                <Route
                  exact
                  path="books"
                  element={<Books key={location.key} />}
                />
              )} */}
              {/* {loggedin && (
                <Route
                  exact
                  path="books"
                  element={<Books key={location.key} />}
                />
              )} */}
              {loggedin && (
                <Route
                  exact
                  path="weather"
                  element={<Games key={location.key} />}
                />
              )}
              {loggedin && (
                <Route
                  exact
                  path="feed"
                  element={<Feed key={location.key} />}
                />
              )}
              {loggedin && arraynames.length && (
                <Route path="chat">
                  <Route
                    path=""
                    element={
                      <Chat
                        {...{
                          uid,
                          setshowmyaccount,
                          showmyaccount,
                          id,
                          setid,
                          username,
                          setusername,
                          showfriendrequest,
                          setshowfriendrequest,
                          showsearchlist,
                          setshowsearchlist,
                          showavatar,
                          setshowavatar,
                          showfriends,
                          setshowfriends,
                          showmyprofile,
                          setshowmyprofile,
                          archieveview,
                          setarchieveview,
                          searchopen,
                          setsearchopen,
                          searchinput,
                          setsearchinput,
                          chatid,
                          setchatid,
                          sendrecid,
                          setsendrecid,
                          showchatdesc,
                          setshowchatdesc,
                          arraynames,
                          setarraynames,
                          status,
                          setstatus,
                          descname,
                          setdescname,
                          bio,
                          setbio,
                          isloading,
                          setisloading,
                          loggeduser,
                          setavtrurl
                        }}
                      />
                    }
                  >
                    <Route path=":hey">
                      <Route
                        path=""
                        element={
                          <ChatDescription
                            descname={descname}
                            bio={bio}
                            key={descname}
                            messageid={sendrecid}
                            uid={uid}
                            chatid={chatid}
                            setshowmyaccount={setshowmyaccount}
                            avtrurl={avtrurl}
                            
                          />
                        }
                      />
                    </Route>
                    <Route path="userprofile">
                      <Route path="" element={<Myprofile setshowmyprofile={setshowmyprofile } loggeduser={loggeduser}/>}/>
                    

                    </Route>
                    <Route path="setavatar">
                    <Route path="" element={<Myavatar setshowavatar={setshowavatar} loggeduser={loggeduser}/>}/>
                    </Route>
                    <Route path="myfriends">
                    <Route path="" element={ <FriendsList setshowfriends={setshowfriends}/>} loggeduser={loggeduser}/>
                    </Route>
                    <Route path="friendrequests">
                    <Route path="" element={<FriendRequest setshowfriendrequest={setshowfriendrequest} loggeduser={loggeduser}/>}/>
                    </Route>
                    <Route path="search">
                    <Route path="" element={<SearchList searchinput={searchinput} uid={uid} loggeduser={loggeduser}/>}/>
                    </Route>
                  </Route>
                </Route>
              )}
              {/* {!loggedin && <Route exact path="home" element={<Home />} />} */}
              {/* {!loggedin && <Route exact path="movies" element={<ToShow />} />}
              {!loggedin && <Route exact path="books" element={<ToShow />} />}
              {!loggedin && <Route exact path="books" element={<ToShow />} />} */}
              {!loggedin && <Route exact path="weather" element={<ToShow />} />}
              {!loggedin && <Route exact path="feed" element={<ToShow />} />}
              {!loggedin && <Route exact path="chat" element={<ToShow />} />}
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
}
export default App;
