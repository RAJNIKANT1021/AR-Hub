import React, {
  createContext, useContext, useState, useEffect,
  useRef, useCallback,
} from "react";
import {
  subscribeUser, subscribeChats, subscribeNotifications,
  setPresence, clearUnread,
  markNotificationRead, markAllNotificationsRead,
} from "../lib/db";
import { Timestamp } from "firebase/firestore";

const ChatContext = createContext(null);
export const useChatContext = () => useContext(ChatContext);

// ── Browser notification helper ─────────────────────────────────

async function requestBrowserNotifPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function showBrowserNotif(title, body, icon, onClick) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    icon: icon || "/favicon.ico",
    badge: "/favicon.ico",
    tag: title + body, // deduplicate
    requireInteraction: false,
  });
  if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
  setTimeout(() => n.close(), 6000);
}

// ── Notification sound ──────────────────────────────────────────
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
}

function playMessageSound(isSend) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (isSend) {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.06);
    } else {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.06);
    }
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

// ── Toast helper ────────────────────────────────────────────────
let _addToast = null;
export function pushToast(toast) { _addToast?.(toast); }

// ── Provider ────────────────────────────────────────────────────
export function ChatProvider({ uid, children }) {
  const [me, setMe] = useState(null);
  const [chats, setChats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(
    () => localStorage.getItem("arhub_sound") !== "false"
  );
  const [activeChatId, setActiveChatId] = useState(null); // cid currently open
  const [chatPartner, setChatPartner] = useState(null);   // user object of open chat

  // Track start-time for new message detection
  const sessionStart = useRef(Timestamp.now());
  const prevNotifsRef = useRef([]);
  const activeChatIdRef = useRef(null);
  const mutedChatsRef = useRef([]);
  const soundEnabledRef = useRef(soundEnabled);

  // Keep refs in sync so notification/sound handlers always see latest values
  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);
  useEffect(() => { mutedChatsRef.current = me?.mutedChats || []; }, [me]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // ── Toast queue ──────────────────────────────────────────────
  _addToast = (t) => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { ...t, id }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 4200);
  };

  const dismissToast = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  // ── Sound preference ─────────────────────────────────────────
  const toggleSound = useCallback(() => {
    setSoundEnabled(s => {
      const next = !s;
      localStorage.setItem("arhub_sound", next);
      return next;
    });
  }, []);

  // ── Presence: online on mount, offline on unmount/hide ───────
  useEffect(() => {
    if (!uid) return;
    requestBrowserNotifPermission();
    setPresence(uid, true);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setPresence(uid, false);
      } else {
        setPresence(uid, true);
      }
    };
    const handleUnload = () => setPresence(uid, false);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      setPresence(uid, false);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [uid]);

  // ── Subscribe: current user ──────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    return subscribeUser(uid, setMe);
  }, [uid]);

  // ── Subscribe: chats list ────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    return subscribeChats(uid, setChats);
  }, [uid]);

  // ── Subscribe: notifications ─────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    return subscribeNotifications(uid, (notifs) => {
      setNotifications(notifs);

      // Detect truly new notifications (unread + newer than session start)
      const prev = prevNotifsRef.current;
      const prevIds = new Set(prev.map(n => n.id));
      const fresh = notifs.filter(n =>
        !n.read &&
        !prevIds.has(n.id) &&
        n.createdAt &&
        n.createdAt.toMillis() > sessionStart.current.toMillis()
      );
      prevNotifsRef.current = notifs;

      fresh.forEach(n => {
        // Suppress if user is already in that chat
        if (n.type === "message" && n.chatId && n.chatId === activeChatIdRef.current) return;
        // Suppress if chat is muted
        if (n.type === "message" && n.chatId && mutedChatsRef.current.includes(n.chatId)) return;

        const sender = n.senderName || "Someone";
        let title, body;

        if (n.type === "friend_request") {
          title = "New Friend Request";
          body = `${sender} sent you a friend request`;
        } else if (n.type === "friend_accepted") {
          title = "Friend Request Accepted";
          body = `${sender} accepted your friend request 🎉`;
        } else if (n.type === "message") {
          title = sender;
          body = n.text || "Sent you a message";
        } else {
          title = "Notification";
          body = n.text || "";
        }

        if (soundEnabledRef.current) playNotifSound();

        // In-app toast
        pushToast({ title, body, type: n.type, nid: n.id, fromUid: n.fromUid });

        // Browser notification (only when tab is hidden)
        if (document.visibilityState === "hidden") {
          showBrowserNotif(title, body, null, () => { window.focus(); });
        }
      });
    });
  }, [uid]);

  // ── Clear unread when chat is open ───────────────────────────
  useEffect(() => {
    if (!uid || !activeChatId) return;
    clearUnread(uid, activeChatId);
  }, [uid, activeChatId]);

  // ── Unread total ─────────────────────────────────────────────
  const totalUnread = chats.reduce((sum, c) => {
    const cnt = c.unreadCount?.[uid] || 0;
    return sum + cnt;
  }, 0);

  const unreadNotifs = notifications.filter(n => !n.read).length;

  const markNotifRead  = useCallback((nid) => markNotificationRead(uid, nid), [uid]);
  const markAllRead    = useCallback(() => markAllNotificationsRead(uid), [uid]);

  return (
    <ChatContext.Provider value={{
      me,
      uid,
      chats,
      notifications,
      toasts,
      dismissToast,
      soundEnabled,
      toggleSound,
      activeChatId,
      setActiveChatId,
      chatPartner,
      setChatPartner,
      totalUnread,
      unreadNotifs,
      markNotifRead,
      markAllRead,
      playMessageSound,
      playNotifSound,
      showBrowserNotif,
      requestBrowserNotifPermission,
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
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  const icon = toast.type === 'friend_request' ? '👋'
    : toast.type === 'friend_accepted' ? '🤝'
    : toast.type === 'message' ? '💬'
    : '🔔';

  return (
    <div
      style={{
        pointerEvents: 'all',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--accent)',
        borderRadius: 12,
        padding: '0.75rem 1rem',
        minWidth: 280,
        maxWidth: 340,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        animation: 'slideInLeft 0.25s ease',
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(toast.id)}
    >
      <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '.825rem', fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: 2,
        }}>{toast.title}</div>
        <div style={{
          fontSize: '.78rem', color: 'var(--text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{toast.body}</div>
      </div>
      <button
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-tertiary)', fontSize: '1rem', lineHeight: 1,
          padding: 0, flexShrink: 0,
        }}
        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
      >✕</button>
    </div>
  );
}
