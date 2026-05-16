import React, { useState, useEffect, useRef } from "react";
import "./chatdesc.css";
import Message from "./Message";
import Userinfo from "./Userinfo";
import EmojiPicker from "emoji-picker-react";
import { useTheme } from "../../Context/ThemeContext";
import { useChatContext } from "../../Context/ChatContext";
import { useCallManager } from "../Call/CallManager";
import { BsEmojiSmile, BsSend } from "react-icons/bs";
import {
  IoBarChartOutline, IoArrowBack, IoCallOutline,
  IoVideocamOutline, IoSearchOutline, IoCloseOutline,
} from "react-icons/io5";
import { MdOutlineMoreVert } from "react-icons/md";
import {
  subscribeMessages, sendMessage, forwardMessage,
  subscribeUser, subscribeAllUsers, markRead, setTyping, subscribeTyping, deleteChatForEveryone,
} from "../../lib/db";
import { Timestamp } from "firebase/firestore";

const TYPING_DEBOUNCE = 1500;

function ChatDescription({ uid, me, cid, partner, onBack }) {
  const { theme } = useTheme();
  const { soundEnabled, playMessageSound, setActiveChatId, chats = [] } = useChatContext() || {};
  const { initiateCall } = useCallManager() || {};
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [partnerStatus, setPartnerStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserinfo, setShowUserinfo] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchIdx, setSearchIdx] = useState(0);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [optimistic, setOptimistic] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sessionStart = useRef(Timestamp.now());
  const prevMsgCount = useRef(0);
  const settingsRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimeout = useRef(null);
  const isTypingRef = useRef(false);

  // ── All users (for forward dialog names) ────────────────────
  useEffect(() => { return subscribeAllUsers(setAllUsers); }, []);

  // ── Live partner status ──────────────────────────────────────
  useEffect(() => {
    if (!partner?.uid) return;
    return subscribeUser(partner.uid, setPartnerStatus);
  }, [partner?.uid]);

  // ── Typing subscription ──────────────────────────────────────
  useEffect(() => {
    if (!cid || !uid) return;
    return subscribeTyping(cid, uid, (typingUids) => {
      setTypingUsers(typingUids);
    });
  }, [cid, uid]);

  // ── Real-time messages (handles new msgs, edits, reactions, poll votes) ────
  useEffect(() => {
    if (!cid) { setMessages([]); setOptimistic([]); return; }
    setMessages([]);
    setOptimistic([]);
    setReplyTo(null);
    prevMsgCount.current = 0;
    sessionStart.current = Timestamp.now();
    if (setActiveChatId) setActiveChatId(cid);

    const unsub = subscribeMessages(cid, (allMsgs) => {
      setMessages(prev => {
        // Detect truly new incoming messages (not in previous list)
        const prevIds = new Set(prev.map(m => m.id));
        const brandNew = allMsgs.filter(m => !prevIds.has(m.id) && m.senderId !== uid);
        if (brandNew.length > 0 && soundEnabled) playMessageSound?.(false);

        // Mark new incoming as read
        brandNew.forEach(m => { if (m.id) markRead(cid, m.id, uid); });

        // Clear optimistic once my own messages are confirmed
        const myNewConfirmed = allMsgs.filter(m => !prevIds.has(m.id) && m.senderId === uid);
        if (myNewConfirmed.length > 0) {
          const earliestMs = Math.min(...myNewConfirmed.map(f => f.createdAt?.toMillis?.() || Date.now()));
          setOptimistic(opt => opt.filter(o => (o.createdAt?.toMillis?.() || 0) > earliestMs));
        }

        return allMsgs;
      });
      prevMsgCount.current = allMsgs.length;
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, uid]);

  // ── Scroll to bottom on new messages ────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom || messages.length > prevMsgCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, optimistic]);

  // ── Settings outside click ───────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── In-chat search ───────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchIdx(0); return; }
    const q = searchQuery.toLowerCase();
    const hits = messages
      .map((m, i) => ({ i, m }))
      .filter(({ m }) => m.text?.toLowerCase().includes(q))
      .map(({ i }) => i);
    setSearchResults(hits);
    setSearchIdx(hits.length > 0 ? hits.length - 1 : 0);
  }, [searchQuery, messages]);

  useEffect(() => {
    if (searchResults.length === 0) return;
    const msgEl = document.getElementById(`msg-${messages[searchResults[searchIdx]]?.id}`);
    msgEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [searchIdx, searchResults, messages]);

  // ── Typing indicator ─────────────────────────────────────────
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

    if (!cid) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTyping(cid, uid, true);
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false;
      setTyping(cid, uid, false);
    }, TYPING_DEBOUNCE);
  };

  // Stop typing on unmount / chat change
  useEffect(() => {
    return () => {
      if (cid && isTypingRef.current) setTyping(cid, uid, false);
      clearTimeout(typingTimeout.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);

  // ── Send message (optimistic) ────────────────────────────────
  const doSend = async () => {
    const text = inputValue.trim();
    if (!text || !cid || sending) return;
    setSending(true);
    const reply = replyTo;
    setInputValue("");
    setReplyTo(null);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.focus();
    }
    // Stop typing
    clearTimeout(typingTimeout.current);
    isTypingRef.current = false;
    setTyping(cid, uid, false);

    // Optimistic message
    const tempId = 'opt_' + Date.now();
    const optimisticMsg = {
      id: tempId,
      text,
      senderId: uid,
      senderName: me?.name,
      type: 'text',
      replyTo: reply || null,
      reactions: {},
      readBy: [uid],
      deletedFor: [],
      edited: false,
      createdAt: Timestamp.now(),
      _optimistic: true,
    };
    setOptimistic(prev => [...prev, optimisticMsg]);

    if (soundEnabled) playMessageSound?.(true);
    await sendMessage(cid, {
      text,
      senderId: uid,
      senderName: me?.name || 'Someone',
      replyTo: reply,
    });
    setSending(false);
  };

  const doSendPoll = async () => {
    const q = pollQuestion.trim();
    const opts = pollOptions.filter(o => o.trim());
    if (!q || opts.length < 2 || !cid) return;
    setShowPollCreator(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    if (soundEnabled) playMessageSound?.(true);
    await sendMessage(cid, {
      text: "",
      senderId: uid,
      senderName: me?.name || 'Someone',
      type: "poll",
      poll: { question: q, options: opts.map(t => ({ text: t, votes: [] })) },
    });
  };

  const doForwardTo = async (targetCid) => {
    if (!forwardMsg || !targetCid) return;
    await forwardMessage(targetCid, {
      text: forwardMsg.text,
      senderId: uid,
      senderName: me?.name || 'Someone',
      originalSenderName: forwardMsg.senderName,
    });
    setForwardMsg(null);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); }
    if (e.key === "Escape") { setReplyTo(null); setShowEmoji(false); setForwardMsg(null); }
  };

  const groupByDate = (msgs) => {
    const groups = [];
    let lastDate = null;
    let lastSender = null;
    msgs.forEach((m, i) => {
      if (!m.createdAt) { groups.push({ ...m, _firstInGroup: true }); lastSender = m.senderId; return; }
      const d = m.createdAt.toDate ? m.createdAt.toDate().toDateString() : new Date(m.createdAt).toDateString();
      if (d !== lastDate) {
        groups.push({ _sep: true, date: d, id: 'sep_' + d });
        lastDate = d;
        lastSender = null;
      }
      const firstInGroup = m.senderId !== lastSender;
      groups.push({ ...m, _firstInGroup: firstInGroup });
      lastSender = m.senderId;
    });
    return groups;
  };

  if (!cid || !partner) {
    return (
      <div className="no-chat-selected">
        <div className="no-chat-icon">💬</div>
        <h3>AR Hub Messenger</h3>
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  const isOnline = partnerStatus?.status === 'online';
  const lastSeenText = (() => {
    if (typingUsers.length > 0) return null; // show typing instead
    if (isOnline) return 'online';
    const ls = partnerStatus?.lastSeen;
    if (!ls) return 'last seen recently';
    const d = ls.toDate ? ls.toDate() : new Date(ls);
    const diffMs = Date.now() - d;
    if (diffMs < 60000) return 'last seen just now';
    if (diffMs < 3600000) return `last seen ${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `last seen today at ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    return `last seen ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  })();

  const initials = (partner.name || '?').slice(0, 2).toUpperCase();
  // Show optimistic messages that aren't already confirmed in `messages`
  // Use text+senderId match as fallback since IDs differ
  const allMessages = [
    ...messages,
    ...optimistic.filter(o =>
      !messages.some(m => m.senderId === o.senderId && m.text === o.text &&
        Math.abs((m.createdAt?.toMillis?.() || 0) - (o.createdAt?.toMillis?.() || 0)) < 5000
      )
    ),
  ];
  const grouped = groupByDate(allMessages);
  const highlightIds = new Set(searchResults.map(i => allMessages[i]?.id).filter(Boolean));

  return (
    <>
    <div className="chatdesc-root" onClick={() => { setShowEmoji(false); setShowSettings(false); }}>
      {/* Header */}
      <div className="chatdesc-header" onClick={e => e.stopPropagation()}>
        <button className="chatdesc-back-btn" onClick={onBack} title="Back">
          <IoArrowBack />
        </button>

        <div className="chatdesc-avatar-wrap" style={{ cursor: 'pointer' }} onClick={() => setShowUserinfo(true)}>
          {partner.avatar
            ? <img className="chatdesc-avatar" src={partner.avatar} alt={partner.name} />
            : <div className="chatdesc-avatar-placeholder">{initials}</div>
          }
          <span className={`chatdesc-online ${isOnline ? 'on' : 'off'}`} />
        </div>

        <div className="chatdesc-info" style={{ cursor: 'pointer' }} onClick={() => setShowUserinfo(true)}>
          <div className="chatdesc-name">{partner.name || 'Chat'}</div>
          {typingUsers.length > 0 ? (
            <div className="chatdesc-typing-header">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              <span style={{ marginLeft: 4 }}>typing…</span>
            </div>
          ) : (
            <div className={`chatdesc-status ${isOnline ? 'on' : ''}`}>{lastSeenText}</div>
          )}
        </div>

        <div className="chatdesc-header-actions">
          <button className="chatdesc-icon-btn" title="Search in chat" onClick={e => { e.stopPropagation(); setShowSearch(s => !s); setSearchQuery(''); }}>
            <IoSearchOutline />
          </button>
          <button
            className="chatdesc-icon-btn"
            title="Voice call"
            onClick={() => partner && initiateCall?.({ uid: partner.uid, name: partner.name, avatar: partner.avatar }, "audio")}
          ><IoCallOutline /></button>
          <button
            className="chatdesc-icon-btn"
            title="Video call"
            onClick={() => partner && initiateCall?.({ uid: partner.uid, name: partner.name, avatar: partner.avatar }, "video")}
          ><IoVideocamOutline /></button>
          <div ref={settingsRef} style={{ position: 'relative' }}>
            <button className="chatdesc-icon-btn" onClick={e => { e.stopPropagation(); setShowSettings(s => !s); }}>
              <MdOutlineMoreVert />
            </button>
            {showSettings && (
              <div className="chatdesc-settings-menu">
                <div className="chatdesc-settings-item" onClick={() => { setShowUserinfo(true); setShowSettings(false); }}>View Profile</div>
                <div className="chatdesc-settings-item" onClick={() => { setShowSearch(true); setShowSettings(false); }}>Search Messages</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* In-chat search bar */}
      {showSearch && (
        <div className="chat-search-bar" onClick={e => e.stopPropagation()}>
          <IoSearchOutline style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            autoFocus
            className="chat-search-bar-input"
            placeholder="Search messages…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <span className="chat-search-count">
              {searchResults.length - searchIdx}/{searchResults.length}
            </span>
          )}
          {searchResults.length > 1 && (
            <>
              <button className="chat-search-nav" onClick={() => setSearchIdx(i => Math.max(0, i - 1))}>↑</button>
              <button className="chat-search-nav" onClick={() => setSearchIdx(i => Math.min(searchResults.length - 1, i + 1))}>↓</button>
            </>
          )}
          <button className="chat-search-nav" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
            <IoCloseOutline />
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="chatdesc-messages" ref={scrollRef}>
        {grouped.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '3rem', fontSize: '.85rem' }}>
            No messages yet. Say hello! 👋
          </div>
        )}

        {grouped.map(item => {
          if (item._sep) {
            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            let label = item.date;
            if (item.date === today) label = 'Today';
            else if (item.date === yesterday) label = 'Yesterday';
            return <div key={item.id} className="msg-date-sep"><span>{label}</span></div>;
          }
          return (
            <div key={item.id} id={`msg-${item.id}`}>
              <Message
                message={item}
                sender={item.senderId === uid}
                cid={cid}
                uid={uid}
                partnerName={partner.name}
                partnerAvatar={partner.avatar}
                myAvatar={me?.avatar}
                onReply={(m) => { setReplyTo(m); inputRef.current?.focus(); }}
                onForward={(m) => setForwardMsg(m)}
                highlighted={highlightIds.has(item.id)}
                searchQuery={searchQuery}
                isOptimistic={item._optimistic}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji picker */}
      {showEmoji && (
        <div className="chatdesc-emoji-wrap" onClick={e => e.stopPropagation()}>
          <EmojiPicker
            theme={theme === 'dark' ? 'dark' : 'light'}
            width={320}
            height={380}
            onEmojiClick={e => setInputValue(v => v + e.emoji)}
          />
        </div>
      )}

      {/* Poll creator */}
      {showPollCreator && (
        <div className="poll-creator" onClick={e => e.stopPropagation()}>
          <h4>📊 Create Poll</h4>
          <input
            className="poll-creator-input"
            placeholder="Ask a question..."
            value={pollQuestion}
            onChange={e => setPollQuestion(e.target.value)}
            autoFocus
          />
          {pollOptions.map((opt, i) => (
            <div key={i} className="poll-option-row">
              <input
                className="poll-creator-input"
                style={{ margin: 0 }}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }}
              />
              {pollOptions.length > 2 && (
                <button className="poll-remove-btn" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}>✕</button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button className="poll-add-option" onClick={() => setPollOptions([...pollOptions, ""])}>+ Add option</button>
          )}
          <div className="poll-creator-actions">
            <button className="poll-btn poll-btn-cancel" onClick={() => setShowPollCreator(false)}>Cancel</button>
            <button className="poll-btn poll-btn-send" onClick={doSendPoll}>Send Poll</button>
          </div>
        </div>
      )}

      {/* Reply preview bar */}
      {replyTo && (
        <div className="chatdesc-reply-bar" onClick={e => e.stopPropagation()}>
          <div className="chatdesc-reply-content">
            <span className="chatdesc-reply-label">
              Replying to {replyTo.senderId === uid ? 'yourself' : partner.name}
            </span>
            <span className="chatdesc-reply-text">{replyTo.text?.slice(0, 80)}</span>
          </div>
          <button className="chatdesc-reply-close" onClick={() => setReplyTo(null)}>
            <IoCloseOutline />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="chatdesc-input-area" onClick={e => e.stopPropagation()}>
        <div className="chatdesc-input-row">
          <button
            className="chatdesc-input-icon-btn"
            onClick={() => { setShowEmoji(s => !s); setShowPollCreator(false); }}
            title="Emoji"
          >
            <BsEmojiSmile />
          </button>
          <button
            className="chatdesc-input-icon-btn"
            onClick={() => { setShowPollCreator(s => !s); setShowEmoji(false); }}
            title="Create poll"
          >
            <IoBarChartOutline />
          </button>

          <textarea
            ref={inputRef}
            className="chatdesc-input"
            rows={1}
            placeholder="Type a message…"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKey}
          />

          <button
            className="chatdesc-send-btn"
            onClick={doSend}
            disabled={!inputValue.trim() || sending}
            title="Send"
          >
            <BsSend />
          </button>
        </div>
      </div>
    </div>

    {/* Forward message dialog */}
    {forwardMsg && (
      <div className="userinfo-overlay" onClick={() => setForwardMsg(null)}>
        <div className="forward-dialog" onClick={e => e.stopPropagation()}>
          <div className="forward-header">
            <span>Forward to…</span>
            <button className="userinfo-close" onClick={() => setForwardMsg(null)}>✕</button>
          </div>
          <div className="forward-preview">"{forwardMsg.text?.slice(0, 80)}"</div>
          <div className="forward-list">
            {chats
              .filter(c => c.id !== cid)
              .map(c => {
                const otherId = c.members?.find(m => m !== uid);
                const other = allUsers.find(u => u.uid === otherId);
                const name = other?.name || otherId || 'Chat';
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <div key={c.id} className="forward-item" onClick={() => doForwardTo(c.id)}>
                    {other?.avatar
                      ? <img className="forward-avatar" src={other.avatar} alt={name} />
                      : <div className="forward-avatar-ph">{initials}</div>
                    }
                    <div className="forward-item-name">{name}</div>
                  </div>
                );
              })
            }
            {chats.filter(c => c.id !== cid).length === 0 && (
              <div style={{ color: 'var(--text-tertiary)', padding: '1rem', textAlign: 'center', fontSize: '.85rem' }}>
                No other chats to forward to
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Partner profile panel — rendered as overlay sibling */}
    {showUserinfo && (
      <Userinfo
        partner={{ ...partner, ...(partnerStatus || {}) }}
        me={me}
        uid={uid}
        onClose={() => setShowUserinfo(false)}
        onDeleteChat={cid ? () => deleteChatForEveryone(cid) : null}
      />
    )}
  </>
  );
}

export default ChatDescription;
