import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoArrowBack, IoLogoGithub, IoLogoLinkedin, IoMailOutline, IoGlobeOutline, IoDocumentTextOutline, IoLocationOutline,
  IoSend, IoOpenOutline, IoCheckmarkCircle,
} from "react-icons/io5";
import "../../styles/about.css";
import profile from "../../config/profile";
import Avatar from "../common/Avatar";

export const FEATURES = [
  { icon: "💬", title: "Real-time messaging", text: "Instant delivery with sent / delivered / read ticks, typing indicators, replies, reactions, edits, forwarding and delete-for-everyone." },
  { icon: "👥", title: "Rooms", text: "Public & private group chats with admins, invite links & codes, @mentions, pinned messages and member management." },
  { icon: "📞", title: "HD voice & video calls", text: "Peer-to-peer WebRTC calls with screen sharing, device switching, in-call chat and missed-call alerts." },
  { icon: "🎤", title: "Voice notes & media", text: "Record voice messages with live waveforms, share photos, sketches, polls and live locations." },
  { icon: "⭕", title: "Status stories", text: "24-hour text & photo stories with progress bars, view receipts and quick replies." },
  { icon: "🎮", title: "Multiplayer games", text: "11 real-time games — Tic Tac Toe, Connect 4, Snake Battle and more — playable from chats or calls." },
  { icon: "🔔", title: "Smart notifications", text: "In-app toasts, system push via service worker, per-chat mute, app-icon badges and a notification centre." },
  { icon: "🧰", title: "Productivity hub", text: "Cloud-synced notes & tasks, a Pomodoro focus timer, whiteboard, calculator, unit converter, news and weather." },
  { icon: "⚡", title: "Fast & offline-ready", text: "Installable PWA with an offline cache, code-split routes, optimistic UI and instant cached loads." },
  { icon: "⌨️", title: "Power-user UX", text: "Command palette (Ctrl K), keyboard shortcuts, swipe-to-reply, long-press menus, smart reply suggestions and rich text." },
  { icon: "🎨", title: "Personalisation", text: "Light / dark / system themes, custom accent colours, chat wallpapers and adjustable text size." },
  { icon: "🛡️", title: "Privacy & safety", text: "Block & report, read-receipt control, disappearing messages and authenticated-only data access." },
];

const STACK = ["React 18", "React Router 6", "Firebase Auth", "Cloud Firestore", "WebRTC", "Service Worker", "Web Audio", "MediaRecorder", "Canvas", "CSS custom properties"];

export default function AboutPage({ publicView = false }) {
  const navigate = useNavigate();
  const p = profile;
  const [msg, setMsg] = useState({ name: "", body: "" });

  const links = [
    p.github && { href: p.github, icon: <IoLogoGithub />, label: "GitHub" },
    p.linkedin && { href: p.linkedin, icon: <IoLogoLinkedin />, label: "LinkedIn" },
    p.website && { href: p.website, icon: <IoGlobeOutline />, label: "Website" },
    p.email && { href: `mailto:${p.email}`, icon: <IoMailOutline />, label: "Email" },
  ].filter(Boolean);

  const sendMail = (e) => {
    e.preventDefault();
    if (p.email) {
      window.location.href = `mailto:${p.email}?subject=${encodeURIComponent(`Hello from ${msg.name || "AR Hub"}`)}&body=${encodeURIComponent(msg.body)}`;
    } else if (p.github) {
      window.open(p.github, "_blank", "noopener");
    }
  };

  return (
    <div className="about">
      <header className="about-top">
        <button className="icon-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} aria-label="Back"><IoArrowBack /></button>
        <span className="about-top-title">About the developer</span>
        {publicView && <button className="btn btn-primary btn-sm" onClick={() => navigate("/login")}>Open AR Hub</button>}
      </header>

      <div className="about-scroll">
        <section className="about-hero">
          <div className="about-hero-bg" aria-hidden />
          <Avatar src={p.avatar} name={p.name} size={128} className="about-avatar" />
          {p.available && <span className="about-available"><span className="pulse-dot" /> Open to opportunities</span>}
          <h1>{p.name}</h1>
          <p className="about-role">{p.role}</p>
          {p.location && <p className="about-loc"><IoLocationOutline /> {p.location}</p>}
          <p className="about-tagline">{p.tagline}</p>
          <div className="about-cta">
            <a className="btn btn-primary btn-lg" href="#contact"><IoSend /> Get in touch</a>
            {p.resumeUrl && <a className="btn btn-outline btn-lg" href={p.resumeUrl} target="_blank" rel="noopener noreferrer"><IoDocumentTextOutline /> Résumé</a>}
            {links.map(l => <a key={l.label} className="about-social" href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} title={l.label}>{l.icon}</a>)}
          </div>
        </section>

        <section className="about-stats">
          <div><strong>40+</strong><span>features shipped</span></div>
          <div><strong>11</strong><span>multiplayer games</span></div>
          <div><strong>10</strong><span>hub modules</span></div>
          <div><strong>100%</strong><span>responsive & PWA</span></div>
        </section>

        <section className="about-section">
          <h2>About me</h2>
          {p.bio.map((b, i) => <p key={i} className="about-p">{b}</p>)}
        </section>

        <section className="about-section">
          <h2>What I built in AR Hub</h2>
          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feature" style={{ animationDelay: `${i * 40}ms` }}>
                <span className="feature-icon">{f.icon}</span>
                <strong>{f.title}</strong>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2>How it works</h2>
          <div className="arch">
            <div className="arch-col">
              <div className="arch-box accent">React UI<small>Code-split routes · Context state · optimistic updates</small></div>
              <div className="arch-arrow">↓ real-time listeners ↑ batched writes</div>
              <div className="arch-box">Cloud Firestore<small>Chats · messages · rooms · stories · notifications</small></div>
            </div>
            <div className="arch-col">
              <div className="arch-box">WebRTC peer connection<small>Audio · video · screen share · data channel</small></div>
              <div className="arch-arrow">↕ signalling via Firestore · TURN relay</div>
              <div className="arch-box">Service Worker<small>Offline shell · system notifications · install</small></div>
            </div>
          </div>
          <div className="stack">{STACK.map(s => <span key={s} className="stack-pill">{s}</span>)}</div>
        </section>

        <section className="about-section">
          <h2>Skills</h2>
          <div className="skill-grid">
            {p.skills.map(g => (
              <div key={g.group} className="skill-card">
                <strong>{g.group}</strong>
                <ul>{g.items.map(s => <li key={s}><IoCheckmarkCircle /> {s}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        {p.experience?.length > 0 && (
          <section className="about-section">
            <h2>Experience</h2>
            <div className="timeline">
              {p.experience.map((x, i) => (
                <div key={i} className="tl-item">
                  <span className="tl-dot" />
                  <div className="tl-head"><strong>{x.title}</strong><span>{x.org} · {x.period}</span></div>
                  <ul>{(x.points || []).map((pt, j) => <li key={j}>{pt}</li>)}</ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="about-section">
          <h2>Projects</h2>
          <div className="project-grid">
            {p.projects.map(pr => (
              <a key={pr.name} className="project" href={pr.link || undefined} target="_blank" rel="noopener noreferrer">
                <span className="project-emoji">{pr.emoji}</span>
                <div>
                  <strong>{pr.name} {pr.link && <IoOpenOutline />}</strong>
                  <p>{pr.description}</p>
                  <div className="stack">{pr.tags.map(t => <span key={t} className="stack-pill sm">{t}</span>)}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="about-section" id="contact">
          <h2>Let's work together</h2>
          <p className="about-p">Have a role, a freelance project or just want to say hi? {p.email ? "Drop me a message — I usually reply within a day." : "Reach out on GitHub — I'd love to hear from you."}</p>
          <form className="contact-form" onSubmit={sendMail}>
            <input className="input" placeholder="Your name" value={msg.name} onChange={e => setMsg(m => ({ ...m, name: e.target.value }))} />
            <textarea className="textarea" placeholder="Your message" rows={4} value={msg.body} onChange={e => setMsg(m => ({ ...m, body: e.target.value }))} />
            <button className="btn btn-primary btn-lg" type="submit" disabled={!p.email && !p.github}>
              {p.email ? <><IoMailOutline /> Send email</> : <><IoLogoGithub /> Contact on GitHub</>}
            </button>
          </form>
        </section>

        <footer className="about-foot">Designed & built by {p.name} · © {new Date().getFullYear()}</footer>
      </div>
    </div>
  );
}
