import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithPopup, updateProfile,
} from "firebase/auth";
import { IoEyeOutline, IoEyeOffOutline, IoArrowBack, IoMailOutline, IoLockClosedOutline, IoPersonOutline } from "react-icons/io5";
import "../../styles/about.css";
import { auth } from "../../userauth/FireAuth";
import { setPendingSignupName } from "./pending";

const friendly = (e) => {
  const code = e?.code || "";
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password. Try again or reset it.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-login-credentials": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists with that email — try signing in.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error — check your connection.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled for this project.",
    "auth/unauthorized-domain": "This domain isn't authorised for Google sign-in.",
  };
  return map[code] || (e?.message || "Something went wrong").replace("Firebase: ", "").replace(/\s*\(auth\/.*\)\.?/, "");
};

export default function AuthPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const switchMode = (m) => { setMode(m); setError(""); setInfo(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (mode !== "reset" && !email.trim()) return setError("Please enter your email.");
    if (mode === "signup" && !name.trim()) return setError("Please enter your name.");
    if (mode === "signup" && password.length < 6) return setError("Password must be at least 6 characters.");
    if (mode === "login" && !password) return setError("Please enter your password.");
    setBusy(true);
    try {
      if (mode === "signup") {
        setPendingSignupName(name.trim());
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        updateProfile(cred.user, { displayName: name.trim() }).catch(() => {});
      } else if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        if (!email.trim()) { setBusy(false); return setError("Enter the email for your account."); }
        await sendPasswordResetEmail(auth, email.trim());
        setInfo("Check your inbox for a password reset link.");
        setBusy(false);
        return;
      }
      // App's auth listener takes over and routes to the requested page
    } catch (err) {
      setPendingSignupName(null);
      setError(friendly(err));
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    setBusy(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (err) { setError(friendly(err)); setBusy(false); }
  };

  return (
    <div className="auth">
      <div className="auth-art" aria-hidden>
        <div className="land-glow" />
        <div className="auth-art-copy">
          <img src="/icon.svg" alt="" width="64" height="64" />
          <h2>Chat. Call. Play. Together.</h2>
          <ul>
            <li>💬 Real-time chats & rooms</li>
            <li>📞 HD voice & video calls</li>
            <li>⭕ Status stories</li>
            <li>🎮 11 multiplayer games</li>
          </ul>
        </div>
      </div>

      <div className="auth-panel">
        <button className="icon-btn auth-back" onClick={() => navigate("/")} aria-label="Back"><IoArrowBack /></button>
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="auth-brand"><img src="/icon.svg" alt="" width="40" height="40" /><span>AR Hub</span></div>
          <h1>{mode === "signup" ? "Create your account" : mode === "reset" ? "Reset password" : "Welcome back"}</h1>
          <p className="auth-sub">{mode === "signup" ? "Join in seconds — it's free." : mode === "reset" ? "We'll email you a link to set a new password." : "Sign in to continue to your chats."}</p>

          {mode !== "reset" && (
            <div className="auth-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "on" : ""} onClick={() => switchMode("login")}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "on" : ""} onClick={() => switchMode("signup")}>Sign up</button>
            </div>
          )}

          {error && <div className="form-error" role="alert">{error}</div>}
          {info && <div className="form-info" role="status">{info}</div>}

          {mode === "signup" && (
            <label className="auth-field">
              <IoPersonOutline />
              <input autoComplete="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} maxLength={40} />
            </label>
          )}
          <label className="auth-field">
            <IoMailOutline />
            <input type="email" autoComplete="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          {mode !== "reset" && (
            <label className="auth-field">
              <IoLockClosedOutline />
              <input type={show ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "Password (min 6 characters)" : "Password"} value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" className="auth-eye" onClick={() => setShow(s => !s)} aria-label={show ? "Hide password" : "Show password"}>{show ? <IoEyeOffOutline /> : <IoEyeOutline />}</button>
            </label>
          )}

          {mode === "login" && <button type="button" className="link-btn auth-forgot" onClick={() => switchMode("reset")}>Forgot password?</button>}

          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            {busy ? <span className="spinner" style={{ width: 20, height: 20, borderTopColor: "#fff" }} /> : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}
          </button>

          {mode === "reset" ? (
            <button type="button" className="link-btn" style={{ justifyContent: "center" }} onClick={() => switchMode("login")}>← Back to sign in</button>
          ) : (
            <>
              <div className="auth-or"><span>or</span></div>
              <button type="button" className="btn btn-outline btn-lg btn-block" onClick={google} disabled={busy}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
                Continue with Google
              </button>
            </>
          )}
          <p className="auth-legal">By continuing you agree to be excellent to each other. <Link to="/about">Meet the developer</Link></p>
        </form>
      </div>
    </div>
  );
}
