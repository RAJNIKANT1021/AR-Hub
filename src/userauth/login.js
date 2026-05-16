import React, { useState } from 'react';
import './login.css';
import { RiEyeFill, RiEyeCloseFill } from 'react-icons/ri';
import { FcBusinessman } from 'react-icons/fc';
import { FiAtSign } from 'react-icons/fi';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './FireAuth';
import { useNavigate } from 'react-router-dom';
import { createUser, getUser, setPresence } from '../lib/db';

function Login({ checker }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter a display name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const formattedName = name[0].toUpperCase() + name.slice(1);
      await createUser(uid, { name: formattedName, email });
      localStorage.setItem('user', uid);
      checker(true, uid);
      navigate('/chat');
    } catch (e) {
      setError(e.message.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      // Ensure user doc exists (legacy accounts)
      const existing = await getUser(uid);
      if (!existing) {
        await createUser(uid, { name: email.split('@')[0], email });
      }
      await setPresence(uid, true);
      localStorage.setItem('user', uid);
      checker(true, uid);
      navigate('/chat');
    } catch (e) {
      setError(e.message.replace('Firebase: ', '').replace(/\(auth.*\)\.?/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleSignup();
  };

  return (
    <div className="login-page">
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />

      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-dot" />
          <span className="login-logo-text">AR Hub</span>
        </div>

        <div className="login-tabs">
          <button className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>
            Log In
          </button>
          <button className={`login-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setError(''); }}>
            Sign Up
          </button>
        </div>

        {error && <div className="login-error">{error}</div>}

        {tab === 'signup' && (
          <div className="login-field">
            <label className="login-label">Display Name</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={handleKey}
              />
              <span className="login-input-icon"><FcBusinessman /></span>
            </div>
          </div>
        )}

        <div className="login-field">
          <label className="login-label">Email</label>
          <div className="login-input-wrap">
            <input
              className="login-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKey}
            />
            <span className="login-input-icon"><FiAtSign /></span>
          </div>
        </div>

        <div className="login-field">
          <label className="login-label">Password</label>
          <div className="login-input-wrap">
            <input
              className="login-input"
              type={showPass ? 'text' : 'password'}
              placeholder={tab === 'signup' ? 'Min 6 characters' : 'Enter password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKey}
            />
            <span className="login-input-icon" onClick={() => setShowPass(s => !s)}>
              {showPass ? <RiEyeFill /> : <RiEyeCloseFill />}
            </span>
          </div>
        </div>

        <button
          className="login-btn"
          onClick={tab === 'login' ? handleLogin : handleSignup}
          disabled={loading}
        >
          {loading ? <span className="login-btn-spin" /> : (tab === 'login' ? 'Log In' : 'Create Account')}
        </button>
      </div>
    </div>
  );
}

export default Login;
