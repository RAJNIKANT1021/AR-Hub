import React, { useState, useRef, useEffect } from "react";
import "./message1.css";
import { addReaction, deleteMessage, deleteMessageForEveryone, editMessage, votePoll } from "../../lib/db";

// ── WhatsApp-style read ticks ──────────────────────────────────
function MsgTicks({ readBy, isOptimistic }) {
  if (isOptimistic) {
    return <span className="msg-ticks" title="Sending…">🕐</span>;
  }
  const color = readBy?.length > 1 ? '#53bdeb' : 'var(--text-tertiary)';
  if (!readBy || readBy.length === 0) {
    return <span className="msg-ticks">✓</span>;
  }
  if (readBy.length === 1) {
    return (
      <span className="msg-ticks" style={{ color }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 5.5l3.5 3.5L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 5.5l3.5 3.5L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="msg-ticks read" style={{ color }}>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        <path d="M1 5.5l3.5 3.5L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 5.5l3.5 3.5L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

// ── Highlight search terms in text ────────────────────────────
function HighlightedText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="msg-highlight">{part}</mark>
          : part
      )}
    </>
  );
}

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// ── Poll card ──────────────────────────────────────────────────
function PollCard({ poll, cid, mid, uid }) {
  const [voting, setVoting] = useState(false);
  if (!poll?.options) return null;

  const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
  const myVoteIdx = poll.options.findIndex(o => o.votes?.includes(uid));

  const vote = async (optIdx) => {
    if (voting) return;
    setVoting(true);
    try { await votePoll(cid, mid, uid, optIdx); }
    finally { setVoting(false); }
  };

  return (
    <div className="poll-card">
      <div className="poll-question">📊 {poll.question}</div>
      {poll.options.map((opt, i) => {
        const votes = opt.votes?.length || 0;
        const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
        const isMyVote = myVoteIdx === i;
        return (
          <div
            key={i}
            className={`poll-option ${isMyVote ? 'voted' : ''} ${myVoteIdx !== -1 ? 'revealed' : ''}`}
            onClick={() => vote(i)}
          >
            <div className="poll-bar-bg" style={{ width: `${pct}%` }} />
            <div className="poll-option-inner">
              <span>{opt.text}</span>
              {myVoteIdx !== -1 && <span className="poll-pct">{pct}%</span>}
            </div>
            {isMyVote && <span className="poll-checkmark">✓</span>}
          </div>
        );
      })}
      <div className="poll-votes">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>
    </div>
  );
}

// ── Reply quote bubble ─────────────────────────────────────────
function ReplyBubble({ replyTo, sender }) {
  if (!replyTo) return null;
  const preview = replyTo.text
    ? (replyTo.text.length > 80 ? replyTo.text.slice(0, 80) + '…' : replyTo.text)
    : (replyTo.type === 'poll' ? '📊 Poll' : '');
  return (
    <div className={`msg-reply-quote ${sender ? 'out' : 'in'}`}>
      <span className="msg-reply-name">{replyTo.senderName || 'Unknown'}</span>
      <span className="msg-reply-preview">{preview}</span>
    </div>
  );
}

// ── Message row ────────────────────────────────────────────────
function Message({
  message, sender, cid, uid,
  partnerName, partnerAvatar, myAvatar,
  onReply, onForward, highlighted, searchQuery, isOptimistic,
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCtx, setShowCtx] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const pickerRef = useRef(null);
  const ctxRef = useRef(null);
  const editRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
      if (ctxRef.current && !ctxRef.current.contains(e.target)) setShowCtx(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [editing, editText.length]);

  // Deleted for everyone
  if (message.deletedForEveryone) {
    return (
      <div className={`msg-row ${sender ? 'out' : 'in'} ${message._firstInGroup === false ? 'msg-row-grouped' : ''}`}>
        <div className="msg-deleted">🚫 This message was deleted</div>
      </div>
    );
  }

  // Soft-deleted for this user only
  if (message.deletedFor?.includes(uid)) {
    return (
      <div className={`msg-row ${sender ? 'out' : 'in'} ${message._firstInGroup === false ? 'msg-row-grouped' : ''}`}>
        <div className="msg-deleted">🚫 Message deleted</div>
      </div>
    );
  }

  const doReact = async (emoji) => {
    setShowPicker(false);
    if (!cid || !message.id || isOptimistic) return;
    await addReaction(cid, message.id, uid, emoji);
  };

  const doDeleteForMe = async () => {
    if (deleting || !cid || !message.id || isOptimistic) return;
    setDeleting(true);
    setShowCtx(false);
    setShowDeleteMenu(false);
    await deleteMessage(cid, message.id, uid);
    setDeleting(false);
  };

  const doDeleteForEveryone = async () => {
    if (deleting || !cid || !message.id || isOptimistic) return;
    setDeleting(true);
    setShowCtx(false);
    setShowDeleteMenu(false);
    await deleteMessageForEveryone(cid, message.id);
    setDeleting(false);
  };

  const startEdit = () => {
    if (!sender || message.type !== 'text') return;
    setEditText(message.text || '');
    setEditing(true);
    setShowCtx(false);
  };

  const saveEdit = async () => {
    if (savingEdit || !editText.trim() || editText === message.text) {
      setEditing(false);
      return;
    }
    setSavingEdit(true);
    await editMessage(cid, message.id, editText.trim());
    setSavingEdit(false);
    setEditing(false);
  };

  const handleEditKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') setEditing(false);
  };

  const time = message.createdAt
    ? (() => {
        const d = message.createdAt.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
        return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      })()
    : '';

  const reactions = message.reactions || {};
  const reactionCounts = {};
  Object.values(reactions).forEach(e => {
    if (e) reactionCounts[e] = (reactionCounts[e] || 0) + 1;
  });
  const myReaction = reactions[uid];

  const initials = (partnerName || '?').slice(0, 2).toUpperCase();
  const isGrouped = message._firstInGroup === false;
  const showAvatar = !isGrouped;

  return (
    <div
      className={`msg-row ${sender ? 'out' : 'in'} ${isGrouped ? 'msg-row-grouped' : ''} ${highlighted ? 'msg-row-highlighted' : ''} ${isOptimistic ? 'msg-row-optimistic' : ''}`}
      onContextMenu={e => { e.preventDefault(); if (!isOptimistic) setShowCtx(true); }}
    >
      {/* Avatar — incoming only */}
      {!sender && (
        showAvatar
          ? (partnerAvatar
              ? <img className="msg-avatar" src={partnerAvatar} alt={partnerName} />
              : <div className="msg-avatar-placeholder">{initials}</div>)
          : <div className="msg-avatar-spacer" />
      )}

      <div className="msg-bubble-wrap">
        {/* Reaction picker trigger — hidden for optimistic */}
        {!isOptimistic && (
          <div className="msg-react-btn" ref={pickerRef} onClick={e => { e.stopPropagation(); setShowPicker(s => !s); }}>
            {myReaction || '😊'}
            {showPicker && (
              <div className="reaction-picker" onClick={e => e.stopPropagation()}>
                {REACTIONS.map(e => (
                  <span key={e} className={`reaction-option ${myReaction === e ? 'selected' : ''}`} onClick={() => doReact(e)}>{e}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message content */}
        {message.type === 'poll' ? (
          <PollCard poll={message.poll} cid={cid} mid={message.id} uid={uid} />
        ) : (
          <div className={`msg-bubble ${sender ? 'out' : 'in'}`}>
            {/* Reply quote */}
            <ReplyBubble replyTo={message.replyTo} sender={sender} />

            {/* Forwarded label */}
            {message.forwarded && (
              <div className="msg-forwarded-label">↪ Forwarded</div>
            )}

            {/* Text or inline edit */}
            {editing ? (
              <div className="msg-edit-wrap">
                <textarea
                  ref={editRef}
                  className="msg-edit-input"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={handleEditKey}
                  rows={Math.min(5, editText.split('\n').length + 1)}
                />
                <div className="msg-edit-actions">
                  <button className="msg-edit-save" onClick={saveEdit} disabled={savingEdit}>
                    {savingEdit ? '…' : 'Save'}
                  </button>
                  <button className="msg-edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <span className="msg-text">
                <HighlightedText text={message.text} query={searchQuery} />
              </span>
            )}

            <div className="msg-meta">
              {message.edited && !editing && <span className="msg-edited">(edited)</span>}
              <span className="msg-time">{time}</span>
              {sender && <MsgTicks readBy={message.readBy} isOptimistic={isOptimistic} />}
            </div>
          </div>
        )}

        {/* Reactions display */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className={`msg-reactions ${sender ? 'out' : ''}`}>
            {Object.entries(reactionCounts).map(([emoji, count]) => (
              <div key={emoji} className={`msg-reaction-chip ${myReaction === emoji ? 'mine' : ''}`} onClick={() => doReact(emoji)}>
                {emoji} <span>{count > 1 ? count : ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* Context menu on right-click */}
        {showCtx && !showDeleteMenu && (
          <div ref={ctxRef} className={`msg-ctx-menu ${sender ? 'out' : 'in'}`} onClick={e => e.stopPropagation()}>
            {onReply && (
              <div className="msg-ctx-item" onClick={() => { onReply(message); setShowCtx(false); }}>↩ Reply</div>
            )}
            {onForward && message.type === 'text' && message.text && (
              <div className="msg-ctx-item" onClick={() => { onForward(message); setShowCtx(false); }}>↪ Forward</div>
            )}
            <div className="msg-ctx-item" onClick={() => { doReact('👍'); setShowCtx(false); }}>👍 React</div>
            <div className="msg-ctx-item" onClick={() => {
              if (message.text) navigator.clipboard.writeText(message.text).catch(() => {});
              setShowCtx(false);
            }}>📋 Copy</div>
            {sender && message.type === 'text' && (
              <div className="msg-ctx-item" onClick={startEdit}>✏️ Edit</div>
            )}
            <div className="msg-ctx-item danger" onClick={() => { setShowDeleteMenu(true); }}>
              🗑️ Delete{deleting ? '…' : ''}
            </div>
          </div>
        )}

        {/* Delete sub-menu */}
        {showCtx && showDeleteMenu && (
          <div ref={ctxRef} className={`msg-ctx-menu ${sender ? 'out' : 'in'}`} onClick={e => e.stopPropagation()}>
            <div className="msg-ctx-item" style={{ fontWeight: 700, color: 'var(--text-tertiary)', fontSize: '.75rem', cursor: 'default' }}>
              Delete message
            </div>
            <div className="msg-ctx-item danger" onClick={doDeleteForMe}>
              {deleting ? 'Deleting…' : 'Delete for me'}
            </div>
            {sender && (
              <div className="msg-ctx-item danger" onClick={doDeleteForEveryone}>
                {deleting ? 'Deleting…' : 'Delete for everyone'}
              </div>
            )}
            <div className="msg-ctx-item" onClick={() => setShowDeleteMenu(false)}>← Back</div>
          </div>
        )}
      </div>

      {/* Avatar — outgoing only */}
      {sender && (
        showAvatar
          ? (myAvatar
              ? <img className="msg-avatar" src={myAvatar} alt="you" />
              : <div className="msg-avatar-placeholder">ME</div>)
          : <div className="msg-avatar-spacer" />
      )}
    </div>
  );
}

export default Message;
