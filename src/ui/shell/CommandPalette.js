import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { IoSearch } from "react-icons/io5";
import { useApp } from "../../Context/ChatContext";
import { useTheme } from "../../Context/ThemeContext";
import { ChatAvatar } from "../common/Avatar";
import { HUB_MODULES } from "../hub/registry";

/** Spotlight-style launcher: jump to any chat, person, page, hub module or action. */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { visibleChats = [], chatTitle, chatPartner, allUsers = [], uid } = useApp();
  const { toggleTheme } = useTheme();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 20); } }, [open]);

  const items = useMemo(() => {
    const go = (to) => () => navigate(to);
    const base = [
      ...visibleChats.map(c => ({ kind: "Chat", label: chatTitle(c), run: go(`/chat/${c.id}`), chat: c, partner: chatPartner(c), key: "c" + c.id })),
      ...allUsers.filter(u => u.uid !== uid && !visibleChats.some(c => c.type !== "group" && c.members?.includes(u.uid)))
        .map(u => ({ kind: "Person", label: u.name, run: go(`/contacts?start=${u.uid}`), partner: u, key: "u" + u.uid })),
      { kind: "Page", label: "Chats", run: go("/chat"), icon: "💬" },
      { kind: "Page", label: "Rooms — discover & create", run: go("/rooms"), icon: "👥" },
      { kind: "Page", label: "Status updates", run: go("/status"), icon: "⭕" },
      { kind: "Page", label: "Calls", run: go("/calls"), icon: "📞" },
      { kind: "Page", label: "Contacts & friend requests", run: go("/contacts"), icon: "🧑‍🤝‍🧑" },
      { kind: "Page", label: "Notifications", run: go("/notifications"), icon: "🔔" },
      { kind: "Page", label: "Starred messages", run: go("/starred"), icon: "⭐" },
      { kind: "Page", label: "Settings", run: go("/settings"), icon: "⚙️" },
      { kind: "Page", label: "About the developer", run: go("/about"), icon: "👨‍💻" },
      ...HUB_MODULES.map(m => ({ kind: "Hub", label: m.label, run: go(`/hub/${m.key}`), icon: m.emoji })),
      { kind: "Action", label: "New room", run: go("/rooms?new=1"), icon: "➕" },
      { kind: "Action", label: "Post a status", run: go("/status?new=1"), icon: "✍️" },
      { kind: "Action", label: "Toggle dark / light theme", run: toggleTheme, icon: "🌓" },
    ];
    const s = q.trim().toLowerCase();
    if (!s) return base.filter(i => i.kind !== "Person").slice(0, 40);
    return base
      .map(i => {
        const l = i.label.toLowerCase();
        const score = l.startsWith(s) ? 0 : l.includes(s) ? 1 : fuzzy(l, s) ? 2 : 9;
        return { ...i, score };
      })
      .filter(i => i.score < 9)
      .sort((a, b) => a.score - b.score)
      .slice(0, 40);
  }, [q, visibleChats, allUsers, uid, chatTitle, chatPartner, navigate, toggleTheme]);

  useEffect(() => { setIdx(0); }, [q]);
  useEffect(() => { listRef.current?.children[idx]?.scrollIntoView({ block: "nearest" }); }, [idx]);

  if (!open) return null;

  const run = (i) => { onClose(); i?.run(); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(items.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(items[idx]); }
    else if (e.key === "Escape") onClose();
  };

  return createPortal(
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-label="Command palette">
        <div className="palette-input">
          <IoSearch />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey} placeholder="Search chats, people, pages, actions…" />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" ref={listRef}>
          {items.length === 0 && <div className="palette-empty">No results for “{q}”</div>}
          {items.map((i, n) => (
            <button key={i.key || i.label} className={`palette-item ${n === idx ? "sel" : ""}`} onMouseEnter={() => setIdx(n)} onClick={() => run(i)}>
              {i.chat || i.partner
                ? <ChatAvatar chat={i.chat} partner={i.partner} size={30} showOnline={false} />
                : <span className="palette-emoji">{i.icon}</span>}
              <span className="palette-label">{i.label}</span>
              <span className="palette-kind">{i.kind}</span>
            </button>
          ))}
        </div>
        <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>Alt</kbd>+<kbd>1-5</kbd> tabs</span></div>
      </div>
    </div>,
    document.body
  );
}

function fuzzy(text, pattern) {
  let j = 0;
  for (let i = 0; i < text.length && j < pattern.length; i++) if (text[i] === pattern[j]) j++;
  return j === pattern.length;
}
