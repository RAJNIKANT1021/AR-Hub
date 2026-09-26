import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../userauth/FireAuth";
import {
  subscribeUser, subscribeChats, subscribeAllUsers, subscribeNotifications,
  setPresence, markNotificationRead, markAllNotificationsRead, isGroup,
} from "../lib/db";
import { cacheMe, getCachedMe, cacheChats, getCachedChats, cacheAllUsers, getCachedAllUsers, hasChanged } from "../lib/cache";
import { sounds, vibrate, showSystemNotification, setUnreadBadge } from "../lib/notify";
import { toMillis } from "../lib/format";
import Avatar from "../ui/common/Avatar";

const ChatContext = createContext(null);
export const useChatContext = () => useContext(ChatContext);
export const useApp = () => useContext(ChatContext) || {};

// ── Global toast bus (usable outside React too) ────────────────
let _addToast = null;
export function pushToast(toast) { _addToast?.(toast); }
export const toastError = (e) => pushToast({ kind: "error", title: "Something went wrong", body: e?.message || String(e) });
export const toastOk = (title, body) => pushToast({ kind: "success", title, body });

const readPref = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v === "true"; } catch { return d; } };

export function ChatProvider({ uid, children }) {
  const navigate = useNavigate();
  const [me, setMeRaw] = useState(() => getCachedMe(uid));
  const [chats, setChatsRaw] = useState(() => getCachedChats(uid));
  const [allUsers, setAllUsersRaw] = useState(() => getCachedAllUsers());
  const [chatsLoaded, setChatsLoaded] = useState(() => getCachedChats(uid).length > 0);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => readPref("arhub_sound", true));
  const [popupsEnabled, setPopupsEnabled] = useState(() => readPref("arhub_popups", true));
  const [activeChatId, setActiveChatId] = useState(null);

  const setMe = useCallback((next) => {
    setMeRaw(prev => { if (!hasChanged(prev, next)) return prev; cacheMe(uid, next); return next; });
  }, [uid]);
  const setChats = useCallback((next) => {
    setChatsRaw(prev => { if (!hasChanged(prev, next)) return prev; cacheChats(uid, next); return next; });
  }, [uid]);
  const setAllUsers = useCallback((next) => {
    setAllUsersRaw(prev => { if (!hasChanged(prev, next)) return prev; cacheAllUsers(next); return next; });
  }, []);

  const sessionStart = useRef(Date.now());
  const seenNotifIds = useRef(new Set());
  const activeChatIdRef = useRef(null);
  const meRef = useRef(me);
  const prefsRef = useRef({ soundEnabled, popupsEnabled });
  const chatsRef = useRef(chats);

  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);
  useEffect(() => { meRef.current = me; }, [me]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);
  useEffect(() => { prefsRef.current = { soundEnabled, popupsEnabled }; }, [soundEnabled, popupsEnabled]);

  // ── Toasts ───────────────────────────────────────────────────
  const dismissToast = useCallback((id) => setToasts(ts => ts.filter(t => t.id !== id)), []);
  useEffect(() => {
    _addToast = (t) => {
      const id = Date.now() + Math.random();
      // A newer toast from the same chat replaces the older one
      setToasts(ts => [...ts.filter(x => !t.group || x.group !== t.group).slice(-3), { ...t, id }]);
      setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), t.duration || 4500);
    };
    return () => { _addToast = null; };
  }, []);

  const toggleSound = useCallback(() => setSoundEnabled(s => { localStorage.setItem("arhub_sound", String(!s)); return !s; }), []);
  const togglePopups = useCallback(() => setPopupsEnabled(s => { localStorage.setItem("arhub_popups", String(!s)); return !s; }), []);

  // ── Presence ─────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;
    setPresence(uid, true);
    const onVis = () => setPresence(uid, document.visibilityState !== "hidden");
    const onExit = () => setPresence(uid, false);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onExit);
    // Heartbeat keeps lastSeen fresh so stale "online" states can be detected
    const hb = setInterval(() => { if (document.visibilityState === "visible") setPresence(uid, true); }, 120000);
    return () => {
      clearInterval(hb);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onExit);
    };
  }, [uid]);

  // ── Subscriptions ────────────────────────────────────────────
  useEffect(() => subscribeUser(uid, d => d && setMe(d)), [uid, setMe]);
  useEffect(() => subscribeChats(uid, d => { setChats(d); setChatsLoaded(true); }), [uid, setChats]);
  useEffect(() => subscribeAllUsers(setAllUsers), [setAllUsers]);

  // ── Delivery receipts: acknowledge new incoming messages ─────
  useEffect(() => {
    chats.forEach(c => {
      if (!c.lastMessageAt || c.lastMessageSenderId === uid) return;
      const last = toMillis(c.lastMessageAt);
      if (last > toMillis(c.deliveredAt?.[uid])) {
        updateDoc(doc(db, "chats", c.id), { [`deliveredAt.${uid}`]: Timestamp.now() }).catch(() => {});
      }
    });
  }, [chats, uid]);

  // Service-worker notification clicks → in-app navigation
  useEffect(() => {
    const onMsg = (e) => { if (e.data?.type === "navigate" && e.data.url) navigate(e.data.url); };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, [navigate]);

  // ── Notifications → toast / sound / system popup ─────────────
  useEffect(() => {
    if (!uid) return;
    return subscribeNotifications(uid, (notifs) => {
      setNotifications(prev => (hasChanged(prev, notifs) ? notifs : prev));
      const fresh = notifs.filter(n =>
        !n.read && !seenNotifIds.current.has(n.id) && toMillis(n.createdAt) > sessionStart.current - 2000);
      notifs.forEach(n => seenNotifIds.current.add(n.id));

      fresh.reverse().forEach(n => {
        const meNow = meRef.current || {};
        if (n.fromUid && (meNow.blocklist || []).includes(n.fromUid)) return;
        const isMsg = n.type === "message" || n.type === "mention";
        const visibleHere = document.visibilityState === "visible" && n.chatId && n.chatId === activeChatIdRef.current;
        if (isMsg && visibleHere) {
          // Already looking at it — just mark read quietly
          markNotificationRead(uid, n.id);
          return;
        }
        if (n.type === "message" && (meNow.mutedChats || []).includes(n.chatId)) return;
        if (meNow.notificationsEnabled === false && n.type !== "mention") return;

        const sender = n.senderName || "Someone";
        let title = sender, body = n.text || "";
        if (n.type === "message" && n.roomName) { title = n.roomName; body = `${sender}: ${n.text}`; }
        if (n.type === "mention") { title = `${sender} mentioned you${n.roomName ? ` in ${n.roomName}` : ""}`; body = n.text.replace(/^mentioned you: /, ""); }
        if (n.type === "friend_request") title = "New friend request";
        if (n.type === "friend_accepted") title = "Friend request accepted";
        if (n.type === "room_added") title = "Added to a room";
        if (n.type === "missed_call") title = "Missed call";

        const url = n.chatId ? `/chat/${n.chatId}` : n.type === "friend_request" ? "/contacts" : "/notifications";
        const { soundEnabled: snd, popupsEnabled: pop } = prefsRef.current;
        if (snd) sounds.notify();
        vibrate([40, 60, 40]);
        if (pop) pushToast({ kind: "notif", title, body, fromUid: n.fromUid, url, nid: n.id, group: n.chatId || n.id });
        if (document.visibilityState !== "visible") {
          showSystemNotification(title, { body, tag: n.chatId || n.id, url });
        }
      });
    });
  }, [uid]);

  // ── Derived data ─────────────────────────────────────────────
  const usersById = useMemo(() => {
    const m = {};
    allUsers.forEach(u => { m[u.uid] = u; });
    if (me) m[me.uid] = { ...m[me.uid], ...me };
    return m;
  }, [allUsers, me]);

  const chatTitle = useCallback((c) => {
    if (!c) return "";
    if (isGroup(c)) return c.name || "Room";
    const other = c.members?.find(m => m !== uid);
    return usersById[other]?.name || "Unknown";
  }, [usersById, uid]);

  const chatPartner = useCallback((c) => {
    if (!c || isGroup(c)) return null;
    return usersById[c.members?.find(m => m !== uid)] || null;
  }, [usersById, uid]);

  const visibleChats = useMemo(() => chats.filter(c => {
    if (c.deletedFor?.[uid]) return false;
    if (!isGroup(c)) {
      const other = c.members?.find(m => m !== uid);
      if (!other) return false;
    }
    return true;
  }), [chats, uid]);

  const totalUnread = useMemo(() => visibleChats.reduce((sum, c) => {
    if (c.id === activeChatId) return sum;
    if (me?.mutedChats?.includes(c.id)) return sum;
    if (me?.archivedChats?.includes(c.id)) return sum;
    return sum + (c.unreadCount?.[uid] > 0 ? 1 : 0);
  }, 0), [visibleChats, activeChatId, me, uid]);

  const unreadNotifs = notifications.filter(n => !n.read).length;
  useEffect(() => { setUnreadBadge(totalUnread); }, [totalUnread]);

  const markNotifRead = useCallback((nid) => markNotificationRead(uid, nid), [uid]);
  const markAllRead = useCallback(() => markAllNotificationsRead(uid), [uid]);

  const value = {
    me, uid, chats, visibleChats, chatsLoaded, allUsers, usersById,
    notifications, toasts, dismissToast,
    soundEnabled, toggleSound, popupsEnabled, togglePopups,
    activeChatId, setActiveChatId,
    totalUnread, unreadNotifs, markNotifRead, markAllRead,
    chatTitle, chatPartner,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} usersById={usersById} onOpen={(t) => { dismissToast(t.id); if (t.nid) markNotificationRead(uid, t.nid); if (t.url) navigate(t.url); }} />
    </ChatContext.Provider>
  );
}

// ── Toast UI ────────────────────────────────────────────────────
function ToastStack({ toasts, onDismiss, onOpen, usersById }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map(t => {
        const user = t.fromUid ? usersById[t.fromUid] : null;
        return (
          <div key={t.id} className={`toast toast-${t.kind || "info"}`} onClick={() => (t.url ? onOpen(t) : onDismiss(t.id))}>
            {user
              ? <Avatar src={user.avatar} name={user.name} size={36} />
              : <span className="toast-icon">{t.kind === "error" ? "⚠️" : t.kind === "success" ? "✅" : "🔔"}</span>}
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.body && <div className="toast-text">{t.body}</div>}
            </div>
            <button className="toast-x" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); onDismiss(t.id); }}>✕</button>
          </div>
        );
      })}
    </div>
  );
}
