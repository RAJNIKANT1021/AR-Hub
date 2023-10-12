import React, { useEffect, useState } from "react";
import "./Feed.css";
import { MdYoutubeSearchedFor } from "react-icons/md";
import NewsCard from "./Feed_component/NewsCard";
import Topheadcard from "./Feed_component/Topheadcard";
import CircularProgress from '@mui/material/CircularProgress';


function Feed() {
  
  const[loading,setloading]=useState(false);
  const [searchCat, setsearchCat] = useState("");
  const [category, setCategory] = useState("Sports");
  const [country, setCountry] = useState("IN");
  const [news, setnews] = useState(null);
  const[countrynews,setcountrynews]=useState(null)
  console.log(category);  
  const fetcher = async () => {
    setloading(true);
    await fetch(
      `https://newsapi.org/v2/everything?q=${category}&apiKey=3d032423eddf4fceb282e7c7e72dfce1`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => setnews(result.articles))
      .catch((error) => console.log("error", error));
      setloading(false)};
    const fetcher2 = async()=>{
    await fetch(
      `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=3d032423eddf4fceb282e7c7e72dfce1`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => setcountrynews(result.articles))
      .catch((error) => console.log("error", error));
  };

  useEffect(() => {
    fetcher();
    return (()=>{
      fetcher();
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);
  useEffect(()=>{
    fetcher2();
    return(()=>{
      fetcher2();
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[country]);
  var requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  return (
    <div style={{display:'fixed',maxWidth:'100vw',width:'100vw'}}>
      <div
        className="d-flex flex-column"
        style={{backgroundColor: "#fdfefe" }}
      >
        <div>
          <div className="d-flex flex-row mx-3 news-header" style={{justifyContent:"space-between"}}>
            <div
              style={{ fontSize: "2.5rem", color: "black", fontWeight: "750" }}
            >
              News
            </div>
            
            <div className="d-flex flex-row mx-3 my-1" style={{flex:1,fontSize: "2rem", fontWeight: "650", color: "black",alignItems:'center',justifyContent:'center'}}
         
            >
              Top headlines
            </div>
            <div className="d-flex flex-rcol mx-3 my-1" style={{alignItems:'center',justifyContent:'center'}}> <label className="d-flex flex-col mx-1 my-1" style={{alignItems:'center',justifyContent:'center',fontSize: "1.2rem", fontWeight: "650", color: "black"}}>Country:</label><div className="search_cont">
 
  <select onChange={(e)=>{setCountry(e.target.value)}} >
  
  <option  value="ae">United Arab Emirates</option>
<option  value="ar">Argentina</option>
<option  value="at">Austria</option>
<option  value="au">Australia</option>
<option  value="be">Belgium</option>
<option  value="bg">Bulgaria</option>
<option  value="br">Brazil</option>
<option  value="ca">Canada</option>
<option  value="ch">Switzerland</option>
<option  value="cn">China</option>
<option  value="co">Colombia</option>
<option  value="cu">Cuba</option>
<option  value="cz">Czech Republic</option>
<option  value="de">Germany</option>
<option  value="eg">Egypt</option>
<option  value="fr">France</option>
<option  value="gb">United Kingdom (Great Britain)</option>
<option  value="gr">Greece</option>
<option  value="hk">Hong Kong</option>
<option  value="hu">Hungary</option>
<option  value="id">Indonesia</option>
<option  value="ie">Ireland</option>
<option  value="il">Israel</option>
<option  value="in" selected>India</option>
<option  value="it">Italy</option>
<option  value="jp">Japan</option>
<option  value="kr">South Korea</option>
<option  value="lt">Lithuania</option>
<option  value="lv">Latvia</option>
<option  value="ma">Morocco</option>
<option  value="mx">Mexico</option>
<option  value="my">Malaysia</option>
<option  value="ng">Nigeria</option>
<option  value="nl">Netherlands (Holland)</option>
<option  value="no">Norway</option>
<option  value="nz">New Zealand</option>
<option  value="ph">Philippines</option>
<option  value="pl">Poland</option>
<option  value="pt">Portugal</option>
<option  value="ro">Romania</option>
<option  value="rs">Serbia</option>
<option  value="ru">Russia</option>
<option  value="sa">Saudi Arabia</option>
<option  value="se">Sweden</option>
<option  value="sg">Singapore</option>
<option  value="si">Slovenia</option>
<option  value="sk">Slovakia</option>
<option  value="th">Thailand</option>
<option  value="tr">Turkey</option>
<option  value="tw">Taiwan</option>
<option  value="ua">Ukraine</option>
  </select>
</div></div>
            <div>
              
            </div>
          </div>
        </div>
        <div style={{ flex: 1, backgroundColor: "white" }}>
          <div
            className="d-flex flex-row news-header"
            style={{}}
          >
            <div style={{ backgroundColor: "#f7f8f9" }}>
              <div className="d-flex flex-column">
                <div
                  className="d-flex flex-column mx-2 my-3 pr-2"
                  style={{ backgroundColor: "white", borderRadius: "10px" }}
                >
                  <div
                    className="ml-3 mr-4"
                    style={{
                      fontSize: "2.1rem",
                      fontFamily: "Quicksand variant0",
                      fontWeight: "650",
                    }}
                  >
                    Category
                  </div>
                  <div
                    className="my-2 ml-3 mr-4 d-flex flex-column"
                    style={{ color: "#a2a2a2 ", flex: 1, fontWeight: "600" }}
                  >
                    <div className="d-flex flex-row">
                      <div className="d-flex flex-row" style={{ flex: 1 }}>
                        <input
                          className="hey2 d-flex py-2 px-2"
                          value={searchCat}
                          onChange={(e) => {
                            setsearchCat(e.target.value);
                          }}
                          type="text"
                          placeholder="Search category"
                          style={{
                            padding:'5px',
                            width: "10em",
                            borderRadius: "12px",
                            borderColor: "black",
                            borderWidth: "1px",
                            height: "4vh",
                          }}
                        />
                      </div>

                      <div className="ml-1">
                        <MdYoutubeSearchedFor
                          className="handy"
                          onClick={() => {
                            setCategory(searchCat);
                          }}
                          style={{ fontSize: "30px", color: "black" }}
                        />
                      </div>
                    </div>
                    <div
                      onFocus={() => {
                        setCategory(()=>{"Entertainment"});
                      }}
                      Tabindex={12222}
                      className="handy my-2"
                    >
                      Entertainment
                    </div>
                    <div
                      onFocus={() => {
                        setCategory("Sports");
                      }}
                      Tabindex={2}
                      className="handy my-2"
                    >
                      Sports
                    </div>
                    <div
                      onFocus={() => {
                        setCategory("Tech");
                      }}
                      Tabindex={3}
                      className="handy my-2"
                    >
                      Tech
                    </div>
                    <div
                      onFocus={() => {
                        setCategory("Politics");
                      }}
                      Tabindex={4}
                      className="handy my-2"
                    >
                      Politics
                    </div>
                    <div
                      onFocus={() => {
                        setCategory("Bitcoin");
                      }}
                      Tabindex={5}
                      className="handy my-2"
                    >
                      Bitcoin
                    </div>
                    <div
                      onFocus={() => {
                        setCategory("Health");
                      }}
                      Tabindex={6}
                      className="handy my-2"
                    >
                      Health
                    </div>
                    <div
                      onFocus={() => {
                        setCategory("Food");
                      }}
                      Tabindex={7}
                      className="handy my-2"
                    >
                      Food
                    </div>
                    <div
                      onFocus={() => {
                        setCategory("Business");
                      }}
                      Tabindex={8}
                      className="handy my-2"
                    >
                      Business
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="" style={{position:'relative', flex: 1, backgroundColor: "#f7f8f9",}}>
              
              {loading===true && <div className="d-flex loaderr"style={{alignItems:'center',justifyContent:'center',height:'90vh',color:'black',backgroundColor:'',width:'100%',position:'absolute',zIndex:1000}}>
              <CircularProgress size={60} />
              </div>}
              <div
                className=" px-4 main-news mostly-customized-scrollbar"
                style={{position:'relative', backgroundColor: "",height:'150vh',zIndex:10}}
              >
                {news !== null &&
                  news.map((articles) => (
                    <div className="my-3" key={19111}>
                      <NewsCard
                        url1={articles.urlToImage}
                        title={articles.title}
                        source={articles.source.name}
                        author={articles.author}
                        date={articles.publishedAt}
                        content={articles.description}
                        website_redirect={articles.url}
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div
              className="top-headlines mostly-customized-scrollbar"
              style={{ fontSize: "1.2rem", backgroundColor: "#f7f8f9" ,height:'150vh'}}
            >
              <div style={{overflowX:'hidden'}}>
                <div style={{}}>
                  {countrynews !== null &&
                    countrynews.map((articles) => (
                      <div className="my-3" key={112121}>
                        <Topheadcard
                          url1={articles.urlToImage}
                          title={articles.title}
                          source={articles.source.name}
                          author={articles.author}
                          date={articles.publishedAt}
                          content={articles.description}
                          website_redirect={articles.url}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Feed;