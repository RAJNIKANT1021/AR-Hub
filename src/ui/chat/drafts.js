import { useEffect, useState } from "react";

const KEY = (cid) => `arhub_draft_${cid}`;

export function getDraft(cid) {
  try { return localStorage.getItem(KEY(cid)) || ""; } catch { return ""; }
}

export function setDraft(cid, text) {
  try {
    if (text && text.trim()) localStorage.setItem(KEY(cid), text);
    else localStorage.removeItem(KEY(cid));
  } catch {}
  window.dispatchEvent(new Event("arhub-drafts"));
}

/** Re-render when any draft changes (chat list "Draft:" previews). */
export function useDraftVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV(x => x + 1);
    window.addEventListener("arhub-drafts", h);
    return () => window.removeEventListener("arhub-drafts", h);
  }, []);
  return v;
}
