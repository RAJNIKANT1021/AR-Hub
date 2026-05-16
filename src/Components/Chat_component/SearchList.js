import React, { useEffect, useState } from "react";
import { subscribeAllUsers, sendFriendRequest, cancelFriendRequest } from "../../lib/db";
import Fuse from "fuse.js";
import { IoPersonAddOutline, IoCheckmarkCircle, IoCopyOutline, IoCloseCircle } from "react-icons/io5";
import "./friends1.css";

function SearchList({ uid, onStartChat }) {
  const [allUsers, setAllUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [localQuery, setLocalQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState(null);
  const [acting, setActing] = useState({});

  useEffect(() => {
    if (!uid) return;
    return subscribeAllUsers((list) => {
      const me = list.find(u => u.uid === uid) || {};
      const myFriends = me.friends || [];
      const mySent = me.sentRequests || [];
      const myIncoming = me.friendRequests || [];

      const others = list
        .filter(u => u.uid !== uid)
        .map(u => ({
          ...u,
          isFriend: myFriends.includes(u.uid),
          requestSent: mySent.includes(u.uid),
          requestReceived: myIncoming.includes(u.uid),
        }));
      setAllUsers(others);
    });
  }, [uid]);

  useEffect(() => {
    const q = localQuery.trim();
    if (!q) { setResults(allUsers.slice(0, 20)); return; }
    const fuse = new Fuse(allUsers, {
      keys: ['name'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 1,
    });
    setResults(fuse.search(q).map(r => r.item).slice(0, 20));
  }, [localQuery, allUsers]);

  const sendReq = async (targetUid) => {
    if (!uid || acting[targetUid]) return;
    setActing(a => ({ ...a, [targetUid]: true }));
    try {
      await sendFriendRequest(uid, targetUid);
    } finally {
      setActing(a => ({ ...a, [targetUid]: false }));
    }
  };

  const cancelReq = async (targetUid) => {
    if (!uid || acting[targetUid]) return;
    setActing(a => ({ ...a, [targetUid]: true }));
    try {
      await cancelFriendRequest(uid, targetUid);
    } finally {
      setActing(a => ({ ...a, [targetUid]: false }));
    }
  };

  const copyInvite = (targetUid) => {
    const link = `${window.location.origin}/?invite=${targetUid}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(targetUid);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  return (
    <div className="friends-panel">
      <div className="friends-panel-header">
        <div className="friends-search">
          <input
            className="friends-search-input"
            placeholder="Search by name…"
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      <div className="friends-list">
        {results.length === 0 && (
          <div className="friends-empty">
            <div className="friends-empty-icon">🔍</div>
            <p>{localQuery ? `No users found for "${localQuery}"` : 'Start typing to search'}</p>
          </div>
        )}

        {results.map(user => (
          <div key={user.uid} className="friend-row">
            <div className="friend-row-avatar-wrap">
              {user.avatar
                ? <img className="friend-row-avatar" src={user.avatar} alt={user.name} />
                : <div className="friend-row-avatar-ph">{(user.name || '?').slice(0, 2).toUpperCase()}</div>
              }
              {user.status === 'online' && <span className="friend-online-dot" />}
            </div>
            <div className="friend-row-info">
              <div className="friend-row-name">{user.name}</div>
              <div className="friend-row-bio">{user.bio || 'AR Hub user'}</div>
            </div>
            <div className="friend-row-actions">
              <button
                className="friend-row-invite-btn"
                onClick={() => copyInvite(user.uid)}
                title="Copy invite link"
              >
                {copiedLink === user.uid ? <IoCheckmarkCircle style={{ color: 'var(--accent)' }} /> : <IoCopyOutline />}
              </button>
              {user.isFriend ? (
                <button
                  className="friend-chat-btn"
                  onClick={() => onStartChat?.(user)}
                  title="Open chat"
                >
                  Message
                </button>
              ) : user.requestSent ? (
                <button
                  className="friend-cancel-btn"
                  onClick={() => cancelReq(user.uid)}
                  disabled={acting[user.uid]}
                  title="Cancel request"
                >
                  {acting[user.uid] ? '…' : <><IoCloseCircle /> Cancel</>}
                </button>
              ) : user.requestReceived ? (
                <div className="friend-status-badge incoming">Wants to connect</div>
              ) : (
                <button
                  className="friend-add-btn"
                  onClick={() => sendReq(user.uid)}
                  disabled={acting[user.uid]}
                >
                  <IoPersonAddOutline />
                  {acting[user.uid] ? 'Sending…' : 'Add'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchList;
