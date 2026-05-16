import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../Context/ThemeContext';
import { useChatContext } from '../Context/ChatContext';
import { setPresence } from '../lib/db';
import { IoChatbubblesOutline, IoCloudyOutline, IoNewspaperOutline } from 'react-icons/io5';
import { MdOutlineLightMode, MdOutlineDarkMode } from 'react-icons/md';
import './Navbar.css';

function Navbar({ loggedin, checker, uid }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const ctx = useChatContext?.() || {};
  const { totalUnread = 0 } = ctx;

  const logout = async () => {
    if (uid) await setPresence(uid, false);
    localStorage.removeItem('user');
    checker(false, null);
    navigate('/');
  };

  const navItems = [
    { path: '/weather', icon: <IoCloudyOutline />, label: 'Weather' },
    { path: '/feed',    icon: <IoNewspaperOutline />, label: 'News' },
    {
      path: '/chat',
      icon: (
        <span style={{ position: 'relative', display: 'inline-flex' }}>
          <IoChatbubblesOutline />
          {totalUnread > 0 && (
            <span className="nav-badge">{totalUnread > 99 ? '99+' : totalUnread}</span>
          )}
        </span>
      ),
      label: 'Chat'
    },
  ];

  return (
    <nav className="navbar-pro">
      <div className="navbar-brand-pro">
        <span className="brand-dot" />
        <span className="brand-name">AR Hub</span>
      </div>

      <div className="navbar-links-pro">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link-pro ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="navbar-actions-pro">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <MdOutlineLightMode /> : <MdOutlineDarkMode />}
        </button>
        {!loggedin && (
          <Link to="/" className="btn-nav-auth">Log In</Link>
        )}
        {loggedin && (
          <button className="btn-nav-auth btn-logout" onClick={logout}>Log Out</button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
