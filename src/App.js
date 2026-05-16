import React, { useState, useEffect } from "react";
import "./app.css";
import Navbar from "./Components/Navbar";
import Login from "./userauth/login";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Feed from "./Components/Feed";
import Chat from "./Components/Chat";
import Main from "./Components/Chat_component/Weather_component/main_weather";
import { ChatProvider, useChatContext } from "./Context/ChatContext";
import { CallProvider } from "./Components/Call/CallManager";
import { getUser, setPresence } from "./lib/db";

/* ── Full-screen skeleton loader ─────────────────────────────── */
function AppLoader() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)', overflow: 'hidden'
    }}>
      <div style={{
        height: 56, background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 1.25rem', gap: '1rem'
      }}>
        <div className="skeleton" style={{ width: 90, height: 20 }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '.5rem' }}>
          {[70, 70, 70].map((w, i) => <div key={i} className="skeleton" style={{ width: w, height: 32, borderRadius: 8 }} />)}
        </div>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
      </div>
      <div style={{ flex: 1, display: 'flex' }}>
        <div style={{
          width: 380, background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)', padding: '.75rem',
          display: 'flex', flexDirection: 'column', gap: '.75rem'
        }}>
          <div className="skeleton" style={{ height: 36, borderRadius: 10 }} />
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                <div className="skeleton" style={{ height: 14, width: `${50 + (i * 7) % 30}%` }} />
                <div className="skeleton" style={{ height: 12, width: `${65 + (i * 5) % 25}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ opacity: .12, fontSize: '5rem' }}>💬</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [uid, setUid] = useState(null);
  const [loggedin, setLoggedin] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const location = useLocation();

  /* ── Auth gate: verify stored uid against new schema ── */
  useEffect(() => {
    const storedUid = localStorage.getItem('user');
    if (!storedUid) { setAppReady(true); return; }

    getUser(storedUid).then(user => {
      if (user) {
        setUid(storedUid);
        setLoggedin(true);
        setPresence(storedUid, true);
      } else {
        localStorage.removeItem('user');
      }
      setAppReady(true);
    }).catch(() => {
      setAppReady(true);
    });
  }, []);

  const checker = (isLoggedIn, newUid) => {
    setLoggedin(isLoggedIn);
    setUid(isLoggedIn ? newUid : null);
  };

  if (!appReady) return <AppLoader />;

  return (
    <div className="app-layout">
      {/* ChatProvider only active when logged in */}
      {loggedin && uid
        ? (
          <ChatProvider uid={uid}>
            <AppWithCall uid={uid} loggedin={loggedin} checker={checker} />
          </ChatProvider>
        )
        : (
          <>
            <Navbar loggedin={loggedin} checker={checker} uid={uid} />
            <div className="app-body">
              <Routes>
                <Route
                  path="/"
                  element={<Login checker={checker} key={location.key} />}
                />
                <Route path="/weather" element={<Main />} />
                <Route path="/feed" element={<Feed />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </>
        )
      }
    </div>
  );
}

// Inner component: reads me from ChatContext to pass name/avatar to CallProvider
function AppWithCall({ uid, loggedin, checker }) {
  const { me } = useChatContext() || {};
  return (
    <CallProvider uid={uid} myName={me?.name || ""} myAvatar={me?.avatar || null} getUser={getUser}>
      <Navbar loggedin={loggedin} checker={checker} uid={uid} />
      <div className="app-body">
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/weather" element={<Main />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/chat/*" element={<Chat uid={uid} />} />
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </div>
    </CallProvider>
  );
}

export default App;
