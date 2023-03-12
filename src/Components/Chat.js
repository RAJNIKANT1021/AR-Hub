
import React from "react";
import { Button } from "@mui/material";
import { RxHamburgerMenu } from "react-icons/rx";
import "./chat.css";
import ChatTile from "./Chat_component/ChatTile";
function Chat() {
  return (
    <div>
      <div className="d-flex flex-row">
        <div style={{ height: "91vh" }}>
          {/* header */}
          <div
            className="d-flex flex-column bd-highlight mb-3"
            style={{
              overflow: "hidden",
            }}
          >
            <div
              className="d-flex flex-column pt-2 px-2  position-sticky"
              style={{ backgroundColor: "#212121", position: "relative" }}
            >
              <div className="d-flex flex-row">
                <div
                  className="px-1"
                  style={{
                    backgroundColor: "#212121",
                    justifyItems: "center",
                    color: "#aaaaaa",
                    alignItems: "center",
                    padding: "10px",
                    fontSize: "20px",
                  }}
                >
                  <RxHamburgerMenu />
                </div>

                <div
                  class="search"
                  style={{
                    backgroundColor: "#212121",
                  }}
                >
                  <form action="http://www.google.com/search" method="get">
                    <div class="searchbar">
                      <input
                        class="search_input"
                        type="text"
                        name=""
                        placeholder="Search AR hub"
                      />
                      <a href="#" class="search_icon">
                        <i class="fas fa-search"></i>
                      </a>
                    </div>
                  </form>
                </div>
              </div>

              <div
                className="d-flex flex-row justify-content-around py-1 mt-1"
                style={{
                  backgroundColor: "#212121",

                  color: "black",
                }}
              >
                <div class="chatnav">
                  <Button
                    variant="contained"
                    style={{
                      color: "##8774e1",
                      backgroundColor: "transparent",
                    }}
                  >
                    All
                    <div
                      className="px-1 mx-2"
                      style={{
                        borderRadius: "80px",
                        backgroundColor: "#8774e1",
                        color: "white",
                        minWidth: "31px",
                      }}
                    >
                      12
                    </div>
                  </Button>
                </div>
                <div class="chatnav">
                  <Button
                    variant="contained"
                    style={{
                      color: "#9b9b9b",
                      backgroundColor: "transparent",
                    }}
                  >
                    Personal{" "}
                    <div
                      className="px-1 mx-2"
                      style={{
                        borderRadius: "80px",
                        backgroundColor: "#8774e1",
                        color: "white",
                        minWidth: "31px",
                      }}
                    >
                      1
                    </div>
                  </Button>
                </div>

                <div class="chatnav">
                  <Button
                    variant="contained"
                    style={{
                      color: "#9b9b9b",
                      backgroundColor: "transparent",
                    }}
                  >
                    Unreads{" "}
                    <div
                      className="px-1 mx-2"
                      style={{
                        borderRadius: "80px",
                        backgroundColor: "#8774e1",
                        color: "white",
                        minWidth: "31px",
                      }}
                    >
                      125
                    </div>
                  </Button  >
                </div>
              </div>
            </div>
            <div
              className="d-flex flex-column pt-2 px-2"
              style={{
                backgroundColor: "#212121",
                position: "relative",
                height: "33.2rem",
                overflowY: "scroll",
              }}
            >
              <ChatTile name={'Ajiteh'}/>
              <ChatTile name={'aditya'}  />
              <ChatTile  name={'rajnikant'}/>
              <ChatTile name={'hey'}/>
              <ChatTile name={'Ajitheh'}/>
              <ChatTile name={'Ajiteh'} />
              <ChatTile name={'Ajiteh'}/>
              <ChatTile name={'Ajiteh'} />
              <ChatTile name={'Ajiteh'}/>
              <ChatTile name={'Ajiteh'} />
            </div>
          </div>
        </div>
        <div  style={{ backgroundColor: "purple", flex: 1 ,height:'91vh'}}>
          {/* header */}
          <div class="" style={{ backgroundColor: "yellow", height:'8.10vh'}}>
            heading
          </div>
          <div class="d-flex flex-column justify-content-between" >

         
          <div className="d-flex flex-column"
            style={{
            height:'73.5vh',
              backgroundColor: "brown",
            }}
          >
            <img src="https://4kwallpapers.com/images/walls/thumbs_3t/10307.jpg"/>
          </div>
          <div
            style={{
              height:'9.13vh',
              backgroundColor: "white",
            }}
          >
            
          </div>
          <div
            style={{
              backgroundColor: "white",
            }}
          >
            
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
