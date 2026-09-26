import React from "react";
import { Link } from "react-router-dom";
import { IoArrowForward, IoLogoGithub, IoMoonOutline, IoSunnyOutline, IoCheckmarkDone } from "react-icons/io5";
import "../../styles/about.css";
import { useTheme } from "../../Context/ThemeContext";
import { FEATURES } from "../about/AboutPage";
import profile from "../../config/profile";
import Avatar from "../common/Avatar";

function PhoneMock() {
  return (
    <div className="phone" aria-hidden>
      <div className="phone-notch" />
      <div className="phone-head">
        <span className="ph-av" style={{ background: "#7c5cff" }}>🚀</span>
        <div><strong>Launch Squad</strong><small>Aisha is typing…</small></div>
      </div>
      <div className="phone-body">
        <div className="pm in"><b style={{ color: "#f59e0b" }}>Aisha</b>Demo is live! 🎉 who's joining the call?</div>
        <div className="pm out">Me! Sharing my screen in 5 <span className="pm-meta">9:41 <IoCheckmarkDone /></span></div>
        <div className="pm in poll"><b style={{ color: "#10b981" }}>Ravi</b><strong>📊 Ship tonight?</strong><span className="pbar"><i style={{ width: "80%" }} /></span><span className="pbar"><i style={{ width: "20%" }} /></span></div>
        <div className="pm in voice"><span>▶</span><span className="vw">{Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ height: `${20 + ((i * 37) % 70)}%` }} />)}</span><small>0:12</small></div>
        <div className="pm out">🔥🔥🔥<span className="pm-meta">9:42 <IoCheckmarkDone /></span></div>
        <div className="pm-react">❤️ 👍 3</div>
      </div>
      <div className="phone-input"><span>Message</span><i>🎤</i></div>
    </div>
  );
}

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="landing">
      <nav className="land-nav">
        <div className="land-brand"><img src="/icon.svg" alt="" width="34" height="34" /> AR Hub</div>
        <div className="land-nav-links">
          <a href="#features">Features</a>
          <Link to="/about">Developer</Link>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">{theme === "dark" ? <IoSunnyOutline /> : <IoMoonOutline />}</button>
          <Link className="btn btn-primary btn-sm" to="/login">Sign in</Link>
        </div>
      </nav>

      <div className="land-scroll">
        <header className="land-hero">
          <div className="land-glow" aria-hidden />
          <div className="land-copy">
            <span className="land-kicker">✨ Chat · Rooms · Calls · Feed · Forums · Games</span>
            <h1>All your conversations.<br /><span className="grad">One beautiful hub.</span></h1>
            <p>AR Hub is a real-time messenger for the web and your phone — with group rooms, HD voice & video calls, voice notes, status stories, multiplayer games and a productivity toolkit built in.</p>
            <div className="land-cta">
              <Link className="btn btn-primary btn-lg" to="/login?mode=signup">Get started — it's free <IoArrowForward /></Link>
              <Link className="btn btn-outline btn-lg" to="/login">I have an account</Link>
            </div>
            <div className="land-trust">
              <span>⚡ Real-time sync</span><span>📱 Installable app</span><span>🌙 Dark mode</span><span>🔒 Secure sign-in</span>
            </div>
          </div>
          <PhoneMock />
        </header>

        <section className="land-section" id="features">
          <h2>Everything you'd expect — and then some</h2>
          <p className="land-sub">Built to feel as smooth as a native app, on any screen.</p>
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

        <section className="land-section land-dev">
          <Avatar src={profile.avatar} name={profile.name} size={84} />
          <div>
            <h3>Built by {profile.name}</h3>
            <p>{profile.tagline}</p>
            <div className="land-cta">
              <Link className="btn btn-soft" to="/about">View portfolio <IoArrowForward /></Link>
              {profile.github && <a className="btn btn-ghost" href={profile.github} target="_blank" rel="noopener noreferrer"><IoLogoGithub /> GitHub</a>}
            </div>
          </div>
        </section>

        <section className="land-final">
          <h2>Ready to say hello?</h2>
          <Link className="btn btn-primary btn-lg" to="/login?mode=signup">Create your account <IoArrowForward /></Link>
        </section>
        <footer className="about-foot">© {new Date().getFullYear()} AR Hub · Made with React, Firebase & WebRTC</footer>
      </div>
    </div>
  );
}
