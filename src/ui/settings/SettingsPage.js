import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  IoArrowBack, IoPersonOutline, IoColorPaletteOutline, IoNotificationsOutline, IoLockClosedOutline,
  IoPhonePortraitOutline, IoLogOutOutline, IoChevronForward, IoCameraOutline, IoCheckmark, IoKeypadOutline,
  IoInformationCircleOutline, IoRefresh, IoCreateOutline,
} from "react-icons/io5";
import { auth } from "../../userauth/FireAuth";
import { useApp, toastError, toastOk } from "../../Context/ChatContext";
import { useTheme, ACCENTS, WALLPAPERS } from "../../Context/ThemeContext";
import { updateUserField, unblockUser, setPresence } from "../../lib/db";
import { compressImage } from "../../lib/media";
import { notificationPermission, requestNotificationPermission, sounds, showSystemNotification } from "../../lib/notify";
import Avatar from "../common/Avatar";
import Sheet, { Confirm } from "../common/Sheet";
import { canInstall, promptInstall } from "../shell/AppShell";

const SECTIONS = [
  { key: "profile", label: "Profile", icon: IoPersonOutline, desc: "Name, photo, about" },
  { key: "appearance", label: "Appearance", icon: IoColorPaletteOutline, desc: "Theme, accent, wallpaper, text size" },
  { key: "notifications", label: "Notifications", icon: IoNotificationsOutline, desc: "Sounds, pop-ups, push" },
  { key: "privacy", label: "Privacy", icon: IoLockClosedOutline, desc: "Read receipts, blocked contacts" },
  { key: "app", label: "App & shortcuts", icon: IoPhonePortraitOutline, desc: "Install, keyboard shortcuts, storage" },
];

const AVATAR_STYLES = ["avataaars", "adventurer", "bottts", "fun-emoji", "lorelei", "notionists", "pixel-art", "thumbs", "big-smile", "micah"];

export default function SettingsPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const { me, uid } = useApp();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const active = section || null;

  const logout = async () => {
    try {
      await setPresence(uid, false);
      Object.keys(localStorage).filter(k => k.startsWith("arhub_") && !k.startsWith("arhub_sound") && !k.startsWith("arhub_popups")).forEach(k => localStorage.removeItem(k));
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (e) { toastError(e); }
  };

  return (
    <div className={`page settings ${active ? "has-section" : ""}`}>
      <div className="settings-nav">
        <header className="page-header">
          <h1 className="page-title">Settings</h1>
        </header>
        <div className="page-body">
          <button className="settings-me" onClick={() => navigate("/settings/profile")}>
            <Avatar src={me?.avatar} name={me?.name} size={64} />
            <span className="settings-me-text"><strong>{me?.name}</strong><span>{me?.bio}</span></span>
            <IoChevronForward />
          </button>
          {SECTIONS.map(s => (
            <button key={s.key} className={`settings-link ${active === s.key ? "active" : ""}`} onClick={() => navigate(`/settings/${s.key}`)}>
              <s.icon className="settings-icon" />
              <span className="settings-link-text"><strong>{s.label}</strong><span>{s.desc}</span></span>
              <IoChevronForward className="chev" />
            </button>
          ))}
          <button className="settings-link" onClick={() => navigate("/about")}>
            <IoInformationCircleOutline className="settings-icon" />
            <span className="settings-link-text"><strong>About the developer</strong><span>Portfolio, tech stack & contact</span></span>
            <IoChevronForward className="chev" />
          </button>
          <button className="settings-link danger" onClick={() => setLogoutOpen(true)}>
            <IoLogOutOutline className="settings-icon" />
            <span className="settings-link-text"><strong>Log out</strong><span>{me?.email}</span></span>
          </button>
          <p className="settings-version">AR Hub · v2.0 · Made with ❤️ using React, Firebase & WebRTC</p>
        </div>
      </div>

      <div className="settings-content">
        {active ? (
          <>
            <header className="page-header">
              <button className="icon-btn settings-back" onClick={() => navigate("/settings")} aria-label="Back"><IoArrowBack /></button>
              <h1 className="page-title sm">{SECTIONS.find(s => s.key === active)?.label || "Settings"}</h1>
            </header>
            <div className="page-body">
              <div className="page-inner settings-inner">
                {active === "profile" && <ProfileSection />}
                {active === "appearance" && <AppearanceSection />}
                {active === "notifications" && <NotificationsSection />}
                {active === "privacy" && <PrivacySection />}
                {active === "app" && <AppSection />}
              </div>
            </div>
          </>
        ) : (
          <div className="settings-placeholder"><IoColorPaletteOutline /><p>Choose a setting to customise AR Hub</p></div>
        )}
      </div>

      <Confirm open={logoutOpen} onClose={() => setLogoutOpen(false)} danger title="Log out of AR Hub?" body="You'll need to sign in again to see your chats on this device." confirmLabel="Log out" onConfirm={logout} />
    </div>
  );
}

function Toggle({ checked, onChange, title, desc }) {
  return (
    <label className="setting-row card-row">
      <span className="setting-text"><strong>{title}</strong>{desc && <span>{desc}</span>}</span>
      <span className="switch"><input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} /><span /></span>
    </label>
  );
}

function ProfileSection() {
  const { uid, me } = useApp();
  const [name, setName] = useState(me?.name || "");
  const [bio, setBio] = useState(me?.bio || "");
  const [saving, setSaving] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  useEffect(() => { setName(me?.name || ""); setBio(me?.bio || ""); }, [me?.name, me?.bio]);
  const dirty = name.trim() !== (me?.name || "") || bio.trim() !== (me?.bio || "");

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try { await updateUserField(uid, { name: name.trim(), bio: bio.trim() }); toastOk("Profile updated"); }
    catch (e) { toastError(e); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="profile-hero">
        <button className="profile-avatar" onClick={() => setAvatarOpen(true)} aria-label="Change photo">
          <Avatar src={me?.avatar} name={me?.name} size={128} />
          <span className="profile-cam"><IoCameraOutline /></span>
        </button>
        <span className="muted-text">{me?.email}</span>
      </div>
      <div className="field">
        <span className="field-label">Name</span>
        <input className="input" value={name} maxLength={40} onChange={e => setName(e.target.value)} />
      </div>
      <div className="field">
        <span className="field-label">About</span>
        <textarea className="textarea" value={bio} maxLength={140} onChange={e => setBio(e.target.value)} placeholder="Hey there! I'm using AR Hub." />
        <span className="field-hint">{bio.length}/140</span>
      </div>
      <div className="chips wrap" style={{ marginBottom: 16 }}>
        {["Available", "Busy", "At work", "In a meeting", "🎮 Gaming", "🏋️ At the gym", "😴 Sleeping", "🚀 Building something cool"].map(s => (
          <button key={s} className="chip" onClick={() => setBio(s)}>{s}</button>
        ))}
      </div>
      <button className="btn btn-primary" disabled={!dirty || saving || !name.trim()} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
      <AvatarSheet open={avatarOpen} onClose={() => setAvatarOpen(false)} />
    </>
  );
}

function AvatarSheet({ open, onClose }) {
  const { uid, me } = useApp();
  const [seed, setSeed] = useState(uid);
  const [url, setUrl] = useState("");
  const fileRef = useRef(null);
  const set = async (avatar) => {
    try { await updateUserField(uid, { avatar }); toastOk("Profile photo updated"); onClose(); } catch (e) { toastError(e); }
  };
  const upload = async (f) => {
    if (!f) return;
    try { const img = await compressImage(f, 320); await set(img.url); } catch (e) { toastError(e); }
  };
  return (
    <Sheet open={open} onClose={onClose} title="Profile photo" size="md">
      <div className="avatar-actions">
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()}><IoCameraOutline /> Upload photo</button>
        <button className="btn btn-ghost" onClick={() => setSeed(Math.random().toString(36).slice(2))}><IoRefresh /> Shuffle</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="field-label" style={{ margin: "12px 0 8px" }}>Or pick an illustrated avatar</div>
      <div className="avatar-grid">
        {AVATAR_STYLES.map(st => {
          const src = `https://api.dicebear.com/7.x/${st}/svg?seed=${encodeURIComponent(seed)}`;
          return (
            <button key={st} className={`avatar-opt ${me?.avatar === src ? "on" : ""}`} onClick={() => set(src)}>
              <img src={src} alt={st} loading="lazy" />
              {me?.avatar === src && <span className="avatar-check"><IoCheckmark /></span>}
            </button>
          );
        })}
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <span className="field-label">Image URL</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
          <button className="btn btn-soft" disabled={!/^https:\/\//.test(url.trim())} onClick={() => set(url.trim())}>Use</button>
        </div>
      </div>
    </Sheet>
  );
}

function AppearanceSection() {
  const { themePref, setTheme, accent, setAccent, wallpaper, setWallpaper, fontScale, setFontScale } = useTheme();
  return (
    <>
      <div className="setting-group">
        <div className="field-label">Theme</div>
        <div className="theme-cards">
          {[{ k: "light", l: "Light" }, { k: "dark", l: "Dark" }, { k: "system", l: "System" }].map(t => (
            <button key={t.k} className={`theme-card ${themePref === t.k ? "on" : ""}`} onClick={() => setTheme(t.k)}>
              <span className={`theme-mock ${t.k}`}><i /><i /><i /></span>
              <span>{t.l}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="setting-group">
        <div className="field-label">Accent colour</div>
        <div className="color-row">
          {ACCENTS.map(c => <button key={c} className={`color-dot lg ${accent === c ? "on" : ""}`} style={{ background: c }} onClick={() => setAccent(c)} aria-label={c}>{accent === c && <IoCheckmark />}</button>)}
          <label className="color-dot lg custom" title="Custom colour"><input type="color" value={accent} onChange={e => setAccent(e.target.value)} /><IoCreateOutline /></label>
        </div>
      </div>
      <div className="setting-group">
        <div className="field-label">Default chat wallpaper</div>
        <div className="wp-picker big">
          {WALLPAPERS.map(w => (
            <button key={w.key} className={`wp-swatch wp-${w.key} ${wallpaper === w.key ? "on" : ""}`} onClick={() => setWallpaper(w.key)}><span>{w.label}</span></button>
          ))}
        </div>
      </div>
      <div className="setting-group">
        <div className="field-label">Message text size</div>
        <div className="seg">
          {[{ k: "sm", l: "Small" }, { k: "md", l: "Medium" }, { k: "lg", l: "Large" }].map(f => (
            <button key={f.k} className={fontScale === f.k ? "on" : ""} onClick={() => setFontScale(f.k)}>{f.l}</button>
          ))}
        </div>
        <div className="bubble-demo">
          <div className="bubble in tail"><span className="bubble-text">Hey! How's the new theme? 🎨</span></div>
          <div className="bubble out tail"><span className="bubble-text">Looks amazing ✨</span></div>
        </div>
      </div>
    </>
  );
}

function NotificationsSection() {
  const { uid, me, soundEnabled, toggleSound, popupsEnabled, togglePopups } = useApp();
  const [perm, setPerm] = useState(notificationPermission());
  return (
    <>
      <div className="card settings-card">
        <div className="setting-row card-row">
          <span className="setting-text">
            <strong>Push notifications</strong>
            <span>{perm === "granted" ? "Enabled — you'll be alerted while AR Hub is in the background." : perm === "denied" ? "Blocked in your browser settings." : perm === "unsupported" ? "Not supported on this browser." : "Get alerts for new messages and calls."}</span>
          </span>
          {perm === "default" && <button className="btn btn-primary btn-sm" onClick={async () => setPerm(await requestNotificationPermission())}>Enable</button>}
          {perm === "granted" && <button className="btn btn-ghost btn-sm" onClick={() => showSystemNotification("AR Hub", { body: "Notifications are working 🎉", tag: "test" })}>Test</button>}
        </div>
        <Toggle title="Message notifications" desc="Notify me about new messages (mentions always notify)" checked={me?.notificationsEnabled !== false} onChange={(v) => updateUserField(uid, { notificationsEnabled: v }).catch(toastError)} />
        <Toggle title="In-app sounds" desc="Play sounds for sent and received messages" checked={soundEnabled} onChange={() => { toggleSound(); if (!soundEnabled) sounds.notify(); }} />
        <Toggle title="In-app pop-ups" desc="Show a banner when a message arrives in another chat" checked={popupsEnabled} onChange={togglePopups} />
      </div>
      <p className="field-hint" style={{ marginTop: 10 }}>Tip: mute individual chats from the chat list (long-press or right-click) or from chat info.</p>
    </>
  );
}

function PrivacySection() {
  const { uid, me, usersById } = useApp();
  const blocked = (me?.blocklist || []).map(b => usersById[b] || { uid: b, name: "Unknown user" });
  return (
    <>
      <div className="card settings-card">
        <Toggle title="Read receipts" desc="If turned off, others won't see blue ticks when you read their messages" checked={me?.readReceipts !== false} onChange={(v) => updateUserField(uid, { readReceipts: v }).catch(toastError)} />
      </div>
      <div className="field-label" style={{ margin: "20px 0 8px" }}>Blocked contacts · {blocked.length}</div>
      <div className="card settings-card">
        {blocked.length === 0 && <p className="info-meta" style={{ padding: "1rem" }}>You haven't blocked anyone.</p>}
        {blocked.map(u => (
          <div key={u.uid} className="row" style={{ cursor: "default" }}>
            <Avatar src={u.avatar} name={u.name} size={40} />
            <div className="row-body"><div className="row-title">{u.name}</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => unblockUser(uid, u.uid).then(() => toastOk(`${u.name} unblocked`)).catch(toastError)}>Unblock</button>
          </div>
        ))}
      </div>
    </>
  );
}

function AppSection() {
  const [installable, setInstallable] = useState(canInstall());
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
  useEffect(() => {
    const h = () => setInstallable(true);
    window.addEventListener("arhub-installable", h);
    return () => window.removeEventListener("arhub-installable", h);
  }, []);
  const clearCache = () => {
    Object.keys(localStorage).filter(k => /^arhub_(me|chats|allUsers|draft)/.test(k)).forEach(k => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter(k => k.startsWith("arhub_")).forEach(k => sessionStorage.removeItem(k));
    toastOk("Local cache cleared", "Fresh data will load from the cloud.");
  };
  const shortcuts = [
    ["Ctrl / ⌘ + K", "Search everything"], ["Alt + 1…5", "Switch tabs"], ["Ctrl / ⌘ + ,", "Open settings"],
    ["Enter", "Send message"], ["Shift + Enter", "New line"], ["Esc", "Cancel reply / close"], ["@", "Mention in rooms"],
    ["*bold* _italic_ ~strike~ `code`", "Format text"],
  ];
  return (
    <>
      <div className="card settings-card install-card">
        <div className="setting-row card-row">
          <img src="/icon.svg" alt="" width="48" height="48" style={{ borderRadius: 12 }} />
          <span className="setting-text">
            <strong>{standalone ? "AR Hub is installed" : "Install AR Hub"}</strong>
            <span>{standalone ? "You're using the app version." : installable ? "Add AR Hub to your home screen or desktop for a native app feel." : "Use your browser menu → “Install app” / “Add to Home Screen”."}</span>
          </span>
          {!standalone && installable && <button className="btn btn-primary btn-sm" onClick={async () => { await promptInstall(); setInstallable(false); }}>Install</button>}
        </div>
      </div>
      <div className="field-label" style={{ margin: "20px 0 8px" }}><IoKeypadOutline /> Keyboard shortcuts & formatting</div>
      <div className="card settings-card">
        {shortcuts.map(([k, v]) => (
          <div key={k} className="shortcut-row"><span>{v}</span><kbd>{k}</kbd></div>
        ))}
      </div>
      <div className="field-label" style={{ margin: "20px 0 8px" }}>Storage</div>
      <div className="card settings-card">
        <div className="setting-row card-row">
          <span className="setting-text"><strong>Clear local cache</strong><span>Removes cached chats and drafts on this device. Your cloud data is untouched.</span></span>
          <button className="btn btn-ghost btn-sm" onClick={clearCache}>Clear</button>
        </div>
      </div>
    </>
  );
}
