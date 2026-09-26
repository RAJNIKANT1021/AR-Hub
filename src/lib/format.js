import React from "react";

export const toDate = (ts) => {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  return new Date(ts);
};
export const toMillis = (ts) => toDate(ts)?.getTime() || 0;

const sameDay = (a, b) => a.toDateString() === b.toDateString();

export function fmtTime(ts) {
  const d = toDate(ts);
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Chat-list style: time today, "Yesterday", weekday, or date. */
export function fmtListTime(ts) {
  const d = toDate(ts);
  if (!d) return "";
  const now = new Date();
  if (sameDay(d, now)) return fmtTime(d);
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  if (now - d < 6 * 86400000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: d.getFullYear() !== now.getFullYear() ? "2-digit" : undefined });
}

export function fmtDayLabel(d) {
  const now = new Date();
  if (sameDay(d, now)) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  if (now - d < 6 * 86400000) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}

export function fmtRelative(ts) {
  const d = toDate(ts);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return fmtListTime(d);
}

export function lastSeenText(user) {
  if (!user) return "";
  if (user.status === "online") return "online";
  const d = toDate(user.lastSeen);
  if (!d) return "last seen recently";
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "last seen just now";
  if (diff < 3600000) return `last seen ${Math.floor(diff / 60000)} min ago`;
  if (sameDay(d, new Date())) return `last seen today at ${fmtTime(d)}`;
  return `last seen ${fmtListTime(d)}${diff < 6 * 86400000 ? ` at ${fmtTime(d)}` : ""}`;
}

export function fmtDuration(secs) {
  secs = Math.max(0, Math.round(secs || 0));
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const initials = (name) =>
  (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316"];
export function colorFor(key) {
  let h = 0;
  const s = String(key || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u;
export function isEmojiOnly(text) {
  if (!text || text.length > 16) return false;
  return EMOJI_ONLY.test(text) && /\p{Extended_Pictographic}/u.test(text);
}

/* ── WhatsApp-style rich text ────────────────────────────────────
 * *bold*  _italic_  ~strike~  `code`  ```block```  URLs  @mentions
 */
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

function renderInline(text, keyBase, opts) {
  const out = [];
  const re = /(`[^`\n]+`)|(\*[^*\n]+\*)|(_[^_\n]+_)|(~[^~\n]+~)|(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])|(@[\p{L}\p{N}_.-]+)/gu;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(highlight(text.slice(last, m.index), `${keyBase}t${i++}`, opts.query));
    const tok = m[0];
    const k = `${keyBase}m${i++}`;
    if (m[1]) out.push(<code key={k} className="rt-code">{tok.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k}>{renderInline(tok.slice(1, -1), k, opts)}</strong>);
    else if (m[3]) out.push(<em key={k}>{renderInline(tok.slice(1, -1), k, opts)}</em>);
    else if (m[4]) out.push(<s key={k}>{renderInline(tok.slice(1, -1), k, opts)}</s>);
    else if (m[5]) out.push(<a key={k} href={tok} target="_blank" rel="noopener noreferrer" className="rt-link" onClick={e => e.stopPropagation()}>{tok}</a>);
    else if (m[6]) {
      const known = opts.mentionNames?.some(n => tok.slice(1).toLowerCase() === n.toLowerCase().replace(/\s+/g, ""));
      out.push(known ? <span key={k} className="rt-mention">{tok}</span> : tok);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(highlight(text.slice(last), `${keyBase}t${i++}`, opts.query));
  return out;
}

function highlight(text, key, q) {
  if (!q) return <React.Fragment key={key}>{text}</React.Fragment>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <React.Fragment key={key}>
      {parts.map((p, i) => p.toLowerCase() === q.toLowerCase() ? <mark key={i} className="rt-hl">{p}</mark> : p)}
    </React.Fragment>
  );
}

export function RichText({ text, query, mentionNames }) {
  if (!text) return null;
  const blocks = text.split(/```/);
  return (
    <>
      {blocks.map((b, i) =>
        i % 2 === 1
          ? <pre key={i} className="rt-pre">{b.replace(/^\n/, "")}</pre>
          : <React.Fragment key={i}>{renderInline(b, `b${i}`, { query, mentionNames })}</React.Fragment>
      )}
    </>
  );
}

export const firstUrl = (text) => (text || "").match(URL_RE)?.[0] || null;
