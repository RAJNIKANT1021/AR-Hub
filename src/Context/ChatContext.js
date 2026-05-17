import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback,
} from "react";
import {
  subscribeUser, subscribeChats, subscribeNotifications,
  setPresence, clearUnread,
  markNotificationRead, markAllNotificationsRead,
} from "../lib/db";
import {
  cacheMe, getCachedMe,
  cacheChats, getCachedChats,
  hasChanged,
} from "../lib/cache";
import { Timestamp } from "firebase/firestore";

const ChatContext = createContext(null);
export const useChatContext = () => useContext(ChatContext);

// ── Browser notification ────────────────────────────────────────
async function requestBrowserNotifPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
}

function showBrowserNotif(title, body, icon, onClick) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: `arhub-${title}`,
      requireInteraction: false,
      silent: false,
    });
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
    setTimeout(() => n.close(), 8000);
  } catch {}
}

// ── Sounds ─────────────────────────────────────────────────────
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

function playMessageSound(isSend) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(isSend ? 440 : 660, ctx.currentTime);
    osc.frequency.setValueAtTime(isSend ? 660 : 440, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

// ── Toast ───────────────────────────────────────────────────────
let _addToast = null;
export function pushToast(toast) { _addToast?.(toast); }

// ── Provider ────────────────────────────────────────────────────
export function ChatProvider({ uid, children }) {
  // Seed state from cache immediately — no empty flash on first render
  const [me,    setMeRaw]    = useState(() => getCachedMe(uid));
  const [chats, setChatsRaw] = useState(() => getCachedChats(uid));
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("arhub_sound") !== "false"
  );
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatPartner, setChatPartner] = useState(null);

  // Write-through setters — update state + cache atomically
  const setMe = useCallback((next) => {
    setMeRaw(prev => {
      if (!hasChanged(prev, next)) return prev; // skip re-render
      cacheMe(uid, next);
      return next;
    });
  }, [uid]);

  const setChats = useCallback((next) => {
    setChatsRaw(prev => {
      if (!hasChanged(prev, next)) return prev; // skip re-render
      cacheChats(uid, next);
      return next;
    });
  }, [uid]);

  // Refs — always current in async callbacks
  const sessionStart    = useRef(Timestamp.now());
  const prevNotifsRef   = useRef([]);
  const activeChatIdRef = useRef(null);
  const mutedChatsRef   = useRef([]);
  const blocklistRef    = useRef([]);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);
  useEffect(() => {
    mutedChatsRef.current = me?.mutedChats || [];
    blocklistRef.current  = me?.blocklist  || [];
  }, [me]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // ── Toast queue ──────────────────────────────────────────────
  _addToast = useCallback((t) => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { ...t, id }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(s => {
      const next = !s;
      localStorage.setItem("arhub_sound", String(next));
      return next;
    });
  }, []);

  // ── Presence ─────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    requestBrowserNotifPermission();
    setPresence(uid, true);
    const onVis  = () => setPresence(uid, document.visibilityState !== "hidden");
    const onExit = () => setPresence(uid, false);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", onExit);
    return () => {
      setPresence(uid, false);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", onExit);
    };
  }, [uid]);

  // ── Subscribe: me ─────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    return subscribeUser(uid, (data) => {
      if (data) setMe(data);
    });
  }, [uid, setMe]);

  // ── Subscribe: chats ──────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    return subscribeChats(uid, (data) => {
      setChats(data);
    });
  }, [uid, setChats]);

  // ── Clear unread when chat is opened ─────────────────────────
  useEffect(() => {
    if (!uid || !activeChatId) return;
    clearUnread(uid, activeChatId);
  }, [uid, activeChatId]);

  // ── Subscribe: notifications ──────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    return subscribeNotifications(uid, (notifs) => {
      setNotifications(prev => {
        if (!hasChanged(prev, notifs)) return prev;
        return notifs;
      });

      const prev    = prevNotifsRef.current;
      const prevIds = new Set(prev.map(n => n.id));
      const fresh   = notifs.filter(n =>
        !n.read &&
        !prevIds.has(n.id) &&
        n.createdAt?.toMillis?.() > sessionStart.current.toMillis()
      );
      prevNotifsRef.current = notifs;

      fresh.forEach(n => {
        if (n.type === "message" && n.chatId === activeChatIdRef.current) return;
        if (n.fromUid && blocklistRef.current.includes(n.fromUid)) return;
        if (n.type === "message" && mutedChatsRef.current.includes(n.chatId)) return;

        const sender = n.senderName || "Someone";
        let title, body;
        if (n.type === "friend_request")  { title = "👋 New Friend Request"; body = `${sender} sent you a friend request`; }
        else if (n.type === "friend_accepted") { title = "🤝 Friend Request Accepted"; body = `${sender} accepted your friend request`; }
        else if (n.type === "message")    { title = sender; body = n.text || "Sent you a message"; }
        else                              { title = "Notification"; body = n.text || ""; }

        if (soundEnabledRef.current) playNotifSound();
        pushToast({ title, body, type: n.type, nid: n.id, fromUid: n.fromUid, chatId: n.chatId });

        const isInChat = document.visibilityState === "visible" && n.chatId === activeChatIdRef.current;
        if (!isInChat) showBrowserNotif(title, body, null, () => window.focus());
      });
    });
  }, [uid]);

  // ── Unread badge — exclude active chat, muted, blocked ───────
  const totalUnread = chats.reduce((sum, c) => {
    if (c.id === activeChatId) return sum;
    if (me?.mutedChats?.includes(c.id)) return sum;
    const otherId = c.members?.find(m => m !== uid);
    if (otherId && me?.blocklist?.includes(otherId)) return sum;
    return sum + (c.unreadCount?.[uid] || 0);
  }, 0);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const markNotifRead = useCallback((nid) => markNotificationRead(uid, nid), [uid]);
  const markAllRead   = useCallback(() => markAllNotificationsRead(uid), [uid]);

  return (
    <ChatContext.Provider value={{
      me, uid, chats, notifications, toasts, dismissToast,
      soundEnabled, toggleSound,
      activeChatId, setActiveChatId,
      chatPartner, setChatPartner,
      totalUnread, unreadNotifs,
      markNotifRead, markAllRead,
      playMessageSound, playNotifSound,
      showBrowserNotif, requestBrowserNotifPermission,
    }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ChatContext.Provider>
  );
}

// ── Toast UI ────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', top: 68, right: 16, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const icon = toast.type === 'friend_request' ? '👋'
    : toast.type === 'friend_accepted' ? '🤝'
    : toast.type === 'message' ? '💬' : '🔔';
  return (
    <div
      style={{
        pointerEvents: 'all', background: 'var(--bg-secondary)',
        border: '1px solid var(--border)', borderLeft: '4px solid var(--accent)',
        borderRadius: 12, padding: '0.75rem 1rem',
        minWidth: 280, maxWidth: 340,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        animation: 'slideInLeft 0.25s ease', cursor: 'pointer',
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '.825rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
          {toast.title}
        </div>
        <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {toast.body}
        </div>
      </div>
      <button
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}
        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
      >✕</button>
    </div>
  );
}
