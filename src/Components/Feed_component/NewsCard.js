import React, { useState } from "react";
import "./newscard1.css";
import { IoIosArrowDown } from "react-icons/io";
import { SiWebmoney } from "react-icons/si";
function NewsCard({ url1, title, source, author, date, content, website_redirect }) {
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
          <div className="flex Newsimg">
            <img
              className="Newsimg Newsimg-contain"
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
                  }}
                >
                  {source}
                </div>
                <div style={{ flex: 1 }}></div>
                <div className="px-2 py-1" style={{
                    color: "#28282B",
                    backgroundColor: "#E5E4E2",
                    width: "max-content",
                    borderRadius: "100px",
                  }}>{date}</div>
                  <a href={website_redirect} target="_blank">
                <div className="d-flex ml-3 website" style={{
                    color: "#1F51FF",
                    backgroundColor: "#87CEEB",
                    width: "max-content",
                    borderRadius: "100px",
                  }}>
                <div>
                <SiWebmoney className="webis ml-2 px-1" style={{fontSize:'3.6vh'}}/></div>
                <div className="webis1 mr-3">Website</div></div></a>
              
            </div>
            <div style={{ fontSize: "1.5rem" }}>{title}</div>
            <div className="d-flex flex-row">
              <div>By {author}</div>
              <div style={{ flex: 1 }}></div>
              <div
                className="rdm px-2 py-1"
                Tabindex={90}
                onClick={() => {
                  handleReadmore();
                }}
                style={{
                  color: "#228B22",
                  backgroundColor: "#C1E1C1",
                  width: "max-content",
                  borderRadius: "100px",
                }}
              >
                Read more{" "}
              </div>
              <div className="rdm">
                <IoIosArrowDown
                  className={Rdm === true ? "my-2 upper" : "my-2 downward"}
                />
              </div>
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

export default NewsCard;
