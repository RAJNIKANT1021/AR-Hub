import React, { useEffect, useState } from "react";
import { subscribeAllUsers, acceptFriendRequest, declineFriendRequest } from "../lib/db";
import { IoCheckmarkCircle, IoCloseCircle } from "react-icons/io5";
import "./Chat_component/friends.css";

function FriendRequest({ uid }) {
  const [requests, setRequests] = useState([]);
  const [acting, setActing] = useState({});

  useEffect(() => {
    if (!uid) return;
    // Subscribe to all users to get request data + enriched profiles
    return subscribeAllUsers((list) => {
      const me = list.find(u => u.uid === uid) || {};
      const incoming = me.friendRequests || [];
      const enriched = incoming
        .map(rid => list.find(u => u.uid === rid))
        .filter(Boolean);
      setRequests(enriched);
    });
  }, [uid]);

  const accept = async (requesterUid) => {
    if (acting[requesterUid]) return;
    setActing(a => ({ ...a, [requesterUid]: true }));
    try {
      await acceptFriendRequest(uid, requesterUid);
    } finally {
      setActing(a => ({ ...a, [requesterUid]: false }));
    }
  };

  const decline = async (requesterUid) => {
    if (acting[requesterUid]) return;
    setActing(a => ({ ...a, [requesterUid]: true }));
    try {
      await declineFriendRequest(uid, requesterUid);
    } finally {
      setActing(a => ({ ...a, [requesterUid]: false }));
    }
  };

  return (
    <div className="friends-panel">
      <div className="friends-panel-header">
        <div className="friends-panel-title">Friend Requests</div>
        {requests.length > 0 && (
          <span className="friends-count-badge">{requests.length}</span>
        )}
      </div>

      <div className="friends-list">
        {requests.length === 0 && (
          <div className="friends-empty">
            <div className="friends-empty-icon">🤝</div>
            <p>No pending friend requests</p>
          </div>
        )}
        {requests.map(req => (
          <div key={req.uid} className="friend-row">
            <div className="friend-row-avatar-wrap">
              {req.avatar
                ? <img className="friend-row-avatar" src={req.avatar} alt={req.name} />
                : <div className="friend-row-avatar-ph">{(req.name || '?').slice(0, 2).toUpperCase()}</div>
              }
              {req.status === 'online' && <span className="friend-online-dot" />}
            </div>
            <div className="friend-row-info">
              <div className="friend-row-name">{req.name}</div>
              <div className="friend-row-bio">{req.bio || 'Wants to connect with you'}</div>
            </div>
            <div className="friend-row-actions">
              <button
                className="friend-accept-btn"
                onClick={() => accept(req.uid)}
                disabled={acting[req.uid]}
                title="Accept"
              >
                <IoCheckmarkCircle />
              </button>
              <button
                className="friend-decline-btn"
                onClick={() => decline(req.uid)}
                disabled={acting[req.uid]}
                title="Decline"
              >
                <IoCloseCircle />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendRequest;
