/**
 * media.js — client-side media helpers. Media is stored inline in Firestore
 * documents (1 MiB limit), so everything is compressed before sending.
 */

const MAX_INLINE_BYTES = 700 * 1024; // leave headroom for the rest of the doc

const readAsDataURL = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = reject;
  r.readAsDataURL(blob);
});

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("Could not read that image."));
  img.src = src;
});

/** Resize + JPEG-compress an image file until it fits inline. */
export async function compressImage(file, maxDim = 1280) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const src = await readAsDataURL(file);
  const img = await loadImage(src);
  let dim = maxDim;
  let quality = 0.8;
  for (let attempt = 0; attempt < 7; attempt++) {
    const scale = Math.min(1, dim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const url = canvas.toDataURL("image/jpeg", quality);
    if (url.length * 0.75 <= MAX_INLINE_BYTES) return { url, width: w, height: h };
    if (quality > 0.55) quality -= 0.1; else dim = Math.round(dim * 0.8);
  }
  throw new Error("That image is too large to send.");
}

/** Pick the best supported recording MIME type. */
function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  const types = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"];
  return types.find(t => MediaRecorder.isTypeSupported?.(t)) || "";
}

export const canRecordVoice = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

export const MAX_VOICE_SECONDS = 120;

/**
 * Start a voice recording. Returns a controller:
 *   stop()   → Promise<{ url, duration, mime, waveform }>
 *   cancel()
 *   onLevel(cb) — live input level 0..1 for the UI meter
 */
export async function startVoiceRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mime = pickMime();
  const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24000 });
  const chunks = [];
  const levels = [];
  let levelCb = null;
  const started = Date.now();

  const AC = window.AudioContext || window.webkitAudioContext;
  const actx = AC ? new AC() : null;
  let raf = null;
  if (actx) {
    const src = actx.createMediaStreamSource(stream);
    const an = actx.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    const buf = new Uint8Array(an.fftSize);
    let lastSample = 0;
    const tick = () => {
      an.getByteTimeDomainData(buf);
      let peak = 0;
      for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128) / 128);
      levelCb?.(peak);
      const now = Date.now();
      if (now - lastSample > 100) { levels.push(peak); lastSample = now; }
      raf = requestAnimationFrame(tick);
    };
    tick();
  }

  rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
  rec.start(250);

  const teardown = () => {
    cancelAnimationFrame(raf);
    stream.getTracks().forEach(t => t.stop());
    actx?.close().catch(() => {});
  };

  return {
    startedAt: started,
    onLevel(cb) { levelCb = cb; },
    stop() {
      return new Promise((resolve, reject) => {
        rec.onstop = async () => {
          teardown();
          const duration = (Date.now() - started) / 1000;
          const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
          if (blob.size * 1.34 > 900 * 1024) { reject(new Error("Voice message is too long.")); return; }
          const url = await readAsDataURL(blob);
          resolve({ url, duration, mime: blob.type, waveform: downsample(levels, 40) });
        };
        if (rec.state !== "inactive") rec.stop(); else rec.onstop();
      });
    },
    cancel() {
      rec.onstop = null;
      if (rec.state !== "inactive") rec.stop();
      teardown();
    },
  };
}

function downsample(arr, n) {
  if (!arr.length) return Array(n).fill(0.15);
  const out = [];
  const step = arr.length / n;
  for (let i = 0; i < n; i++) {
    const slice = arr.slice(Math.floor(i * step), Math.max(Math.floor((i + 1) * step), Math.floor(i * step) + 1));
    const v = slice.reduce((a, b) => Math.max(a, b), 0);
    out.push(Math.round(Math.min(1, Math.max(0.08, v * 1.6)) * 100) / 100);
  }
  return out;
}

export function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Location isn't available on this device.")); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), accuracy: Math.round(p.coords.accuracy) }),
      e => reject(new Error(e.code === 1 ? "Location permission denied." : "Couldn't get your location.")),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

/** Save a data URL / blob as a download. */
export function downloadDataUrl(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
