import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Floating context menu anchored at a point ({x, y}) — used for right-click,
 * long-press and "⋮" buttons. Automatically kept inside the viewport.
 * items: [{ label, icon, onClick, danger, hidden, divider }]
 */
export default function Menu({ at, items, onClose, header = null }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });

  useLayoutEffect(() => {
    if (!at || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = Math.min(at.x, vw - r.width - 8);
    let top = at.y + r.height > vh - 8 ? at.y - r.height : at.y;
    top = Math.max(8, Math.min(top, vh - r.height - 8));
    left = Math.max(8, left);
    setPos({ left, top });
  }, [at]);

  useEffect(() => {
    if (!at) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const t = setTimeout(() => {
      document.addEventListener("mousedown", close);
      document.addEventListener("touchstart", close, { passive: true });
    }, 0);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
    };
  }, [at, onClose]);

  if (!at) return null;
  return createPortal(
    <div className="menu-layer">
      <div ref={ref} className="menu" style={pos} role="menu">
        {header}
        {items.filter(i => !i.hidden).map((i, idx) => i.divider
          ? <div key={idx} className="menu-divider" />
          : (
            <button key={idx} role="menuitem" className={`menu-item ${i.danger ? "danger" : ""}`}
              onClick={() => { onClose(); i.onClick?.(); }}>
              {i.icon && <span className="menu-icon">{i.icon}</span>}
              <span>{i.label}</span>
            </button>
          ))}
      </div>
    </div>,
    document.body
  );
}

/** Hook: long-press (touch) + right-click (mouse) → menu position. */
export function useLongPress(onOpen, { delay = 420 } = {}) {
  const timer = useRef(null);
  const start = useRef(null);
  const firedAt = useRef(0);
  const clear = () => { clearTimeout(timer.current); timer.current = null; };
  const recentlyFired = () => Date.now() - firedAt.current < 900;
  return {
    onContextMenu: (e) => {
      e.preventDefault();
      // Touch browsers also fire contextmenu after a long-press we already handled
      if (recentlyFired()) return;
      onOpen({ x: e.clientX, y: e.clientY }, e);
    },
    onTouchStart: (e) => {
      const t = e.touches[0];
      start.current = { x: t.clientX, y: t.clientY };
      clear();
      timer.current = setTimeout(() => {
        firedAt.current = Date.now();
        try { navigator.vibrate?.(15); } catch {}
        onOpen({ x: start.current.x, y: start.current.y }, e);
      }, delay);
    },
    onTouchMove: (e) => {
      if (!start.current) return;
      const t = e.touches[0];
      if (Math.abs(t.clientX - start.current.x) > 10 || Math.abs(t.clientY - start.current.y) > 10) clear();
    },
    onTouchEnd: (e) => { clear(); if (recentlyFired() && e.cancelable) e.preventDefault(); },
    onTouchCancel: clear,
    wasLongPress: recentlyFired,
  };
}
