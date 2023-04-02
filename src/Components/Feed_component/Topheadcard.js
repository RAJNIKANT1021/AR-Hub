import React, { useState } from "react";
import "./Topheadcard.css";
import { IoIosArrowDown } from "react-icons/io";
import { SiWebmoney } from "react-icons/si";
function Topheadcard({ url1, title, source, author, date, content, website_redirect }) {
  const handleReadmore = () => {
    if (Rdm === null) {
      setRdm(true);
    } else if (Rdm === true) {
      setRdm(false);
    } else if (Rdm === false) {
      setRdm(true);
    }
  };
  const [Rdm, setRdm] = useState(null);
  return (
    <div
      className="d-flex flex-column"
      style={{ width: "", backgroundColor: "#fdfefe", borderRadius: "20px" }}
    >
      <div style={{ padding: "30px" }}>
        <div className="d-flex flex-column">
          <div className="flex Topimg">
            <img
              className="Topimg Topimg-contain"
              src={
                url1
                  ? url1
                  : "https://firebasestorage.googleapis.com/v0/b/ar-hub-d45d1.appspot.com/o/news.jpg?alt=media&token=e0d5f6bb-0022-4495-9a1e-6ab23cbb8039"
              }
            />
          </div>

          <div>
            <div className="my-2 d-flex flex-row">
                <div
                  className="px-2 py-1"
                  style={{
                    color: "#e25e75",
                    backgroundColor: "#faf1f3",
                    width: "max-content",
                    borderRadius: "100px",
                    fontSize:'1rem'
                  }}
                >
                  {source}
                </div>
                <div style={{ flex: 1 }}></div>
                <div className="px-1 py-1" style={{
                    color: "#28282B",
                    backgroundColor: "#E5E4E2",
                    width: "max-content",
                    borderRadius: "100px",
                    fontSize:'0.81rem'
                  }}>{date}</div>
                  <a href={website_redirect} target="_blank">
                <div className="d-flex ml-2 website" style={{
                    color: "#1F51FF",
                    backgroundColor: "#87CEEB",
                    width: "max-content",
                    borderRadius: "100px",
                  }}>
                <div>
                <SiWebmoney className="webis ml-2 px-1" style={{fontSize:'1.3rem'}}/></div>
                <div className="webis1 mr-2" style={{fontSize:'1rem'}}>Website</div></div></a>
              
            </div>
            <div style={{ fontSize: "1.5rem" }}>{title}</div>
            <div className="d-flex flex-row">
              <div>By {author}</div>
              <div style={{ flex: 1 }}></div>
              
              
            </div>
            {Rdm === true && (
              <div className="d-flex" style={{ backgroundColor: "" }}>
                <div className="Readmore">{content}</div>
              </div>
            )}
            {Rdm === false && (
              <div
                className="d-flex"
                style={{ backgroundColor: "", overflow: "hidden" }}
              >
                <div className="Readmore1">{content}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topheadcard;
