import React, { useEffect, useState } from "react";
import { IoRefresh, IoShareSocialOutline, IoOpenOutline } from "react-icons/io5";
import { toastOk, toastError } from "../../../Context/ChatContext";
import { sendMessage } from "../../../lib/db";
import { fmtRelative } from "../../../lib/format";
import { ChatPicker } from "../Whiteboard";

// CORS-friendly mirror of NewsAPI top-headlines (the NewsAPI free tier blocks browsers in production).
const SOURCE = "https://saurav.tech/NewsAPI/top-headlines/category";
const CATEGORIES = [
  { key: "general", label: "Top", icon: "🗞️" },
  { key: "technology", label: "Tech", icon: "💻" },
  { key: "business", label: "Business", icon: "💼" },
  { key: "sports", label: "Sports", icon: "⚽" },
  { key: "entertainment", label: "Entertainment", icon: "🎬" },
  { key: "science", label: "Science", icon: "🔬" },
  { key: "health", label: "Health", icon: "🏥" },
];
const COUNTRIES = [
  { code: "in", name: "India" }, { code: "us", name: "United States" }, { code: "gb", name: "United Kingdom" },
  { code: "au", name: "Australia" }, { code: "fr", name: "France" },
];

const cache = {};

export default function News() {
  const [cat, setCat] = useState(() => localStorage.getItem("arhub_news_cat") || "general");
  const [country, setCountry] = useState(() => localStorage.getItem("arhub_news_country") || "in");
  const [state, setState] = useState({ loading: true, articles: [], error: null });
  const [share, setShare] = useState(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    localStorage.setItem("arhub_news_cat", cat);
    localStorage.setItem("arhub_news_country", country);
    const key = `${cat}_${country}`;
    if (cache[key] && !nonce) { setState({ loading: false, articles: cache[key], error: null }); return; }
    let alive = true;
    setState(s => ({ ...s, loading: true, error: null }));
    fetch(`${SOURCE}/${cat}/${country}.json`)
      .then(r => { if (!r.ok) throw new Error("Couldn't load headlines."); return r.json(); })
      .then(d => {
        const articles = (d.articles || []).filter(a => a.title && a.title !== "[Removed]");
        cache[key] = articles;
        if (alive) setState({ loading: false, articles, error: null });
      })
      .catch(e => alive && setState({ loading: false, articles: [], error: e.message || "Network error" }));
    return () => { alive = false; };
  }, [cat, country, nonce]);

  const [hero, ...rest] = state.articles;

  return (
    <div className="news">
      <div className="news-bar">
        <div className="chips">
          {CATEGORIES.map(c => <button key={c.key} className={`chip ${cat === c.key ? "active" : ""}`} onClick={() => setCat(c.key)}>{c.icon} {c.label}</button>)}
        </div>
        <select className="select news-country" value={country} onChange={e => setCountry(e.target.value)} aria-label="Country">
          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <button className="icon-btn" onClick={() => setNonce(n => n + 1)} title="Refresh"><IoRefresh /></button>
      </div>

      {state.loading && (
        <div className="news-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="news-card"><div className="skeleton" style={{ height: 160 }} /><div style={{ padding: 12, display: "grid", gap: 8 }}><div className="skeleton" style={{ height: 14 }} /><div className="skeleton" style={{ height: 14, width: "70%" }} /></div></div>)}
        </div>
      )}
      {!state.loading && state.error && (
        <div className="empty"><div className="empty-icon">📡</div><div className="empty-title">Couldn't load news</div><div className="empty-body">{state.error}</div><button className="btn btn-primary" onClick={() => setNonce(n => n + 1)}>Try again</button></div>
      )}
      {!state.loading && !state.error && hero && (
        <>
          <a className="news-hero" href={hero.url} target="_blank" rel="noopener noreferrer">
            {hero.urlToImage && <img src={hero.urlToImage} alt="" onError={e => { e.currentTarget.style.display = "none"; }} />}
            <div className="news-hero-body">
              <span className="news-src">{hero.source?.name} · {fmtRelative(hero.publishedAt)}</span>
              <h2>{hero.title}</h2>
              {hero.description && <p>{hero.description}</p>}
            </div>
          </a>
          <div className="news-grid">
            {rest.map((a, i) => (
              <article key={a.url + i} className="news-card">
                <a href={a.url} target="_blank" rel="noopener noreferrer">
                  {a.urlToImage ? <img src={a.urlToImage} alt="" loading="lazy" onError={e => { e.currentTarget.replaceWith(Object.assign(document.createElement("div"), { className: "news-ph", textContent: "📰" })); }} /> : <div className="news-ph">📰</div>}
                </a>
                <div className="news-body">
                  <span className="news-src">{a.source?.name} · {fmtRelative(a.publishedAt)}</span>
                  <a href={a.url} target="_blank" rel="noopener noreferrer"><h3>{a.title}</h3></a>
                  <div className="news-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setShare(a)}><IoShareSocialOutline /> Share</button>
                    <a className="btn btn-ghost btn-sm" href={a.url} target="_blank" rel="noopener noreferrer"><IoOpenOutline /> Read</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <ChatPicker open={!!share} onClose={() => setShare(null)} title="Share article to…" onPick={async (chat, me) => {
        const a = share;
        setShare(null);
        try { await sendMessage(chat.id, { chat, me, text: `📰 *${a.title}*\n${a.url}` }); toastOk("Shared"); } catch (e) { toastError(e); }
      }} />
    </div>
  );
}
