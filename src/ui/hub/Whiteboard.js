import React, { useCallback, useEffect, useRef, useState } from "react";
import { IoArrowUndo, IoTrashOutline, IoSend, IoDownloadOutline, IoBrushOutline } from "react-icons/io5";
import { BsEraser } from "react-icons/bs";
import { useApp, toastError, toastOk } from "../../Context/ChatContext";
import { sendMessage } from "../../lib/db";
import { downloadDataUrl } from "../../lib/media";
import Sheet from "../common/Sheet";
import { ChatAvatar } from "../common/Avatar";

const COLORS = ["#111827", "#ef4444", "#f59e0b", "#10b981", "#0ea5e9", "#7c5cff", "#ec4899", "#ffffff"];
const SIZES = [3, 6, 12, 22];

/** Freehand sketch pad. With `onSend` it returns the image; otherwise it can send to any chat. */
export default function Whiteboard({ onSend, compact = false }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const strokes = useRef([]);
  const current = useRef(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const [count, setCount] = useState(0);
  const [pickOpen, setPickOpen] = useState(false);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const all = current.current ? [...strokes.current, current.current] : strokes.current;
    all.forEach(s => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      s.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else {
          const prev = s.points[i - 1];
          ctx.quadraticCurveTo(prev[0], prev[1], (prev[0] + p[0]) / 2, (prev[1] + p[1]) / 2);
        }
      });
      if (s.points.length === 1) ctx.lineTo(s.points[0][0] + 0.1, s.points[0][1] + 0.1);
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current, w = wrapRef.current;
      if (!c || !w) return;
      const dpr = window.devicePixelRatio || 1;
      const width = w.clientWidth, height = Math.min(compact ? 420 : 560, Math.max(300, window.innerHeight * (compact ? 0.5 : 0.6)));
      c.width = width * dpr; c.height = height * dpr;
      c.style.width = width + "px"; c.style.height = height + "px";
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw, compact]);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const down = (e) => {
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    current.current = { color: eraser ? "#ffffff" : color, size: eraser ? size * 2.5 : size * (e.pressure && e.pointerType === "pen" ? 0.5 + e.pressure : 1), points: [pos(e)] };
    redraw();
  };
  const move = (e) => {
    if (!current.current) return;
    current.current.points.push(pos(e));
    redraw();
  };
  const up = () => {
    if (!current.current) return;
    strokes.current.push(current.current);
    current.current = null;
    setCount(strokes.current.length);
    redraw();
  };
  const undo = () => { strokes.current.pop(); setCount(strokes.current.length); redraw(); };
  const clear = () => { strokes.current = []; setCount(0); redraw(); };

  const exportImage = () => {
    const c = canvasRef.current;
    const url = c.toDataURL("image/jpeg", 0.85);
    return { url, width: c.width, height: c.height };
  };

  return (
    <div className={`board ${compact ? "compact" : ""}`}>
      <div className="board-tools">
        <div className="board-colors">
          {COLORS.map(c => (
            <button key={c} className={`color-dot ${!eraser && color === c ? "on" : ""}`} style={{ background: c }} onClick={() => { setColor(c); setEraser(false); }} aria-label={`Colour ${c}`} />
          ))}
        </div>
        <div className="board-sizes">
          {SIZES.map(s => (
            <button key={s} className={`size-dot ${size === s ? "on" : ""}`} onClick={() => setSize(s)} aria-label={`Brush ${s}`}><span style={{ width: s + 2, height: s + 2 }} /></button>
          ))}
        </div>
        <div className="board-actions">
          <button className={`icon-btn ${!eraser ? "active" : ""}`} onClick={() => setEraser(false)} title="Brush"><IoBrushOutline /></button>
          <button className={`icon-btn ${eraser ? "active" : ""}`} onClick={() => setEraser(true)} title="Eraser"><BsEraser /></button>
          <button className="icon-btn" onClick={undo} disabled={!count} title="Undo"><IoArrowUndo /></button>
          <button className="icon-btn" onClick={clear} disabled={!count} title="Clear"><IoTrashOutline /></button>
        </div>
      </div>
      <div className="board-canvas" ref={wrapRef}>
        <canvas ref={canvasRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} style={{ touchAction: "none" }} />
        {!count && <div className="board-hint">Draw something ✏️</div>}
      </div>
      <div className="board-foot">
        {!onSend && <button className="btn btn-ghost" disabled={!count} onClick={() => downloadDataUrl(exportImage().url, "arhub-sketch.jpg")}><IoDownloadOutline /> Save</button>}
        <button className="btn btn-primary" disabled={!count} onClick={() => (onSend ? onSend(exportImage()) : setPickOpen(true))}><IoSend /> {onSend ? "Send sketch" : "Send to chat"}</button>
      </div>
      {!onSend && <ChatPicker open={pickOpen} onClose={() => setPickOpen(false)} onPick={async (chat, me) => {
        setPickOpen(false);
        try { await sendMessage(chat.id, { chat, me, type: "image", image: exportImage(), text: "🎨 Sketch" }); toastOk("Sketch sent"); }
        catch (e) { toastError(e); }
      }} />}
    </div>
  );
}

/** Pick one of my chats (used by hub modules to share things). */
export function ChatPicker({ open, onClose, onPick, title = "Send to…" }) {
  const { me, visibleChats = [], chatTitle, chatPartner } = useApp();
  return (
    <Sheet open={open} onClose={onClose} title={title} size="sm">
      {visibleChats.filter(c => c.members?.includes(me?.uid)).map(c => (
        <div key={c.id} className="row" onClick={() => onPick(c, me)}>
          <ChatAvatar chat={c} partner={chatPartner(c)} size={40} />
          <div className="row-body"><div className="row-title">{chatTitle(c)}</div></div>
        </div>
      ))}
      {visibleChats.length === 0 && <p className="info-meta" style={{ padding: "1rem" }}>No chats yet.</p>}
    </Sheet>
  );
}
