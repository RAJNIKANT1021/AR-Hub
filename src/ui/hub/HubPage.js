import React, { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IoArrowBack, IoSearch } from "react-icons/io5";
import "../../styles/hub.css";
import { useApp } from "../../Context/ChatContext";
import { HUB_MODULES } from "./registry";
import { Spinner } from "../common/Empty";

const COMPONENTS = {
  games: lazy(() => import("./modules/GamesArcade")),
  weather: lazy(() => import("../../Components/Chat_component/Weather_component/main_weather")),
  news: lazy(() => import("./modules/News")),
  notes: lazy(() => import("./modules/Notes")),
  tasks: lazy(() => import("./modules/Tasks")),
  focus: lazy(() => import("./modules/Focus")),
  whiteboard: lazy(() => import("./Whiteboard")),
  calculator: lazy(() => import("./modules/Calculator")),
  converter: lazy(() => import("./modules/Converter")),
  qr: lazy(() => import("./modules/InviteQR")),
};

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HubPage() {
  const { module } = useParams();
  const navigate = useNavigate();
  const { me, totalUnread, visibleChats, allUsers } = useApp();
  const [q, setQ] = useState("");
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const mod = HUB_MODULES.find(m => m.key === module);
  if (module && mod) {
    const C = COMPONENTS[module];
    return (
      <div className="page hub-module">
        <header className="page-header">
          <button className="icon-btn" onClick={() => navigate("/hub")} aria-label="Back to Hub"><IoArrowBack /></button>
          <span className="hub-mod-emoji" style={{ background: mod.color + "22" }}>{mod.emoji}</span>
          <h1 className="page-title sm">{mod.label}</h1>
        </header>
        <div className="page-body">
          <div className={`page-inner ${module === "weather" || module === "news" || module === "games" ? "wide" : ""} hub-mod-body`}>
            <Suspense fallback={<div className="page-loader" style={{ height: 240 }}><Spinner /></div>}>
              <C />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  const online = allUsers.filter(u => u.uid !== me?.uid && u.status === "online").length;
  const rooms = visibleChats.filter(c => c.type === "group").length;
  const list = HUB_MODULES.filter(m => !q || (m.label + m.desc).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Hub</h1>
      </header>
      <div className="page-body">
        <div className="page-inner wide">
          <section className="hub-hero">
            <div className="hub-hero-text">
              <span className="hub-date">{now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</span>
              <h2>{greeting()}, {me?.name?.split(" ")[0] || "there"} 👋</h2>
              <p>Your everyday toolkit — games, news, weather, notes, tasks and more, all in one place.</p>
            </div>
            <div className="hub-clock">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </section>

          <div className="hub-stats">
            <button className="hub-stat" onClick={() => navigate("/chat")}><strong>{totalUnread}</strong><span>unread chats</span></button>
            <button className="hub-stat" onClick={() => navigate("/rooms")}><strong>{rooms}</strong><span>rooms joined</span></button>
            <button className="hub-stat" onClick={() => navigate("/contacts")}><strong>{online}</strong><span>people online</span></button>
            <button className="hub-stat" onClick={() => navigate("/contacts")}><strong>{(me?.friends || []).length}</strong><span>friends</span></button>
          </div>

          <label className="search hub-search"><IoSearch /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search modules" /></label>

          <div className="hub-grid">
            {list.map((m, i) => (
              <button key={m.key} className="hub-tile" style={{ "--tile": m.color, animationDelay: `${i * 30}ms` }} onClick={() => navigate(`/hub/${m.key}`)}>
                <span className="hub-tile-emoji">{m.emoji}</span>
                <span className="hub-tile-label">{m.label}</span>
                <span className="hub-tile-desc">{m.desc}</span>
              </button>
            ))}
            <button className="hub-tile about-tile" style={{ "--tile": "#7c5cff" }} onClick={() => navigate("/about")}>
              <span className="hub-tile-emoji">👨‍💻</span>
              <span className="hub-tile-label">About the developer</span>
              <span className="hub-tile-desc">Portfolio, skills & how this app was built</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
