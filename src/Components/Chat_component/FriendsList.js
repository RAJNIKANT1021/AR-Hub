import React, { useEffect, useState } from "react";
import { subscribeAllUsers, unfriend } from "../../lib/db";
import "./friends1.css";

function FriendsList({ uid, onStartChat }) {
  const [friends, setFriends] = useState([]);
  const [acting, setActing] = useState({});

  useEffect(() => {
    if (!uid) return;
    return subscribeAllUsers((list) => {
      const me = list.find(u => u.uid === uid) || {};
      const myFriends = me.friends || [];
      const enriched = myFriends
        .map(fid => list.find(u => u.uid === fid))
        .filter(Boolean);
      setFriends(enriched);
    });
  }, [uid]);

  const removeFriend = async (friendUid) => {
    if (acting[friendUid]) return;
    setActing(a => ({ ...a, [friendUid]: true }));
    try {
      await unfriend(uid, friendUid);
    } finally {
      setActing(a => ({ ...a, [friendUid]: false }));
    }
  };

  const onlineCount = friends.filter(f => f.status === 'online').length;

  return (
    <div className="friends-panel">
      <div className="friends-panel-header">
        <div style={{ flex: 1 }}>
          <div className="friends-panel-title">My Friends</div>
          <div style={{ fontSize: '.75rem', color: 'var(--text-secondary)', marginTop: '.1rem' }}>
            {friends.length} friends · <span style={{ color: 'var(--online)' }}>{onlineCount} online</span>
          </div>
        </div>
        {friends.length > 0 && (
          <span className="friends-count-badge">{friends.length}</span>
        )}
      </div>

      <div className="friends-list">
        {friends.length === 0 && (
          <div className="friends-empty">
            <div className="friends-empty-icon">👥</div>
            <p>No friends yet. Search to add people!</p>
          </div>
        )}
        {friends.map(f => (
          <div key={f.uid} className="friend-row">
            <div className="friend-row-avatar-wrap">
              {f.avatar
                ? <img className="friend-row-avatar" src={f.avatar} alt={f.name} />
                : <div className="friend-row-avatar-ph">{(f.name || '?').slice(0, 2).toUpperCase()}</div>
              }
              {f.status === 'online' && <span className="friend-online-dot" />}
            </div>
            <div className="friend-row-info">
              <div className="friend-row-name">{f.name}</div>
              <div className="friend-row-bio" style={{ color: f.status === 'online' ? 'var(--online)' : undefined }}>
                {f.status === 'online' ? 'online' : (f.bio || 'AR Hub user')}
              </div>
            </div>
            <div className="friend-row-actions">
              {onStartChat && (
                <button
                  className="friend-chat-btn"
                  onClick={() => onStartChat(f)}
                  title="Message"
                >
                  Message
                </button>
              )}
              <button
                className="friend-remove-btn"
                onClick={() => removeFriend(f.uid)}
                disabled={acting[f.uid]}
                title="Unfriend"
              >
                {acting[f.uid] ? '…' : 'Unfriend'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendsList;
