import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoCheckmarkDone, IoTrashOutline, IoClose } from "react-icons/io5";
import { useApp, toastError } from "../../Context/ChatContext";
import { clearNotifications, deleteNotification, loadMoreNotifications, acceptFriendRequest, declineFriendRequest } from "../../lib/db";
import { fmtRelative, toDate } from "../../lib/format";
import { notificationPermission, requestNotificationPermission } from "../../lib/notify";
import Avatar from "../common/Avatar";
import Empty from "../common/Empty";
import { Confirm } from "../common/Sheet";

const TYPE_ICON = { message: "💬", mention: "@", friend_request: "👋", friend_accepted: "🤝", room_added: "👥", missed_call: "📞", game_invite: "🎮" };
const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "mention", label: "Mentions" },
  { key: "social", label: "Requests" },
  { key: "calls", label: "Calls" },
];

function bucket(d) {
  if (!d) return "Earlier";
  const diff = Date.now() - d.getTime();
  if (d.toDateString() === new Date().toDateString()) return "Today";
  if (diff < 7 * 86400000) return "This week";
  return "Earlier";
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { uid, me, notifications, usersById, markNotifRead, markAllRead, unreadNotifs } = useApp();
  const [filter, setFilter] = useState("all");
  const [extra, setExtra] = useState([]);
  const [cursorDone, setCursorDone] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [perm, setPerm] = useState(notificationPermission());

  const all = useMemo(() => {
    const ids = new Set(notifications.map(n => n.id));
    return [...notifications, ...extra.filter(n => !ids.has(n.id))];
  }, [notifications, extra]);

  const list = all.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "mention") return n.type === "mention";
    if (filter === "social") return ["friend_request", "friend_accepted", "room_added"].includes(n.type);
    if (filter === "calls") return n.type === "missed_call" || n.type === "game_invite";
    return true;
  });

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const last = all[all.length - 1];
      if (!last) { setCursorDone(true); return; }
      const { notifs } = await loadMoreNotifications(uid, last.id);
      if (!notifs.length) setCursorDone(true);
      setExtra(e => [...e, ...notifs]);
    } catch (e) { toastError(e); } finally { setLoadingMore(false); }
  };

  const open = (n) => {
    if (!n.read) markNotifRead(n.id);
    if (n.chatId) navigate(`/chat/${n.chatId}`);
    else if (n.type === "friend_request" || n.type === "friend_accepted") navigate("/contacts");
    else if (n.type === "missed_call") navigate("/calls");
  };

  let lastBucket = null;

  return (
    <div className="page">
      <header className="page-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><IoArrowBack /></button>
        <h1 className="page-title sm">Notifications</h1>
        <button className="icon-btn" disabled={!unreadNotifs} title="Mark all read" onClick={() => markAllRead().catch(toastError)}><IoCheckmarkDone /></button>
        <button className="icon-btn" disabled={!all.length} title="Clear all" onClick={() => setConfirmClear(true)}><IoTrashOutline /></button>
      </header>
      <div className="page-body">
        <div className="page-inner">
          {perm !== "granted" && perm !== "unsupported" && (
            <div className="notif-banner" style={{ margin: "0 0 12px" }}>
              <div className="notif-banner-icon">🔔</div>
              <div className="notif-banner-text"><strong>Push notifications are {perm === "denied" ? "blocked" : "off"}</strong><span>{perm === "denied" ? "Allow notifications for this site in your browser settings." : "Get alerts for messages and calls while AR Hub is in the background."}</span></div>
              {perm === "default" && <button className="btn btn-primary btn-sm" onClick={async () => setPerm(await requestNotificationPermission())}>Enable</button>}
            </div>
          )}
          <div className="chips" style={{ marginBottom: 8 }}>
            {FILTERS.map(f => <button key={f.key} className={`chip ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>{f.label}</button>)}
          </div>
          {list.length === 0 && <Empty icon="🔔" title={filter === "all" ? "You're all caught up" : "Nothing here"} body="Messages, mentions, friend requests, room invites and missed calls show up here." />}
          <div className="notif-list">
            {list.map(n => {
              const b = bucket(toDate(n.createdAt));
              const head = b !== lastBucket ? (lastBucket = b) : null;
              const user = n.fromUid ? usersById[n.fromUid] : null;
              const pendingReq = n.type === "friend_request" && (me?.friendRequests || []).includes(n.fromUid);
              return (
                <React.Fragment key={n.id}>
                  {head && <div className="section-label">{head}</div>}
                  <div className={`notif-item ${n.read ? "" : "unread"}`} onClick={() => open(n)}>
                    <span className="notif-av">
                      <Avatar src={user?.avatar} name={user?.name || n.senderName} size={46} />
                      <span className="notif-type">{TYPE_ICON[n.type] || "🔔"}</span>
                    </span>
                    <div className="notif-body">
                      <div className="notif-text">
                        <strong>{user?.name || n.senderName || "AR Hub"}</strong>{" "}
                        {n.type === "message" ? (n.roomName ? <>in <strong>{n.roomName}</strong>: {n.text}</> : <>: {n.text}</>) : n.type === "mention" && n.roomName ? <>{n.text} <span className="muted-text">in {n.roomName}</span></> : (n.senderName && n.text?.startsWith(n.senderName) ? n.text.slice(n.senderName.length).trim() : n.text)}
                      </div>
                      <div className="notif-time">{fmtRelative(n.createdAt)}</div>
                      {pendingReq && (
                        <div className="notif-actions">
                          <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); acceptFriendRequest(uid, n.fromUid, me?.name).then(() => markNotifRead(n.id)).catch(toastError); }}>Accept</button>
                          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); declineFriendRequest(uid, n.fromUid).then(() => markNotifRead(n.id)).catch(toastError); }}>Decline</button>
                        </div>
                      )}
                    </div>
                    {!n.read && <span className="unread-dot" />}
                    <button className="icon-btn sm notif-x" aria-label="Remove" onClick={(e) => { e.stopPropagation(); deleteNotification(uid, n.id); setExtra(x => x.filter(y => y.id !== n.id)); }}><IoClose /></button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {all.length >= 50 && !cursorDone && (
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
              <button className="btn btn-ghost" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "Loading…" : "Load older"}</button>
            </div>
          )}
        </div>
      </div>
      <Confirm open={confirmClear} onClose={() => setConfirmClear(false)} danger title="Clear all notifications?" confirmLabel="Clear"
        onConfirm={() => { clearNotifications(uid).catch(toastError); setExtra([]); }} />
    </div>
  );
}
