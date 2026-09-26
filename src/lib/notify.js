/**
 * notify.js — sounds, system notifications (via the service worker so they
 * also work on Android), vibration and the unread app badge.
 */

let actx = null;
function ctx() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!actx) actx = new AC();
  if (actx.state === "suspended") actx.resume().catch(() => {});
  return actx;
}

function tone(freqs, { gain = 0.12, dur = 0.12, gap = 0.07, type = "sine" } = {}) {
  try {
    const c = ctx();
    if (!c) return;
    freqs.forEach((f, i) => {
      const t0 = c.currentTime + i * (dur + gap);
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(c.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    });
  } catch {}
}

export const sounds = {
  send:    () => tone([520, 780], { gain: 0.07, dur: 0.07, gap: 0.02 }),
  receive: () => tone([660, 880], { gain: 0.09, dur: 0.09, gap: 0.03 }),
  notify:  () => tone([880, 660, 990], { gain: 0.1, dur: 0.1, gap: 0.04, type: "triangle" }),
  tap:     () => tone([1200], { gain: 0.03, dur: 0.03 }),
};

// Unlock audio on the first user gesture (autoplay policies)
if (typeof window !== "undefined") {
  const unlock = () => { ctx(); window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

export const vibrate = (pattern = 30) => { try { navigator.vibrate?.(pattern); } catch {} };

export const notificationsSupported = () => typeof window !== "undefined" && "Notification" in window;
export const notificationPermission = () => (notificationsSupported() ? Notification.permission : "unsupported");

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try { return await Notification.requestPermission(); } catch { return Notification.permission; }
}

/** Show a system notification. `url` is opened/focused on click. */
export async function showSystemNotification(title, { body, icon, tag, url = "/" } = {}) {
  if (notificationPermission() !== "granted") return;
  const opts = {
    body, tag,
    icon: icon && !icon.endsWith(".svg") ? icon : "/logo192.png",
    badge: "/logo192.png",
    data: { url },
    renotify: !!tag,
  };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, opts); return; }
  } catch {}
  try {
    const n = new Notification(title, opts);
    n.onclick = () => { window.focus(); window.location.assign(url); n.close(); };
  } catch {}
}

/** Unread count on the tab title and the installed-app icon. */
export function setUnreadBadge(count) {
  const base = "AR Hub";
  document.title = count > 0 ? `(${count > 99 ? "99+" : count}) ${base}` : base;
  try {
    if (count > 0) navigator.setAppBadge?.(count);
    else navigator.clearAppBadge?.();
  } catch {}
}
