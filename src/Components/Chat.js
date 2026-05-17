import React, { useState, useEffect, useRef, useCallback } from "react";
import "./chat1.css";
import ChatDescription from "./Chat_component/ChatDescription";
import Myprofile from "./Chat_component/Myprofile";
import Myavatar from "./Myavatar";
import FriendsList from "./Chat_component/FriendsList";
import FriendRequest from "./FriendRequest";
import SearchList from "./Chat_component/SearchList";
import { useChatContext } from "../Context/ChatContext";
import {
  ensureChat, muteChat, pinChat,
  deleteChatForEveryone,
  subscribeAllUsers, loadMoreNotifications,
} from "../lib/db";
import { subscribeCallLogs } from "../lib/webrtc";
import { cacheAllUsers, getCachedAllUsers, hasChanged } from "../lib/cache";
import { FiSearch, FiVolume2, FiVolumeX } from "react-icons/fi";
import {
  IoPersonOutline, IoPeopleOutline, IoAddOutline,
  IoChevronDown, IoArrowBack, IoNotificationsOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";

function fmtChatTime(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Notification Bell ──────────────────────────────────────────
function NotificationBell({ uid, onOpenChat }) {
  const ctx = useChatContext() || {};
  const { notifications = [], unreadNotifs = 0, markNotifRead, markAllRead } = ctx;
  const [open, setOpen] = useState(false);
  const [extraNotifs, setExtraNotifs] = useState([]);
  const [lastNotifDoc, setLastNotifDoc] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const ref = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) { setExtraNotifs([]); setLastNotifDoc(null); setHasMore(true); }
  }, [open]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleListScroll = async () => {
    const el = listRef.current;
    if (!el || loadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setLoadingMore(true);
      const { notifs, lastDoc } = await loadMoreNotifications(uid, lastNotifDoc);
      if (notifs.length === 0) { setHasMore(false); }
      else { setExtraNotifs(prev => [...prev, ...notifs]); setLastNotifDoc(lastDoc); }
      setLoadingMore(false);
    }
  };

  const handleNotifClick = async (n) => {
    if (markNotifRead) await markNotifRead(n.id);
    setOpen(false);
    if ((n.type === 'message' || n.type === 'friend_accepted') && n.fromUid) {
      onOpenChat?.(n.fromUid);
    }
  };

  const notifIcon = (type) => {
    if (type === 'friend_request') return '👋';
    if (type === 'friend_accepted') return '🤝';
    if (type === 'message') return '💬';
    return '🔔';
  };

  const allNotifs = [
    ...notifications,
    ...extraNotifs.filter(e => !notifications.find(n => n.id === e.id)),
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="chat-sidebar-icon-btn" onClick={() => setOpen(s => !s)} title="Notifications">
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IoNotificationsOutline />
          {unreadNotifs > 0 && (
            <span className="notif-bell-badge">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {unreadNotifs > 0 && markAllRead && (
              <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <div className="notif-list" ref={listRef} onScroll={handleListScroll}>
            {allNotifs.length === 0 && (
              <div className="notif-empty">
                <div style={{ fontSize: '2rem', marginBottom: '.4rem' }}>🔔</div>
                No notifications yet
              </div>
            )}
            {allNotifs.map(n => (
              <div
                key={n.id}
                className={`notif-item ${!n.read ? 'unread' : ''}`}
                onClick={() => handleNotifClick(n)}
              >
                <div className="notif-icon">{notifIcon(n.type)}</div>
                <div className="notif-body">
                  <div className="notif-sender">{n.senderName || 'Someone'}</div>
                  <div className="notif-text">{n.text}</div>
                  <div className="notif-time">{n.createdAt ? fmtChatTime(n.createdAt) : ''}</div>
                </div>
                {!n.read && <div className="notif-unread-dot" />}
              </div>
            ))}
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: '.5rem' }}>
                <div className="chatdesc-load-spinner" style={{ margin: '0 auto' }} />
              </div>
            )}
            {!hasMore && allNotifs.length > 0 && (
              <div style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text-tertiary)', padding: '.5rem' }}>
                You're all caught up ✓
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Chat component ────────────────────────────────────────
function Chat({ uid }) {
  const ctx = useChatContext() || {};
  const { me, chats = [], soundEnabled, toggleSound, activeChatId, setActiveChatId } = ctx;

  const [search, setSearch] = useState("");
  const [sidePanel, setSidePanel] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [chatPartnerInfo, setChatPartnerInfo] = useState(null);
  const [allUsers, setAllUsers] = useState(() => getCachedAllUsers());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Stable sort order — only update when a chat's sortTs actually changes
  const sortOrderRef = useRef([]); // array of cid in current display order

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (!uid) return;
    return subscribeAllUsers((users) => {
      setAllUsers(prev => {
        if (!hasChanged(prev, users)) return prev;
        cacheAllUsers(users);
        return users;
      });
    });
  }, [uid]);

  // Call logs
  const [callLogs, setCallLogs] = useState([]);
  useEffect(() => {
    if (!uid) return;
    return subscribeCallLogs(uid, setCallLogs);
  }, [uid]);

  const mutedChats  = me?.mutedChats  || [];
  const pinnedChats = me?.pinnedChats || [];
  const blocklist   = me?.blocklist   || [];

  // Build enriched list — filter + map, no sort yet
  const enrichedMap = {};
  chats.forEach(c => {
    const deletedAt = c.deletedFor?.[uid];
    if (deletedAt) {
      const lm = c.lastMessageAt;
      if (!lm || lm.toMillis() <= deletedAt.toMillis()) return;
    }
    const otherId = c.members?.find(m => m !== uid);
    if (!otherId) return;
    // Hide chats with blocked users from the sidebar entirely
    if (blocklist.includes(otherId)) return;
    const other = allUsers.find(u => u.uid === otherId) || {};
    const name = other.name || 'Unknown';
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return;
    enrichedMap[c.id] = {
      ...c,
      otherId,
      otherName: name,
      otherAvatar: other.avatar || null,
      otherStatus: other.status || 'offline',
      unread: c.unreadCount?.[uid] || 0,
      muted: mutedChats.includes(c.id),
      pinned: pinnedChats.includes(c.id),
      _sortTs: (c.lastMessageAt ?? c.createdAt)?.toMillis?.() || 0,
    };
  });

  // Stable sort: compute desired new order, then only swap items whose sortTs changed
  const newIds = Object.keys(enrichedMap).sort((a, b) => {
    const ca = enrichedMap[a], cb = enrichedMap[b];
    if (ca.pinned && !cb.pinned) return -1;
    if (!ca.pinned && cb.pinned) return 1;
    return cb._sortTs - ca._sortTs;
  });

  // Merge with stable ref: if an id is already in sortOrderRef and its order is close, keep it
  // This prevents flicker when two chats have the same timestamp or swap rapidly
  const prevOrder = sortOrderRef.current;
  const prevSet = new Set(prevOrder);
  const newSet = new Set(newIds);

  // Remove ids that no longer exist, keep existing order for survivors, append new ones
  const stable = [
    ...prevOrder.filter(id => newSet.has(id)),
    ...newIds.filter(id => !prevSet.has(id)),
  ];

  // Re-sort only when pinning changes or sortTs gap > 1 second (real new message, not metadata flicker)
  const needsResort = newIds.some((id, i) => {
    const stableId = stable[i];
    if (!stableId || stableId !== id) {
      // Check if the reorder is because of a pinned change
      const cn = enrichedMap[id];
      const cs = stableId ? enrichedMap[stableId] : null;
      if (cn?.pinned !== cs?.pinned) return true;
      // Only re-sort if sortTs difference > 1s (real message, not Firestore server timestamp settling)
      const tsDiff = cs ? Math.abs(cn._sortTs - cs._sortTs) : Infinity;
      return tsDiff > 1000;
    }
    return false;
  });

  const displayIds = needsResort ? newIds : stable;
  sortOrderRef.current = displayIds;

  const enrichedChats = displayIds.map(id => enrichedMap[id]).filter(Boolean);

  const openChatByUserId = useCallback(async (targetUid) => {
    const user = allUsers.find(u => u.uid === targetUid);
    if (!user) return;
    const cid = await ensureChat(uid, targetUid);
    setActiveChatId?.(cid);
    setSidePanel(null);
    setChatPartnerInfo(user);
  }, [uid, allUsers, setActiveChatId]);

  const openChat = useCallback(async (user) => {
    const cid = await ensureChat(uid, user.uid);
    setActiveChatId?.(cid);
    setSidePanel(null);
    setChatPartnerInfo(user);
  }, [uid, setActiveChatId]);

  const openPanel = (panel) => { setSidePanel(panel); setShowMenu(false); };
  const closePanel = () => setSidePanel(null);

  const panelTitle = sidePanel === 'profile'  ? 'My Profile'
    : sidePanel === 'friends'  ? 'Friends'
    : sidePanel === 'requests' ? 'Friend Requests'
    : sidePanel === 'search'   ? 'Find People'
    : sidePanel === 'avatar'   ? 'Set Avatar'
    : sidePanel === 'calls'    ? 'Call Logs'
    : 'Chats';

  const renderPanel = () => {
    if (sidePanel === 'profile')  return <Myprofile uid={uid} me={me} />;
    if (sidePanel === 'avatar')   return <Myavatar uid={uid} me={me} />;
    if (sidePanel === 'friends')  return <FriendsList uid={uid} onStartChat={(u) => { openChat(u); closePanel(); }} />;
    if (sidePanel === 'requests') return <FriendRequest uid={uid} />;
    if (sidePanel === 'search')   return <SearchList uid={uid} onStartChat={(u) => { openChat(u); closePanel(); }} />;
    if (sidePanel === 'calls')    return <CallLogsPanel logs={callLogs} allUsers={allUsers} onStartChat={openChatByUserId} />;
    return null;
  };

  const showChatArea = !!(activeChatId && chatPartnerInfo);
  const showSidebar = !isMobile || !showChatArea;

  return (
    <div className="chat-root">
      {/* ── Sidebar ── */}
      {showSidebar && (
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <div className="chat-sidebar-top">
              {sidePanel && (
                <button className="chat-sidebar-icon-btn" onClick={closePanel} title="Back">
                  <IoArrowBack />
                </button>
              )}
              <span className="chat-sidebar-title">{panelTitle}</span>

              {!sidePanel && (
                <>
                  <NotificationBell uid={uid} onOpenChat={openChatByUserId} />
                  <button
                    className="chat-sidebar-icon-btn"
                    onClick={toggleSound}
                    title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
                  >
                    {soundEnabled ? <FiVolume2 /> : <FiVolumeX />}
                  </button>
                  <div style={{ position: 'relative' }} ref={menuRef}>
                    <button className="chat-sidebar-icon-btn" onClick={() => setShowMenu(s => !s)} title="More">
                      <IoPersonOutline />
                      <IoChevronDown style={{ fontSize: '.6rem', marginLeft: '1px' }} />
                    </button>
                    {showMenu && (
                      <div className="chat-user-menu">
                        <div className="chat-menu-item" onClick={() => openPanel('profile')}><IoPersonOutline /> My Profile</div>
                        <div className="chat-menu-item" onClick={() => openPanel('avatar')}><IoPersonOutline /> Set Avatar</div>
                        <div className="chat-menu-item" onClick={() => openPanel('friends')}><IoPeopleOutline /> Friends</div>
                        <div className="chat-menu-item" onClick={() => openPanel('requests')}><IoAddOutline /> Friend Requests</div>
                        <div className="chat-menu-item" onClick={() => openPanel('search')}><FiSearch /> Find People</div>
                        <div className="chat-menu-item" onClick={() => openPanel('calls')}>📞 Call Logs</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {!sidePanel && (
              <div className="chat-search-wrap">
                <FiSearch className="chat-search-icon" />
                <input
                  className="chat-search-input"
                  placeholder="Search chats…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}
          </div>

          {sidePanel ? (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {renderPanel()}
            </div>
          ) : (
            <div className="chat-contacts">
              {enrichedChats.length === 0 && allUsers.length === 0 && !search && (
                // Skeleton tiles while data loads
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="contact-skeleton">
                    <div className="skel-avatar" style={{ animationDelay: `${i * 0.1}s` }} />
                    <div className="skel-lines">
                      <div className="skel-line short" style={{ animationDelay: `${i * 0.1 + 0.05}s` }} />
                      <div className="skel-line xshort" style={{ animationDelay: `${i * 0.1 + 0.1}s` }} />
                    </div>
                  </div>
                ))
              )}
              {enrichedChats.length === 0 && allUsers.length > 0 && (
                <div className="chat-empty-state">
                  <div className="chat-empty-icon">💬</div>
                  {search
                    ? <p>No chats matching "{search}"</p>
                    : <>
                        <p>No conversations yet</p>
                        <button className="chat-find-btn" onClick={() => openPanel('search')}>Find People</button>
                      </>
                  }
                </div>
              )}
              {enrichedChats.map((c, i) => (
                <ChatTileItem
                  key={c.id}
                  chat={c}
                  active={activeChatId === c.id}
                  index={i}
                  onClick={() => openChat({ uid: c.otherId, name: c.otherName, avatar: c.otherAvatar, status: c.otherStatus, bio: '' })}
                  onMute={() => muteChat(uid, c.id, !c.muted)}
                  onDelete={() => {
                    deleteChatForEveryone(c.id);
                    if (activeChatId === c.id) { setActiveChatId?.(null); setChatPartnerInfo(null); }
                  }}
                  onPin={() => pinChat(uid, c.id, !c.pinned)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat window ── */}
      <div className={`chat-main ${isMobile && !showChatArea ? 'chat-main-hidden' : ''}`}>
        <ChatDescription
          uid={uid}
          me={me}
          cid={activeChatId}
          partner={chatPartnerInfo}
          onBack={() => {
            setActiveChatId?.(null);
            setChatPartnerInfo(null);
            navigate('/chat');
          }}
        />
      </div>
    </div>
  );
}

// ── Chat tile with context menu ────────────────────────────────
function ChatTileItem({ chat, active, index, onClick, onMute, onDelete, onPin }) {
  const [ctxMenu, setCtxMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setCtxMenu(false); setConfirmDelete(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = (chat.otherName || '?').slice(0, 2).toUpperCase();

  return (
    <div
      ref={ref}
      className={`chat-tile-wrap ${active ? 'active' : ''}`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}
      onClick={onClick}
      onContextMenu={e => { e.preventDefault(); setCtxMenu(true); setConfirmDelete(false); }}
    >
      <div className="chat-tile-avatar-wrap">
        {chat.otherAvatar
          ? <img className="chat-tile-avatar" src={chat.otherAvatar} alt={chat.otherName} />
          : <div className="chat-tile-avatar-ph">{initials}</div>
        }
        {chat.otherStatus === 'online' && <span className="chat-tile-online" />}
      </div>

      <div className="chat-tile-body">
        <div className="chat-tile-row1">
          <span className="chat-tile-name">
            {chat.pinned && <span style={{ marginRight: 4, fontSize: '.75rem' }}>📌</span>}
            {chat.otherName}
          </span>
          <span className="chat-tile-time">{fmtChatTime(chat.lastMessageAt)}</span>
        </div>
        <div className="chat-tile-row2">
          <span className="chat-tile-preview">
            {chat.muted && <span className="chat-tile-muted-icon" style={{ marginRight: 3 }}>🔇</span>}
            {chat.lastMessage || <em style={{ opacity: .6 }}>No messages yet</em>}
          </span>
          {chat.unread > 0 && (
            <span className={`chat-tile-badge ${chat.muted ? 'muted' : ''}`}>
              {chat.unread > 99 ? '99+' : chat.unread}
            </span>
          )}
        </div>
      </div>

      {ctxMenu && !confirmDelete && (
        <div className="chat-ctx-menu" onClick={e => e.stopPropagation()}>
          <div className="chat-ctx-item" onClick={() => { onClick(); setCtxMenu(false); }}>💬 Open</div>
          <div className="chat-ctx-item" onClick={() => { onPin(); setCtxMenu(false); }}>
            {chat.pinned ? '📌 Unpin' : '📌 Pin'}
          </div>
          <div className="chat-ctx-item" onClick={() => { onMute(); setCtxMenu(false); }}>
            {chat.muted ? '🔔 Unmute' : '🔇 Mute'}
          </div>
          <div className="chat-ctx-item danger" onClick={() => setConfirmDelete(true)}>🗑️ Delete Chat</div>
        </div>
      )}

      {ctxMenu && confirmDelete && (
        <div className="chat-ctx-menu" onClick={e => e.stopPropagation()}>
          <div style={{ padding: '.6rem 1rem', fontSize: '.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
            Delete this chat?
          </div>
          <div className="chat-ctx-item danger" onClick={() => { onDelete(); setCtxMenu(false); setConfirmDelete(false); }}>
            Yes, delete
          </div>
          <div className="chat-ctx-item" onClick={() => setConfirmDelete(false)}>Cancel</div>
        </div>
      )}
    </div>
  );
}

// ── Call Logs Panel ────────────────────────────────────────────
function CallLogsPanel({ logs, allUsers, onStartChat }) {
  function fmtDur(secs) {
    if (!secs) return 'No answer';
    const m = Math.floor(secs / 60), s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
  function fmtTime(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString('en-IN', { weekday: 'short' });
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  if (logs.length === 0) {
    return (
      <div className="chat-empty-state" style={{ marginTop: '3rem' }}>
        <div className="chat-empty-icon">📞</div>
        <p>No call history yet</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '.25rem 0' }}>
      {logs.map(log => {
        const other = allUsers.find(u => u.uid === log.partnerId);
        const name = log.partnerName || other?.name || 'Unknown';
        const avatar = log.partnerAvatar || other?.avatar;
        const initials = name.slice(0, 2).toUpperCase();
        const isVideo = log.callType === 'video';
        const isMissed = log.status === 'missed';
        const isOut = log.direction === 'outgoing';

        return (
          <div
            key={log.id}
            className="chat-tile-wrap"
            onClick={() => log.partnerId && onStartChat(log.partnerId)}
            style={{ cursor: 'pointer' }}
          >
            <div className="chat-tile-avatar-wrap">
              {avatar
                ? <img className="chat-tile-avatar" src={avatar} alt={name} />
                : <div className="chat-tile-avatar-ph">{initials}</div>
              }
            </div>
            <div className="chat-tile-body">
              <div className="chat-tile-row1">
                <span className="chat-tile-name">{name}</span>
                <span className="chat-tile-time">{fmtTime(log.createdAt)}</span>
              </div>
              <div className="chat-tile-row2">
                <span className="chat-tile-preview" style={{ color: isMissed ? '#e74c3c' : 'var(--text-secondary)' }}>
                  {isOut ? '↗ ' : '↙ '}
                  {isVideo ? '📹' : '📞'} {isMissed ? 'Missed' : fmtDur(log.duration)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Chat;
