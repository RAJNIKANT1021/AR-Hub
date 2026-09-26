import React, { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./userauth/FireAuth";
import { ChatProvider, useApp } from "./Context/ChatContext";
import { CallProvider } from "./Components/Call/CallManager";
import { getUser, createUser } from "./lib/db";
import { consumePendingSignupName } from "./ui/auth/pending";
import AppShell from "./ui/shell/AppShell";
import ChatsPage from "./ui/chat/ChatsPage";
import { Spinner } from "./ui/common/Empty";

// Route-level code splitting keeps the first load small
const Landing       = lazy(() => import("./ui/landing/Landing"));
const AuthPage      = lazy(() => import("./ui/auth/AuthPage"));
const AboutPage     = lazy(() => import("./ui/about/AboutPage"));
const RoomsPage     = lazy(() => import("./ui/rooms/RoomsPage"));
const JoinRoom      = lazy(() => import("./ui/rooms/JoinRoom"));
const StatusPage    = lazy(() => import("./ui/status/StatusPage"));
const CallsPage     = lazy(() => import("./ui/calls/CallsPage"));
const ContactsPage  = lazy(() => import("./ui/contacts/ContactsPage"));
const HubPage       = lazy(() => import("./ui/hub/HubPage"));
const NotificationsPage = lazy(() => import("./ui/notifications/NotificationsPage"));
const SettingsPage  = lazy(() => import("./ui/settings/SettingsPage"));
const StarredPage   = lazy(() => import("./ui/chat/StarredPage"));
const ExplorePage   = lazy(() => import("./ui/explore/ExplorePage"));

export function PageLoader() {
  return <div className="page-loader"><Spinner size={28} /></div>;
}

function Splash() {
  return (
    <div className="splash">
      <img src="/icon.svg" alt="" width="76" height="76" />
      <div className="splash-name">AR Hub</div>
      <div className="splash-bar"><span /></div>
    </div>
  );
}

export default function App() {
  const [authState, setAuthState] = useState({ ready: false, uid: null });

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    if (!user) {
      localStorage.removeItem("user");
      setAuthState({ ready: true, uid: null });
      return;
    }
    try {
      const existing = await getUser(user.uid);
      if (!existing) {
        const name = consumePendingSignupName() || user.displayName || (user.email || "user").split("@")[0];
        await createUser(user.uid, { name: name.charAt(0).toUpperCase() + name.slice(1), email: user.email || "" });
      }
    } catch {
      // Offline with no cached profile — the live subscription will fill it in later
    }
    localStorage.setItem("user", user.uid);
    setAuthState({ ready: true, uid: user.uid });
  }), []);

  if (!authState.ready) return <Splash />;

  if (!authState.uid) {
    return (
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/about" element={<AboutPage publicView />} />
          <Route path="*" element={<RedirectToLogin />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <ChatProvider uid={authState.uid} key={authState.uid}>
      <CallLayer uid={authState.uid} />
    </ChatProvider>
  );
}

function RedirectToLogin() {
  const loc = useLocation();
  const next = loc.pathname + loc.search;
  return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
}

function CallLayer({ uid }) {
  const { me } = useApp();
  return (
    <CallProvider uid={uid} myName={me?.name || ""} myAvatar={me?.avatar || null} getUser={getUser}>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/chat" element={<ChatsPage />} />
            <Route path="/chat/:cid" element={<ChatsPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/join/:code" element={<JoinRoom />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/explore/:tab" element={<ExplorePage />} />
            <Route path="/explore/:tab/:id" element={<ExplorePage />} />
            <Route path="/calls" element={<CallsPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/hub" element={<HubPage />} />
            <Route path="/hub/:module" element={<HubPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/starred" element={<StarredPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:section" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </CallProvider>
  );
}

function LoginRedirect() {
  const loc = useLocation();
  const next = new URLSearchParams(loc.search).get("next");
  return <Navigate to={next && next.startsWith("/") ? next : "/chat"} replace />;
}
