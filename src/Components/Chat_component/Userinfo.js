import React, { useState } from 'react';
import { blockUser, unblockUser, unfriend, muteChat } from '../../lib/db';
import { chatId } from '../../lib/db';
import { IoClose, IoCallOutline, IoVideocamOutline } from 'react-icons/io5';
import { MdBlock, MdOutlineReport, MdPersonRemove } from 'react-icons/md';
import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import './userinfo1.css';

function Userinfo({ partner, me, uid, onClose, onDeleteChat, onBlocked }) {
  const [confirming, setConfirming] = useState(null); // 'unfriend' | 'block'
  const [busy, setBusy] = useState(false);

  if (!partner) return null;

  const cid = chatId(uid, partner.uid);
  const isBlocked = me?.blocklist?.includes(partner.uid);
  const isMuted = me?.mutedChats?.includes(cid);
  const isFriend = me?.friends?.includes(partner.uid);

  const lastSeenText = () => {
    if (partner.status === 'online') return 'Online';
    const ls = partner.lastSeen;
    if (!ls) return 'Last seen recently';
    const d = ls.toDate ? ls.toDate() : new Date(ls);
    const diffMs = Date.now() - d;
    if (diffMs < 60000) return 'Last seen just now';
    if (diffMs < 3600000) return `Last seen ${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `Last seen today at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    return `Last seen ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  };

  const doAction = async (action) => {
    if (busy) return;
    setBusy(true);
    try {
      if (action === 'block') {
        await blockUser(uid, partner.uid);
        // Close panel and navigate away — don't update state on unmounted component
        onClose();
        onBlocked?.();
        return; // finally still runs but component is already unmounting — harmless
      } else if (action === 'unblock') {
        await unblockUser(uid, partner.uid);
      } else if (action === 'unfriend') {
        await unfriend(uid, partner.uid);
      } else if (action === 'mute') {
        await muteChat(uid, cid, !isMuted);
      }
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  };

  const initials = (partner.name || '?').slice(0, 2).toUpperCase();

  return (
    <div className="userinfo-overlay" onClick={onClose}>
      <div className="userinfo-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="userinfo-header">
          <span className="userinfo-title">Contact Info</span>
          <button className="userinfo-close" onClick={onClose}><IoClose /></button>
        </div>

        {/* Avatar + name + status */}
        <div className="userinfo-hero">
          {partner.avatar
            ? <img className="userinfo-avatar" src={partner.avatar} alt={partner.name} />
            : <div className="userinfo-avatar-ph">{initials}</div>
          }
          <div className="userinfo-name">{partner.name}</div>
          <div className={`userinfo-status ${partner.status === 'online' ? 'on' : ''}`}>
            {lastSeenText()}
          </div>
        </div>

        {/* Quick actions */}
        <div className="userinfo-actions">
          <button className="userinfo-action-btn" title="Voice call">
            <IoCallOutline />
            <span>Audio</span>
          </button>
          <button className="userinfo-action-btn" title="Video call">
            <IoVideocamOutline />
            <span>Video</span>
          </button>
          <button
            className={`userinfo-action-btn ${isMuted ? 'active' : ''}`}
            title={isMuted ? 'Unmute' : 'Mute'}
            onClick={() => doAction('mute')}
            disabled={busy}
          >
            {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>

        {/* Bio */}
        <div className="userinfo-section">
          <div className="userinfo-section-label">About</div>
          <div className="userinfo-bio">{partner.bio || 'Hey, I\'m on AR Hub!'}</div>
        </div>

        {/* Email */}
        {partner.email && (
          <div className="userinfo-section">
            <div className="userinfo-section-label">Email</div>
            <div className="userinfo-field-val">{partner.email}</div>
          </div>
        )}

        {/* Joined */}
        {partner.createdAt && (
          <div className="userinfo-section">
            <div className="userinfo-section-label">Joined</div>
            <div className="userinfo-field-val">
              {(partner.createdAt.toDate ? partner.createdAt.toDate() : new Date(partner.createdAt))
                .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        )}

        {/* Danger zone */}
        <div className="userinfo-danger-zone">
          {isFriend && !confirming && (
            <button className="userinfo-danger-btn" onClick={() => setConfirming('unfriend')}>
              <MdPersonRemove /> Remove Friend
            </button>
          )}
          {confirming === 'unfriend' && (
            <div className="userinfo-confirm">
              <span>Remove {partner.name} as a friend?</span>
              <div className="userinfo-confirm-actions">
                <button className="userinfo-confirm-yes" onClick={() => doAction('unfriend')} disabled={busy}>
                  {busy ? 'Removing…' : 'Remove'}
                </button>
                <button className="userinfo-confirm-no" onClick={() => setConfirming(null)}>Cancel</button>
              </div>
            </div>
          )}

          {!confirming && (
            <button
              className="userinfo-danger-btn"
              onClick={() => setConfirming('block')}
            >
              <MdBlock /> {isBlocked ? 'Unblock' : 'Block'} {partner.name}
            </button>
          )}
          {confirming === 'block' && (
            <div className="userinfo-confirm">
              <span>{isBlocked ? 'Unblock' : 'Block'} {partner.name}?</span>
              <div className="userinfo-confirm-actions">
                <button
                  className="userinfo-confirm-yes"
                  onClick={() => doAction(isBlocked ? 'unblock' : 'block')}
                  disabled={busy}
                >
                  {busy ? '…' : (isBlocked ? 'Unblock' : 'Block')}
                </button>
                <button className="userinfo-confirm-no" onClick={() => setConfirming(null)}>Cancel</button>
              </div>
            </div>
          )}

          <button className="userinfo-danger-btn" onClick={() => { setConfirming(null); }}>
            <MdOutlineReport /> Report
          </button>

          {onDeleteChat && (
            <button className="userinfo-danger-btn" onClick={() => { onDeleteChat(); onClose(); }}>
              🗑️ Delete Chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Userinfo;
