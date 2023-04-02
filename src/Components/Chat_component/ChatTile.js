import React, { useEffect, useState } from "react";
import Avatar from "@mui/material/Avatar";
import { deepOrange, deepPurple } from "@mui/material/colors";
import "./chattile.css";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../userauth/FireAuth";
import { useLocation } from "react-router-dom";
import { isPlainObject } from "jquery";
import {
  arrayUnion,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

function ChatTile({ name, userid, uid }) {
  const [lastmsg, setlastmsg] = useState("");

  const msgfetcher = async (msgid) => {
    const unSub = onSnapshot(doc(db, "userchats", msgid), (doc) => {
      doc.exists() &&
        setlastmsg(
          doc.data().messages[doc.data().messages.length - 1].inputValue
        );
    });
  };
  useEffect(() => {
    let onetooneid;

    if (uid > userid) {
      onetooneid = `${uid}${userid}`;
    } else {
      onetooneid = `${userid}${uid}`;
    }
    msgfetcher(onetooneid);
  }, [userid]);
  return (
    <div className={"tilehover"}>
      {
        <div
          className="d-flex flex-row "
          style={{
            height: "4.4rem",
          }}
        >
          <div
            className="flex pt-1 px-1 "
            style={{
              //   backgroundColor:'#212121',
              alignItems: "center",

              justifyContent: "center",
            }}
          >
            <Avatar sx={{ bgcolor: deepPurple[500], width: 56, height: 56 }}>
              AS
            </Avatar>
          </div>
          <div
            className="d-flex flex-column"
            style={{
              // backgroundColor:'#212121',
              paddingTop: "9px",
              color: "#ffffff",

              flex: 1,
            }}
          >
            <div className="d-flex flex-row pl-3" style={{}}>
              <div
                style={{
                  flex: 1,
                  fontWeight: 600,

                  color: "#ffffff",
                }}
              >
                {name}
              </div>
              <div
                style={{
                  color: "#686c72",
                  paddingRight: "9px",
                }}
              >
                sat
              </div>
            </div>
            <div
              className="d-flex flex-row pl-3"
              style={{
                //  backgroundColor:'#212121',
                color: "#ffffff",
              }}
            >
              <div className="">Pandey</div>
              <div
                style={{
                  paddingLeft: "3px",
                  color: "#aaaaaa",
                  overflow: "hidden",
                }}
              >
                {lastmsg}
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  );
}

export default ChatTile;
