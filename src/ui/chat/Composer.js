import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import {
  IoHappyOutline, IoAdd, IoSend, IoMic, IoTrashOutline, IoClose, IoImageOutline, IoCameraOutline,
  IoBarChartOutline, IoLocationOutline, IoCheckmark, IoBrushOutline, IoPencil, IoArrowUndo,
} from "react-icons/io5";
import { useTheme } from "../../Context/ThemeContext";
import { toastError } from "../../Context/ChatContext";
import { compressImage, startVoiceRecording, canRecordVoice, getLocation, MAX_VOICE_SECONDS } from "../../lib/media";
import { fmtDuration, colorFor } from "../../lib/format";
import { sounds } from "../../lib/notify";
import Sheet from "../common/Sheet";
import Avatar from "../common/Avatar";
import { getDraft, setDraft } from "./drafts";

const EmojiPicker = lazy(() => import("emoji-picker-react"));

/** Lightweight on-device reply suggestions for the last incoming message. */
function smartReplies(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  if (/\b(thanks|thank you|thx|ty)\b/.test(t)) return ["You're welcome! 😊", "Anytime!", "No problem 👍"];
  if (/\b(hi|hey|hello|hii+|yo|sup)\b/.test(t)) return ["Hey! 👋", "Hi, how are you?", "Hello 😄"];
  if (/how are (you|u)|how's it going|wassup/.test(t)) return ["I'm good, you?", "Doing great! 🙌", "All good 😊"];
  if (/\b(good night|gn)\b/.test(t)) return ["Good night 🌙", "Sleep well!", "GN 😴"];
  if (/\b(good morning|gm)\b/.test(t)) return ["Good morning ☀️", "Morning! 😊"];
  if (/\b(sorry|my bad)\b/.test(t)) return ["No worries!", "It's okay 🙂"];
  if (/\b(call|ring)\b/.test(t)) return ["Calling you now 📞", "Give me 5 min", "Can't talk right now"];
  if (/\b(congrats|congratulations)\b/.test(t)) return ["Thank you! 🎉", "Thanks a lot 🙏"];
  if (/\?\s*$/.test(t)) return ["Yes 👍", "No", "Not sure 🤔", "Let me check"];
  if (/(haha|lol|lmao|😂|🤣)/.test(t)) return ["😂😂", "Haha", "🤣"];
  return ["👍", "Okay", "Sounds good!", "❤️"];
}

export default function Composer({
  cid, chat, me, group, members, usersById, blocked, lastIncoming,
  replyTo, onCancelReply, editing, onCancelEdit,
  onSendText, onSendImage, onSendVoice, onSendLocation, onSendPoll, onEdit, onTyping, onOpenWhiteboard,
}) {
  const { theme } = useTheme();
  const [text, setText] = useState(() => getDraft(cid));
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // {url,width,height}
  const [caption, setCaption] = useState("");
  const [rec, setRec] = useState(null); // { ctrl, secs, level }
  const [mention, setMention] = useState(null); // { start, query }
  const [mentionIdx, setMentionIdx] = useState(0);
  const mentionMap = useRef({}); // token -> uid
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const recTimer = useRef(null);

  // Draft persistence (debounced)
  useEffect(() => {
    if (editing) return;
    const t = setTimeout(() => setDraft(cid, text), 350);
    return () => clearTimeout(t);
  }, [text, cid, editing]);

  // Enter edit mode
  useEffect(() => {
    if (editing) { setText(editing.text || ""); setTimeout(() => focusEnd(), 30); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing?.id]);

  useEffect(() => { if (replyTo) taRef.current?.focus(); }, [replyTo]);

  const autosize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };
  useEffect(autosize, [text]);

  const focusEnd = () => {
    const el = taRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  };

  // ── Mentions ─────────────────────────────────────────────────
  const mentionCandidates = useMemo(() => {
    if (!mention || !group) return [];
    const q = mention.query.toLowerCase();
    return (members || [])
      .filter(u => u && u.uid !== me?.uid && (u.name || "").toLowerCase().replace(/\s+/g, "").includes(q))
      .slice(0, 6);
  }, [mention, group, members, me]);

  const detectMention = (value, caret) => {
    if (!group) { setMention(null); return; }
    const upto = value.slice(0, caret);
    const m = upto.match(/(^|\s)@([\p{L}\p{N}_.-]*)$/u);
    if (m) { setMention({ start: caret - m[2].length - 1, query: m[2] }); setMentionIdx(0); }
    else setMention(null);
  };

  const pickMention = (u) => {
    const token = "@" + (u.name || "user").replace(/\s+/g, "");
    mentionMap.current[token.toLowerCase()] = u.uid;
    const el = taRef.current;
    const caret = el?.selectionStart ?? text.length;
    const next = text.slice(0, mention.start) + token + " " + text.slice(caret);
    setText(next);
    setMention(null);
    setTimeout(() => {
      const pos = mention.start + token.length + 1;
      el?.focus();
      el?.setSelectionRange(pos, pos);
    }, 0);
  };

  const onChange = (e) => {
    setText(e.target.value);
    detectMention(e.target.value, e.target.selectionStart);
    if (e.target.value) onTyping(true);
  };

  // ── Send ─────────────────────────────────────────────────────
  const send = useCallback(async (override) => {
    const value = (override ?? text).trim();
    if (!value) return;
    if (editing) {
      if (value !== editing.text) onEdit(editing, value);
      onCancelEdit();
      setText(getDraft(cid));
      return;
    }
    const mentions = Array.from(new Set(
      (value.match(/@[\p{L}\p{N}_.-]+/gu) || []).map(t => mentionMap.current[t.toLowerCase()]).filter(Boolean)
    ));
    setText("");
    setDraft(cid, "");
    setMention(null);
    onTyping(false);
    sounds.send();
    onSendText(value, mentions);
    taRef.current?.focus();
  }, [text, editing, onEdit, onCancelEdit, cid, onTyping, onSendText]);

  const onKeyDown = (e) => {
    if (mention && mentionCandidates.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIdx(i => (i + 1) % mentionCandidates.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIdx(i => (i - 1 + mentionCandidates.length) % mentionCandidates.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickMention(mentionCandidates[mentionIdx]); return; }
      if (e.key === "Escape") { setMention(null); return; }
    }
    // Enter sends on desktop; on touch keyboards Enter inserts a newline
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (e.key === "Enter" && !e.shiftKey && !touch) { e.preventDefault(); send(); }
    if (e.key === "Escape") { if (editing) { onCancelEdit(); setText(getDraft(cid)); } else if (replyTo) onCancelReply(); }
  };

  const onPaste = async (e) => {
    const file = Array.from(e.clipboardData?.files || []).find(f => f.type.startsWith("image/"));
    if (file) { e.preventDefault(); pickImage(file); }
  };

  // ── Attachments ──────────────────────────────────────────────
  const pickImage = async (file) => {
    if (!file) return;
    setAttachOpen(false);
    try {
      const img = await compressImage(file);
      setCaption(text);
      setImagePreview(img);
    } catch (e) { toastError(e); }
  };

  const sendImage = () => {
    const img = imagePreview;
    setImagePreview(null);
    setText("");
    setDraft(cid, "");
    sounds.send();
    onSendImage(img, caption.trim());
    setCaption("");
  };

  const shareLocation = async () => {
    setAttachOpen(false);
    try { const loc = await getLocation(); sounds.send(); onSendLocation(loc); }
    catch (e) { toastError(e); }
  };

  // ── Voice ────────────────────────────────────────────────────
  const recCtrl = useRef(null);
  const startRec = async () => {
    if (!canRecordVoice()) { toastError(new Error("Voice recording isn't supported in this browser.")); return; }
    if (recCtrl.current) return;
    try {
      const ctrl = await startVoiceRecording();
      recCtrl.current = ctrl;
      ctrl.onLevel(l => setRec(r => (r ? { ...r, level: l } : r)));
      setRec({ secs: 0, level: 0 });
      try { navigator.vibrate?.(20); } catch {}
      recTimer.current = setInterval(() => {
        const secs = (Date.now() - ctrl.startedAt) / 1000;
        if (secs >= MAX_VOICE_SECONDS) { stopRec(true); return; }
        setRec(r => (r ? { ...r, secs } : r));
      }, 200);
    } catch (e) {
      toastError(new Error(e?.name === "NotAllowedError" ? "Microphone permission denied." : (e.message || "Couldn't start recording.")));
    }
  };

  const stopRec = async (sendIt) => {
    clearInterval(recTimer.current);
    const ctrl = recCtrl.current;
    recCtrl.current = null;
    setRec(null);
    if (!ctrl) return;
    if (!sendIt) { ctrl.cancel(); return; }
    try {
      const v = await ctrl.stop();
      if (v.duration < 0.8) return;
      sounds.send();
      onSendVoice(v);
    } catch (e) { toastError(e); }
  };

  useEffect(() => () => { clearInterval(recTimer.current); recCtrl.current?.cancel(); }, []);

  if (blocked) {
    return <div className="composer-blocked">{blocked}</div>;
  }

  const suggestions = !text && !replyTo && !editing && !rec && lastIncoming?.type === "text" ? smartReplies(lastIncoming.text) : [];

  return (
    <div className="composer-wrap" onClick={e => e.stopPropagation()}>
      {suggestions.length > 0 && (
        <div className="smart-replies chips">
          <span className="smart-label">✨</span>
          {suggestions.map(s => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
        </div>
      )}

      {(replyTo || editing) && (
        <div className="composer-context" style={{ "--q": replyTo ? colorFor(replyTo.senderId) : "var(--accent)" }}>
          <span className="ctx-icon">{editing ? <IoPencil /> : <IoArrowUndo />}</span>
          <div className="ctx-body">
            <div className="ctx-title">{editing ? "Edit message" : `Replying to ${replyTo.senderId === me?.uid ? "yourself" : replyTo.senderName}`}</div>
            <div className="ctx-text">{editing ? editing.text : replyTo.text || "Message"}</div>
          </div>
          <button className="icon-btn sm" onClick={() => { if (editing) { onCancelEdit(); setText(getDraft(cid)); } else onCancelReply(); }} aria-label="Cancel"><IoClose /></button>
        </div>
      )}

      {mention && mentionCandidates.length > 0 && (
        <div className="mention-pop">
          {mentionCandidates.map((u, i) => (
            <button key={u.uid} className={`mention-item ${i === mentionIdx ? "sel" : ""}`} onMouseDown={e => { e.preventDefault(); pickMention(u); }}>
              <Avatar src={u.avatar} name={u.name} size={28} />
              <span>{u.name}</span>
            </button>
          ))}
        </div>
      )}

      {emojiOpen && (
        <div className="emoji-pop">
          <Suspense fallback={<div className="emoji-loading"><span className="spinner" style={{ width: 22, height: 22 }} /></div>}>
            <EmojiPicker theme={theme === "dark" ? "dark" : "light"} width="100%" height={340} lazyLoadEmojis previewConfig={{ showPreview: false }}
              onEmojiClick={(e) => {
                const el = taRef.current;
                const pos = el?.selectionStart ?? text.length;
                setText(t => t.slice(0, pos) + e.emoji + t.slice(pos));
                setTimeout(() => { el?.focus(); el?.setSelectionRange(pos + e.emoji.length, pos + e.emoji.length); }, 0);
              }} />
          </Suspense>
        </div>
      )}

      {attachOpen && (
        <div className="attach-pop">
          <button onClick={() => fileRef.current?.click()}><span style={{ background: "#7c5cff" }}><IoImageOutline /></span>Photo</button>
          <button onClick={() => camRef.current?.click()}><span style={{ background: "#ec4899" }}><IoCameraOutline /></span>Camera</button>
          <button onClick={() => { setAttachOpen(false); setPollOpen(true); }}><span style={{ background: "#f59e0b" }}><IoBarChartOutline /></span>Poll</button>
          <button onClick={shareLocation}><span style={{ background: "#10b981" }}><IoLocationOutline /></span>Location</button>
          <button onClick={() => { setAttachOpen(false); onOpenWhiteboard(); }}><span style={{ background: "#0ea5e9" }}><IoBrushOutline /></span>Sketch</button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />

      <div className="composer">
        {rec ? (
          <div className="rec-bar">
            <button className="icon-btn rec-cancel" onClick={() => stopRec(false)} aria-label="Discard recording"><IoTrashOutline /></button>
            <span className="rec-dot" style={{ transform: `scale(${1 + rec.level * 1.4})` }} />
            <span className="rec-time">{fmtDuration(rec.secs)}</span>
            <div className="rec-wave">{Array.from({ length: 24 }).map((_, i) => <span key={i} style={{ height: `${15 + Math.abs(Math.sin(rec.secs * 3 + i)) * rec.level * 85}%` }} />)}</div>
            <span className="rec-hint">Recording…</span>
          </div>
        ) : (
          <div className="composer-box">
            <button className={`icon-btn ${emojiOpen ? "active" : ""}`} aria-label="Emoji" onClick={() => { setEmojiOpen(o => !o); setAttachOpen(false); }}><IoHappyOutline /></button>
            <textarea
              ref={taRef}
              className="composer-input"
              rows={1}
              value={text}
              placeholder={editing ? "Edit message" : "Message"}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onClick={e => detectMention(e.currentTarget.value, e.currentTarget.selectionStart)}
              onFocus={() => setEmojiOpen(false)}
              aria-label="Message"
            />
            {!editing && <button className={`icon-btn ${attachOpen ? "active" : ""}`} aria-label="Attach" onClick={() => { setAttachOpen(o => !o); setEmojiOpen(false); }}><IoAdd style={{ transform: attachOpen ? "rotate(45deg)" : "none", transition: "transform .2s" }} /></button>}
          </div>
        )}

        {rec ? (
          <button className="send-btn" onClick={() => stopRec(true)} aria-label="Send voice message"><IoSend /></button>
        ) : text.trim() ? (
          <button className="send-btn" onClick={() => send()} aria-label={editing ? "Save" : "Send"}>{editing ? <IoCheckmark /> : <IoSend />}</button>
        ) : (
          <button className="send-btn" onClick={startRec} aria-label="Record voice message"><IoMic /></button>
        )}
      </div>

      <Sheet open={!!imagePreview} onClose={() => setImagePreview(null)} title="Send photo" size="md"
        footer={<>
          <input className="input" style={{ flex: 1 }} placeholder="Add a caption…" value={caption} onChange={e => setCaption(e.target.value)} onKeyDown={e => e.key === "Enter" && sendImage()} />
          <button className="send-btn" onClick={sendImage} aria-label="Send photo"><IoSend /></button>
        </>}>
        {imagePreview && <img className="img-preview" src={imagePreview.url} alt="Preview" />}
      </Sheet>

      <PollCreator open={pollOpen} onClose={() => setPollOpen(false)} onCreate={(p) => { setPollOpen(false); sounds.send(); onSendPoll(p); }} />
    </div>
  );
}

function PollCreator({ open, onClose, onCreate }) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [multiple, setMultiple] = useState(false);
  useEffect(() => { if (open) { setQ(""); setOpts(["", ""]); setMultiple(false); } }, [open]);
  const valid = q.trim() && opts.filter(o => o.trim()).length >= 2;
  return (
    <Sheet open={open} onClose={onClose} title="Create poll" size="sm"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!valid}
        onClick={() => onCreate({ question: q.trim(), multiple, options: opts.filter(o => o.trim()).map(t => ({ text: t.trim(), votes: [] })) })}>Send poll</button></>}>
      <div className="field">
        <span className="field-label">Question</span>
        <input className="input" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Ask something…" maxLength={200} />
      </div>
      <div className="field">
        <span className="field-label">Options</span>
        {opts.map((o, i) => (
          <div key={i} style={{ display: "flex", gap: 6 }}>
            <input className="input" value={o} maxLength={100} placeholder={`Option ${i + 1}`}
              onChange={e => { const n = [...opts]; n[i] = e.target.value; if (i === n.length - 1 && e.target.value && n.length < 10) n.push(""); setOpts(n); }} />
            {opts.length > 2 && <button className="icon-btn" onClick={() => setOpts(opts.filter((_, j) => j !== i))} aria-label="Remove option"><IoClose /></button>}
          </div>
        ))}
      </div>
      <label className="setting-row" style={{ padding: 0 }}>
        <span className="setting-text"><strong>Allow multiple answers</strong></span>
        <span className="switch"><input type="checkbox" checked={multiple} onChange={e => setMultiple(e.target.checked)} /><span /></span>
      </label>
    </Sheet>
  );
}
