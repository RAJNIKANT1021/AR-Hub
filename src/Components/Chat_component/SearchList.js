import { doc, getDoc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../../userauth/FireAuth";
import { Avatar } from "@mui/material";
import { deepPurple } from "@mui/material/colors";
import Fuse from "fuse.js";

import { BsPersonCheckFill } from "react-icons/bs";
import { FaUserFriends } from "react-icons/fa";


function SearchList({ searchinput, uid }) {




  const sendfriendrequest=()=>{
    //handle friend request

  }
  const [searchResults, setSearchResults] = useState(null);

  const handleSearchbar = (array, query) => {
    console.log(array.length);
    console.log(query);
    const fuse = new Fuse(array, {
      keys: ["name"],
      threshold: 0.3,
      distance: 100,
      shouldSort: true,
      tokenize: true,
      matchAllTokens: true,
      includeScore: true,
      findAllMatches: true,
      minMatchCharLength: 2,
      random: 0.5,
    });

    const results = fuse.search(query);
    console.log(results);
    setSearchResults(results);
  };

  // Call handleSearchbar somewhere with the query parameter

  const handlesearch = async () => {
    let searchres = [];

    onSnapshot(doc(db, "searchList", "Users"), async (docref) => {
      const detail = docref.data();
      let friend2=false;
      let friend1 = false;
      let blocked1 = false;
      let name1 = "";
      let searchuid1 = "";

      for (const key in detail) {
        if (detail.hasOwnProperty(key)) {
          const main = detail[key];

          const candidate = main.uid;
          if (candidate !== uid) {
            const docref = doc(
              db,
              "A2B_USERS",
              "Users",
              "usersdetails",
              "details"
            );
            const docSnap = await getDoc(docref);

            // eslint-disable-next-line no-loop-func

            const prof = docSnap.data();

            if (prof.hasOwnProperty(candidate)) {
              if (candidate !== uid) {
                const us2 = prof[candidate];
                const useruid=prof[uid];

                const frienduid=useruid.friends;

                for(let k=0;k<frienduid.length;k++){
                  if (frienduid[k] === candidate) {
                    friend2 = true;
                    break;
                  }

                }




                name1 = us2.name;

                searchuid1 = us2.uid;
                const friends1 = us2.friends;
                const blocklist1 = us2.blocklist;
                for (let i = 0; i < friends1.length; i++) {
                  if (friends1[i] === uid) {
                    if(friend2===true)
                    {
                    friend1 = true;
                    break;}
                  }
                }
                for (let i = 0; i < blocklist1.length; i++) {
                  if (blocklist1[i] === candidate) {
                    blocked1 = true;
                    break;
                  }
                }
              }
            }
            searchres.push({
              name: name1,
              searchuid: searchuid1,
              friend: friend1,
              blocked: blocked1,
            });
          }
        }
      }
      handleSearchbar(searchres, searchinput);
    });
  };
  useEffect(() => {
    handlesearch();

    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchinput]);

  return (
    <>
      <div></div>
      <div
        className="d-flex flex-column "
        style={{ flex: 1, backgroundColor: "", Width: "100%" }}
      >
        <div className="d-flex flex-row">
          <div
            className="ml-4 pt-2"
            style={{
              fontSize: "1.6rem",
              color: "whitesmoke",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
          >
            Searches{" "}
          </div>

          <div></div>
        </div>

        <div className="d-flex flex-column mt-3">
          {searchResults !== null &&
            searchResults.map(
              (data, index) =>
                data.item.blocked === false && (
                  <div className="tilehover mt-md-3 handy" key={index}>
                    {
                      <div
                        className="d-flex flex-row px-2"
                        style={{
                          height: "4.4rem",
                        }}
                      >
                        <div
                          className="d-flex flex-row"
                          style={{
                            height: "4.4rem",
                            borderBottomColor: "#292A33",
                            borderWidth: "3px",
                            borderBottomStyle: "solid",
                          }}
                        >
                          <div
                            className="flex pt-1 px-2"
                            style={
                              {
                                // alignItems:'center',
                                // justifyContent:'center',
                                //   backgroundColor:'#212121',
                              }
                            }
                          >
                            <Avatar
                              sx={{
                                bgcolor: deepPurple[500],
                                width: 56,
                                height: 56,
                              }}
                              src="https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740&t=st=1679001679~exp=1679002279~hmac=c53ea30da094c90d0bae1bf703599d8572b711d931d2bbe519571eae87eb5a23"
                              alt="hwt"
                            />
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
                            <div className="d-flex flex-row pl-2" style={{}}>
                              <div
                                className="d-flex flex-column"
                                style={{ flex: 1 }}
                              >
                                <div className="d-flex flex-column">
                                  <div
                                    style={{
                                      flex: 1,
                                      fontWeight: 600,

                                      color: "#ffffff",
                                    }}
                                  >
                                    {data.item.name}
                                  </div>
                                  <div
                                    style={{
                                      flex: 1,
                                      fontWeight: 100,

                                      color: "grey",
                                    }}
                                  >
                                    Working on it
                                  </div>
                                </div>
                              </div>
                              <div className="ml-4 pl-2" style={{}}>
                               {data.item.friend===false && <div
                                  className="d-flex flex-row py-1"
                                  style={{
                                    backgroundColor: "#0A1B3E",
                                    borderRadius: "14px",
                                  }}
                                >
                                  
                                  <div className="d-flex flex-row" onClick={(e)=>{sendfriendrequest()}}>
                                    <div className="mx-2">
                                      <BsPersonCheckFill
                                        style={{
                                          color: "green",
                                          fontSize: "1.3rem",
                                          backgroundColor: "",
                                        }}
                                      />
                                    </div>

                                    <div
                                      className="pr-3"
                                      style={{
                                        backgroundColor: "",
                                        fontSize: ".9rem",
                                      }}
                                    >
                                        Add Friend
                                    </div>
                                  </div>
                                </div>}

                                {data.item.friend===true && <div
                                  className="d-flex flex-row py-1"
                                  style={{
                                    backgroundColor: "#0A1B3E",
                                    borderRadius: "14px",
                                  }}
                                >
                                  
                                  <div className="d-flex flex-row">
                                    <div className="mx-2">
                                      <FaUserFriends
                                        style={{
                                          color: "green",
                                          fontSize: "1.3rem",
                                          backgroundColor: "",
                                        }}
                                      />
                                    </div>

                                    <div
                                      className="pr-3"
                                      style={{
                                        backgroundColor: "",
                                        fontSize: ".9rem",
                                      }}
                                    >
                                        Friends
                                    </div>
                                  </div>
                                </div>}
                              </div>
                            </div>

                            <div
                              className="d-flex flex-row pl-3"
                              style={
                                {
                                  //  backgroundColor:'#212121',
                                }
                              }
                            >
                              {/* <div className=''>

                </div> */}
                              {/* <div style={{
                    paddingLeft:'3px',
                    color:'#aaaaaa',
                    overflow:'hidden',
                }}>

                </div> */}
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                )
            )}
        </div>
      </div>
    </>
  );
}

export default SearchList;
