import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IoClose } from "react-icons/io5";

/**
 * Responsive modal: bottom sheet on phones, centred dialog on larger screens.
 * Closes on Escape, backdrop tap and swipe-down on the grab handle.
 */
export default function Sheet({ open, onClose, title, children, footer, size = "md", className = "", hideClose = false }) {
  const panelRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose?.(); } };
    window.addEventListener("keydown", onKey, true);
    const prev = document.activeElement;
    setTimeout(() => {
      const el = panelRef.current?.querySelector("[autofocus], input, textarea, button:not(.sheet-x)");
      if (el && window.matchMedia("(pointer: fine)").matches) el.focus();
    }, 50);
    return () => { window.removeEventListener("keydown", onKey, true); prev?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;

  const onTouchStart = (e) => { drag.current = { y: e.touches[0].clientY, dy: 0 }; };
  const onTouchMove = (e) => {
    if (!drag.current) return;
    const dy = Math.max(0, e.touches[0].clientY - drag.current.y);
    drag.current.dy = dy;
    if (panelRef.current) panelRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onTouchEnd = () => {
    if (!drag.current) return;
    if (drag.current.dy > 90) onClose?.();
    else if (panelRef.current) panelRef.current.style.transform = "";
    drag.current = null;
  };

  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={panelRef} className={`sheet sheet-${size} ${className}`} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
        <div className="sheet-grab" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}><span /></div>
        {(title || !hideClose) && (
          <div className="sheet-head">
            <div className="sheet-title">{title}</div>
            {!hideClose && <button className="icon-btn sheet-x" onClick={onClose} aria-label="Close"><IoClose /></button>}
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Confirm({ open, title, body, confirmLabel = "Confirm", danger = false, onConfirm, onClose, extra }) {
  return (
    <Sheet open={open} onClose={onClose} title={title} size="sm" hideClose>
      {body && <p className="confirm-body">{body}</p>}
      {extra}
      <div className="confirm-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={() => { onConfirm?.(); onClose?.(); }}>{confirmLabel}</button>
      </div>
    </Sheet>
  );
}
