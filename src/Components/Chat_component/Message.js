import React from "react";
import "./Message.css";
import Avatar from "@mui/material/Avatar";
import { deepPurple } from "@mui/material/colors";
import uuid from "react-uuid";

const Message = ({ message, sender }) => {
  console.log(message);
  return (
    <>
      {sender === true ? (
        <div className="my-5 sender" style={{ backgroundColor: "" }}>
          <div className="d-flex flex-row">
            <div
              className="text1 d-flex flex-column"
              style={{ backgroundColor: "" }}
            >
              <div
                className="msgcontainer"
                style={{ backgroundColor: "" }}
                key={uuid()}
              >
                {message.inputValue}
              </div>
              <div className="msgtime" style={{ backgroundColor: "" }}>
                10:45 AM
              </div>
            </div>
            <div
              className="d-flex flex-column my-3 ml-2 mr-5"
              style={{ backgroundColor: "", justifyContent: "center" }}
            >
              <Avatar sx={{ bgcolor: deepPurple[500], width: 46, height: 46 }}>
                AS
              </Avatar>
            </div>
          </div>
        </div>
      ) : (
        <div className="my-5 reciever" style={{ backgroundColor: "" }}>
          <div className="d-flex flex-row">
            <div
              className="d-flex flex-column my-3 mr-2 ml-5"
              style={{ backgroundColor: "", justifyContent: "center" }}
            >
              <Avatar sx={{ bgcolor: deepPurple[500], width: 46, height: 46 }}>
                AS
              </Avatar>
            </div>
            <div
              className="text1 d-flex flex-column"
              style={{ backgroundColor: "" }}
            >
              <div
                className="msgcontainer"
                style={{ backgroundColor: "" }}
                key={uuid()}
              >
                {message.inputValue}
              </div>
              <div className="msgtime" style={{ backgroundColor: "" }}>
                10:45 AM
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Message;
