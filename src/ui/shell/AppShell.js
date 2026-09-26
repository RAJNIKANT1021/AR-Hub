import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  IoChatbubbles, IoChatbubblesOutline, IoPeople, IoPeopleOutline, IoCall, IoCallOutline,
  IoApps, IoAppsOutline, IoNotifications, IoNotificationsOutline, IoSettingsOutline,
  IoPersonCircleOutline, IoSunnyOutline, IoMoonOutline, IoSearch, IoCompass, IoCompassOutline,
} from "react-icons/io5";
import { TbCircleDashed } from "react-icons/tb";
import { useApp } from "../../Context/ChatContext";
import { useTheme } from "../../Context/ThemeContext";
import Avatar from "../common/Avatar";
import CommandPalette from "./CommandPalette";

export const NAV = [
  { to: "/chat",    label: "Chats",   icon: IoChatbubblesOutline, active: IoChatbubbles, badge: "chats" },
  { to: "/rooms",   label: "Rooms",   icon: IoPeopleOutline, active: IoPeople },
  { to: "/explore", label: "Explore", icon: IoCompassOutline, active: IoCompass },
  { to: "/calls",   label: "Calls",   icon: IoCallOutline, active: IoCall },
  { to: "/hub",     label: "Hub",     icon: IoAppsOutline, active: IoApps },
];
// Desktop rail has room for Status too (on phones it lives in Explore's stories bar)
const RAIL = [...NAV.slice(0, 3), { to: "/status", label: "Status", icon: TbCircleDashed, active: TbCircleDashed }, ...NAV.slice(3)];

// Captured once so the "Install app" button can be offered anywhere
let deferredInstall = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; window.dispatchEvent(new Event("arhub-installable")); });
}
export const canInstall = () => !!deferredInstall;
export async function promptInstall() {
  if (!deferredInstall) return false;
  deferredInstall.prompt();
  const { outcome } = await deferredInstall.userChoice.catch(() => ({}));
  deferredInstall = null;
  return outcome === "accepted";
}

export default function AppShell({ children }) {
  const { me, totalUnread, unreadNotifs } = useApp();
  const { theme, toggleTheme } = useTheme();
  const loc = useLocation();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Bottom tabs only on top-level screens (hidden inside a conversation / sub page)
  const path = loc.pathname;
  const showBottom = ["/chat", "/rooms", "/status", "/calls", "/hub", "/explore", "/explore/feed", "/explore/forums", "/explore/confessions"].includes(path);

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen(o => !o); }
      if (mod && e.key === ",") { e.preventDefault(); navigate("/settings"); }
      if (e.altKey && /^[1-5]$/.test(e.key)) { e.preventDefault(); navigate(NAV[+e.key - 1].to); }
    };
    window.addEventListener("keydown", onKey);
    const open = () => setPaletteOpen(true);
    window.addEventListener("arhub-palette", open);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("arhub-palette", open); };
  }, [navigate]);

  const isActive = (to) => path === to || path.startsWith(to + "/");

  return (
    <div className={`shell ${showBottom ? "with-bottom" : ""}`}>
      <nav className="rail" aria-label="Main">
        <div className="rail-logo" title="AR Hub"><img src="/icon.svg" alt="AR Hub" /></div>
        <div className="rail-items">
          {RAIL.map(n => {
            const Icon = isActive(n.to) ? n.active : n.icon;
            return (
              <NavLink key={n.to} to={n.to} className={`rail-item ${isActive(n.to) ? "active" : ""}`} title={n.label}>
                <span className="rail-icon"><Icon />{n.badge === "chats" && totalUnread > 0 && <span className="dot-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>}</span>
                <span className="rail-label">{n.label}</span>
              </NavLink>
            );
          })}
        </div>
        <div className="rail-bottom">
          <button className="icon-btn" title="Search everything (Ctrl K)" onClick={() => setPaletteOpen(true)}><IoSearch /></button>
          <NavLink to="/notifications" className={`icon-btn ${isActive("/notifications") ? "active" : ""}`} title="Notifications">
            {isActive("/notifications") ? <IoNotifications /> : <IoNotificationsOutline />}
            {unreadNotifs > 0 && <span className="dot-badge">{unreadNotifs > 99 ? "99+" : unreadNotifs}</span>}
          </NavLink>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">{theme === "dark" ? <IoSunnyOutline /> : <IoMoonOutline />}</button>
          <NavLink to="/about" className={`icon-btn ${isActive("/about") ? "active" : ""}`} title="About the developer"><IoPersonCircleOutline /></NavLink>
          <NavLink to="/settings" className={`icon-btn ${isActive("/settings") ? "active" : ""}`} title="Settings"><IoSettingsOutline /></NavLink>
          <NavLink to="/settings/profile" className="rail-me" title="Profile">
            <Avatar src={me?.avatar} name={me?.name} size={36} />
          </NavLink>
        </div>
      </nav>

      <main className="shell-main">{children}</main>

      {showBottom && (
        <nav className="bottom-nav" aria-label="Tabs">
          {NAV.map(n => {
            const act = isActive(n.to);
            const Icon = act ? n.active : n.icon;
            return (
              <NavLink key={n.to} to={n.to} className={`bottom-item ${act ? "active" : ""}`}>
                <span className="bottom-pill"><Icon />{n.badge === "chats" && totalUnread > 0 && <span className="dot-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>}</span>
                <span className="bottom-label">{n.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
