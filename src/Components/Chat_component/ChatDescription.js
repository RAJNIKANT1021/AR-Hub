import React, { useState,useEffect, useRef } from "react";
import { Button } from "@mui/material";
import { RxHamburgerMenu } from "react-icons/rx";
import "../chat.css";

import Avatar from "@mui/material/Avatar";
import { BsEmojiSmile, BsFillSendFill } from "react-icons/bs";
import { deepOrange, deepPurple } from "@mui/material/colors";
import Message from "./Message";
import { HiStatusOnline, HiOutlineDotsVertical } from "react-icons/hi";

function ChatDescription() {
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      text: inputValue,
    };
    setMessages([...messages, newMessage]);
    setInputValue("");
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
              Ajitesh arivastava
            </div>
            <div
              className="px-2 pb-3"
              style={{ color: "#a8a8a8", fontSize: "13px" }}
            >
              We're all astronauts, really, aren't we?!
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
            <div className="messages">
              {messages.map((message) => (
                <Message key={message.id} text={message.text} />
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
                      <a href="#" class="imoji">
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
                        handleInputChange(e);
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
