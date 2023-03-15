import React, { useState,useEffect, useRef } from "react";

import uuid from 'react-uuid';
import "../chat.css";

import Avatar from "@mui/material/Avatar";
import { BsEmojiSmile, BsFillSendFill } from "react-icons/bs";
import { deepPurple } from "@mui/material/colors";
import Message from "./Message";
import { HiStatusOnline, HiOutlineDotsVertical } from "react-icons/hi";
import { arrayUnion, doc, onSnapshot, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../../userauth/FireAuth";

function ChatDescription({descname,bio,messageid,chatsData,uid}) {
  console.log(messageid)
  const[sender,setsender]=useState(null);
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "userchats",messageid), (doc) => {
      doc.exists() && setMessages(doc.data().messages);
    });

    return () => {
      unSub();
    };
  }, [messageid]);

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleInputChange = (event) => {
    setInputValue(event);
  };
  const handleSubmit = async(event) => {
    event.preventDefault();
    let text =inputValue;
    setInputValue("");



    await updateDoc(doc(db, "userchats", messageid), {
      messages: arrayUnion({
        id:uuid(),
        inputValue:text,
        senderId:uid,
        date: Timestamp.now(),
      }),
    });
    
  };

  return (
    <>
      <div
        class="d-flex flex-row p-1"
        style={{ backgroundColor: "#212121", height: "9.10vh" }}
      >
        <div
          className="d-flex flex-row"
          style={{
            flex: 1,
          }}
        >
          <div className="p-1">
            <Avatar sx={{ bgcolor: deepPurple[500], width: 48, height: 48 }}>
              AS
            </Avatar>
          </div>
          <div
            className="d-flex flex-column "
            style={{ flex: 1, backgroundColor: "#212121" }}
          >
            <div
              className="px-2 pt-1"
              style={{
                flex: 1,
                backgroundColor: "#212121",
                fontSize: "17px",
                fontWeight: 600,
                color: "white",
              }}
            >
              {descname}
            </div>
            <div
              className="px-2 pb-3"
              style={{ color: "#a8a8a8", fontSize: "13px" }}
            >
             {bio}
            </div>
          </div>

          <div className="d-flex flex-row pt-1" style={{ color: "green" }}>
            <HiStatusOnline className="px-2" style={{ fontSize: "50px" }} />
          </div>
          <div
            className="pt-2 mt-1"
            style={{ color: "green", fontSize: "20px" }}
          >
            online
          </div>

          <div
            className="pt-2 ml-4 pr-3 mr-3"
            style={{ color: "#a8a8a8", fontSize: "30px" }}
          >
            <HiOutlineDotsVertical />
          </div>
        </div>
      </div>
      <div class="d-flex flex-column justify-content-between">
        <div
          className="d-flex flex-column chatdata"
          style={{
            height: "73.5vh",
            backgroundColor: "brown",
          }}
        >
          <div className="chat-box" >
            <div className="messsage1">
              {messages.map((m) => (
                m.senderId===uid?
                <Message key={m.id} message={m} sender={true}/>
                :
                <Message key={m.id} message={m} sender={false}/>
              ))}
            </div>
            <div ref={messagesEndRef} />

            {/* <img src="https://4kwallpapers.com/images/walls/thumbs_3t/10307.jpg"/> */}
          </div>
          
          
        </div>
        <div
            className="d-flex flex-row justify-content-center"
            style={{
              height: "9.13vh",
              backgroundColor: "#2c2c2c",
            }}
          >
            <div
              className="d-flex flex-row"
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              <div class="d-flex flex-row" style={{}}>
                <form
                  onSubmit={(e) => {
                    handleSubmit(e);
                  }}
                >
                  <div
                    class="d-flex flex-row inputter"
                    style={{ flex: 1, width: "66rem" }}
                  >
                    <div>
                      <a href="PIC" class="imoji">
                        <BsEmojiSmile style={{ fontSize: "29px" }} />
                      </a>
                    </div>

                    <input
                      class="search_input px-3"
                      type="text"
                      name=""
                      value={inputValue}
                      placeholder="Message"
                      onChange={(e) => {
                        handleInputChange(e.target.value);
                      }}
                      style={{
                        flex: 1,
                      }}
                    />

                    <div className="p-1">
                      <button
                        class="imoji"
                        onClick={() => {
                          handleSubmit();
                        }}
                      >
                        <BsFillSendFill
                          style={{ fontSize: "29px", float: "left" }}
                        />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            </div>
      </div>
    </>
  );
}

export default ChatDescription;
