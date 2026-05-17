import React, { useEffect, useRef, useState, useCallback } from "react";
import "./callscreen1.css";
import {
  IoMicOutline,
  IoMicOffOutline,
  IoVideocamOutline,
  IoVideocamOffOutline,
  IoCallOutline,
  IoChatbubbleOutline,
  IoSendOutline,
  IoChevronDownOutline,
} from "react-icons/io5";
import { MdScreenShare, MdStopScreenShare, MdVolumeUp } from "react-icons/md";
import { startScreenShare, stopScreenShare } from "../../lib/webrtc";

// ── Duration timer ─────────────────────────────────────────────
function useDuration(running) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) {
      setSecs(0);
      return;
    }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ── Device picker dropdown ─────────────────────────────────────
function DevicePicker({ devices, selectedId, onSelect, onClose }) {
  return (
    <div className="call-device-picker" onClick={(e) => e.stopPropagation()}>
      {devices.length === 0 && (
        <div className="call-device-item" style={{ opacity: 0.55 }}>
          No devices found
        </div>
      )}
      {devices.map((d) => (
        <div
          key={d.deviceId}
          className={`call-device-item ${d.deviceId === selectedId ? "selected" : ""}`}
          onClick={() => {
            onSelect(d.deviceId);
            onClose();
          }}
        >
          {d.deviceId === selectedId && (
            <span style={{ marginRight: 6 }}>✓</span>
          )}
          {d.label || `Device ${d.deviceId.slice(0, 8)}`}
        </div>
      ))}
    </div>
  );
}

// ── Incoming call card ─────────────────────────────────────────
export function IncomingCallCard({ call, onAccept, onDecline }) {
  const initials = (call.callerName || "?").slice(0, 2).toUpperCase();
  const isVideo = call.callType === "video";

  return (
    <div className="call-incoming-overlay">
      <div className="call-incoming-card">
        <div className="call-incoming-type">
          {isVideo ? "📹 Incoming video call" : "📞 Incoming voice call"}
        </div>
        {call.callerAvatar ? (
          <img
            className="call-incoming-avatar"
            src={call.callerAvatar}
            alt={call.callerName}
          />
        ) : (
          <div className="call-incoming-avatar-ph">{initials}</div>
        )}
        <div className="call-incoming-name">{call.callerName || "Unknown"}</div>
        <div className="call-incoming-label">is calling you…</div>
        <div className="call-incoming-actions">
          <div style={{ textAlign: "center" }}>
            <button className="call-decline-btn" onClick={onDecline}>
              <IoCallOutline style={{ transform: "rotate(135deg)" }} />
            </button>
            <div className="call-btn-label">Decline</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <button className="call-accept-btn" onClick={onAccept}>
              <IoCallOutline />
            </button>
            <div className="call-btn-label">Accept</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Active call screen ─────────────────────────────────────────
export function CallScreen({
  partner,
  localStream,
  remoteStream,
  pc,
  dataChannel,
  callType,
  isConnected,
  onHangup,
  cid,
  uid,
  myName,
}) {
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(callType === "video");
  const [sharing, setSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Device state
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [videoInputs, setVideoInputs] = useState([]);
  const [selAudioIn, setSelAudioIn] = useState("");
  const [selAudioOut, setSelAudioOut] = useState("");
  const [selVideoIn, setSelVideoIn] = useState("");
  const [deviceMenu, setDeviceMenu] = useState(null);

  const screenTrackRef = useRef(null);
  const chatEndRef = useRef(null);
  const dataChannelRef = useRef(null);
  const duration = useDuration(isConnected);
  const initials = (partner?.name || "?").slice(0, 2).toUpperCase();

  // ── Enumerate devices ────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devs) => {
        setAudioInputs(devs.filter((d) => d.kind === "audioinput"));
        setAudioOutputs(devs.filter((d) => d.kind === "audiooutput"));
        setVideoInputs(devs.filter((d) => d.kind === "videoinput"));
        const mic = devs.find((d) => d.kind === "audioinput");
        const spk = devs.find((d) => d.kind === "audiooutput");
        const cam = devs.find((d) => d.kind === "videoinput");
        if (mic) setSelAudioIn(mic.deviceId);
        if (spk) setSelAudioOut(spk.deviceId);
        if (cam) setSelVideoIn(cam.deviceId);
      })
      .catch(() => {});
  }, []);

  // ── FIX 1: ref callback so stream attaches whenever el or stream is ready ──
  const setRemoteVideoRef = useCallback(
    (el) => {
      remoteVideoRef.current = el;
      if (el && remoteStream) {
        el.srcObject = remoteStream;
      }
    },
    [remoteStream],
  );

  // Also update if remoteStream changes after mount
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ── Apply speaker selection ──────────────────────────────────
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el || !selAudioOut) return;
    if (typeof el.setSinkId === "function") {
      el.setSinkId(selAudioOut).catch(() => {});
    }
  }, [selAudioOut]);

  // ── Switch microphone ────────────────────────────────────────
  const switchMic = useCallback(
    async (deviceId) => {
      setSelAudioIn(deviceId);
      if (!pc || !localStream) return;
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
          video: false,
        });
        const newTrack = newStream.getAudioTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
        if (sender) await sender.replaceTrack(newTrack);
        localStream.getAudioTracks().forEach((t) => t.stop());
      } catch {}
    },
    [pc, localStream],
  );

  // ── Switch camera ────────────────────────────────────────────
  const switchCamera = useCallback(
    async (deviceId) => {
      setSelVideoIn(deviceId);
      if (!pc || !localStream || callType !== "video") return;
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false,
        });
        const newTrack = newStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(newTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
        localStream.getVideoTracks().forEach((t) => t.stop());
      } catch {}
    },
    [pc, localStream, callType],
  );

  // ── Toggle mic ───────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicOn((v) => !v);
  }, [localStream]);

  // ── Toggle camera ────────────────────────────────────────────
  // FIX: re-attach stream to video element after toggle
  const toggleCam = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamOn((v) => {
      // re-attach after state flips
      setTimeout(() => {
        if (localVideoRef.current)
          localVideoRef.current.srcObject = localStream;
      }, 0);
      return !v;
    });
  }, [localStream]);

  // ── Screen share ─────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (!pc) return;
    try {
      if (sharing) {
        await stopScreenShare(pc, localStream);
        screenTrackRef.current?.stop();
        screenTrackRef.current = null;
        setSharing(false);
      } else {
        const track = await startScreenShare(pc, localStream);
        screenTrackRef.current = track;
        track.onended = () => {
          stopScreenShare(pc, localStream);
          screenTrackRef.current = null;
          setSharing(false);
        };
        setSharing(true);
      }
    } catch {}
  }, [sharing, pc, localStream]);

  // ── Data channel: wired by CallManager, just attach handler ──
  useEffect(() => {
    if (!dataChannel) return;
    dataChannelRef.current = dataChannel;
    dataChannel.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        setChatMsgs((prev) => [...prev, msg]);
      } catch {}
    };
  }, [dataChannel]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, showChat]);

  const sendChatMsg = () => {
    const text = chatInput.trim();
    if (!text || !dataChannelRef.current) return;
    if (dataChannelRef.current.readyState !== "open") return;
    const msg = { text, from: myName || "You", mine: true, ts: Date.now() };
    dataChannelRef.current.send(
      JSON.stringify({ text, from: myName || "You", mine: false }),
    );
    setChatMsgs((prev) => [...prev, msg]);
    setChatInput("");
  };

  // ── FIX 4: Clean up screen share on hangup ───────────────────
  const handleHangup = useCallback(() => {
    screenTrackRef.current?.stop();
    screenTrackRef.current = null;
    onHangup();
  }, [onHangup]);

  // Close device menu on outside click
  useEffect(() => {
    if (!deviceMenu) return;
    const h = () => setDeviceMenu(null);
    setTimeout(() => document.addEventListener("click", h), 0);
    return () => document.removeEventListener("click", h);
  }, [deviceMenu]);

  const hasVideo = callType === "video";

  return (
    <div className="call-overlay" onClick={() => setDeviceMenu(null)}>
      {/* FIX 1: Always render video, toggle visibility so ref is always mounted */}
      <video
        ref={setRemoteVideoRef}
        className="call-remote-video"
        autoPlay
        playsInline
        style={{ display: hasVideo && isConnected ? "block" : "none" }}
      />

      {/* Avatar shown when no video or not yet connected */}
      {(!hasVideo || !isConnected) && (
        <div className="call-avatar-bg">
          {partner?.avatar ? (
            <img
              className="call-avatar-circle"
              src={partner.avatar}
              alt={partner.name}
            />
          ) : (
            <div className="call-avatar-ph">{initials}</div>
          )}
          <div className="call-partner-name">{partner?.name}</div>
          <div className="call-status-text">
            {isConnected
              ? callType === "audio"
                ? "Voice call"
                : "Connecting video…"
              : "Calling…"}
          </div>
        </div>
      )}

      {/* Duration */}
      {isConnected && <div className="call-duration">{duration}</div>}

      {/* Screen share banner */}
      {sharing && (
        <div className="call-screen-share-banner">🖥️ Sharing your screen</div>
      )}

      {/* Local PiP */}
      {callType === "video" && (
        <div className="call-local-pip">
          {camOn ? (
            <video ref={localVideoRef} autoPlay playsInline muted />
          ) : (
            <div className="call-pip-off">Cam off</div>
          )}
        </div>
      )}

      {/* In-call chat panel */}
      {showChat && (
        <div className="call-chat-panel" onClick={(e) => e.stopPropagation()}>
          <div className="call-chat-header">
            <span>In-call chat</span>
            <button
              className="call-chat-close"
              onClick={() => setShowChat(false)}
            >
              ✕
            </button>
          </div>
          <div className="call-chat-messages">
            {chatMsgs.length === 0 && (
              <div className="call-chat-empty">
                Messages are only visible during this call
              </div>
            )}
            {chatMsgs.map((m, i) => (
              <div
                key={i}
                className={`call-chat-bubble ${m.mine ? "mine" : "theirs"}`}
              >
                {!m.mine && <div className="call-chat-from">{m.from}</div>}
                <div className="call-chat-text">{m.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="call-chat-input-row">
            <input
              className="call-chat-input"
              placeholder="Send a message…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChatMsg();
              }}
              autoFocus
            />
            <button className="call-chat-send" onClick={sendChatMsg}>
              <IoSendOutline />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="call-controls" onClick={(e) => e.stopPropagation()}>
        {/* Mic */}
        <div className="call-ctrl-group">
          <button
            className={`call-ctrl-btn ${micOn ? "" : "off"}`}
            onClick={toggleMic}
            title={micOn ? "Mute mic" : "Unmute mic"}
          >
            {micOn ? <IoMicOutline /> : <IoMicOffOutline />}
            {/* FIX: was "Unmuted" before */}
            <span className="call-ctrl-label">{micOn ? "Mute" : "Unmute"}</span>
          </button>
          <button
            className="call-ctrl-chevron"
            onClick={(e) => {
              e.stopPropagation();
              setDeviceMenu((v) => (v === "mic" ? null : "mic"));
            }}
          >
            <IoChevronDownOutline />
          </button>
          {deviceMenu === "mic" && (
            <DevicePicker
              devices={audioInputs}
              selectedId={selAudioIn}
              onSelect={switchMic}
              onClose={() => setDeviceMenu(null)}
            />
          )}
        </div>

        {/* Speaker */}
        <div className="call-ctrl-group">
          <button className="call-ctrl-btn" title="Speaker">
            <MdVolumeUp />
            <span className="call-ctrl-label">Speaker</span>
          </button>
          <button
            className="call-ctrl-chevron"
            onClick={(e) => {
              e.stopPropagation();
              setDeviceMenu((v) => (v === "speaker" ? null : "speaker"));
            }}
          >
            <IoChevronDownOutline />
          </button>
          {deviceMenu === "speaker" && (
            <DevicePicker
              devices={audioOutputs}
              selectedId={selAudioOut}
              onSelect={(id) => setSelAudioOut(id)}
              onClose={() => setDeviceMenu(null)}
            />
          )}
        </div>

        {/* Camera */}
        {callType === "video" && (
          <div className="call-ctrl-group">
            <button
              className={`call-ctrl-btn ${camOn ? "" : "off"}`}
              onClick={toggleCam}
              title={camOn ? "Turn off camera" : "Turn on camera"}
            >
              {camOn ? <IoVideocamOutline /> : <IoVideocamOffOutline />}
              <span className="call-ctrl-label">
                {camOn ? "Camera" : "Cam off"}
              </span>
            </button>
            <button
              className="call-ctrl-chevron"
              onClick={(e) => {
                e.stopPropagation();
                setDeviceMenu((v) => (v === "cam" ? null : "cam"));
              }}
            >
              <IoChevronDownOutline />
            </button>
            {deviceMenu === "cam" && (
              <DevicePicker
                devices={videoInputs}
                selectedId={selVideoIn}
                onSelect={switchCamera}
                onClose={() => setDeviceMenu(null)}
              />
            )}
          </div>
        )}

        {/* Screen share */}
        {callType === "video" && (
          <div style={{ textAlign: "center" }}>
            <button
              className={`call-ctrl-btn ${sharing ? "active" : ""}`}
              onClick={toggleScreenShare}
              title={sharing ? "Stop sharing" : "Share screen"}
            >
              {sharing ? <MdStopScreenShare /> : <MdScreenShare />}
              <span className="call-ctrl-label">
                {sharing ? "Stop share" : "Share"}
              </span>
            </button>
          </div>
        )}

        {/* Chat */}
        <div style={{ textAlign: "center" }}>
          <button
            className={`call-ctrl-btn ${showChat ? "active" : ""}`}
            onClick={() => setShowChat((v) => !v)}
            title="In-call chat"
          >
            <IoChatbubbleOutline />
            <span className="call-ctrl-label">Chat</span>
          </button>
        </div>

        {/* FIX 4: use handleHangup not onHangup directly */}
        <div style={{ textAlign: "center" }}>
          <button
            className="call-ctrl-btn danger"
            onClick={handleHangup}
            title="End call"
          >
            <IoCallOutline style={{ transform: "rotate(135deg)" }} />
            <span className="call-ctrl-label">End</span>
          </button>
        </div>
      </div>
    </div>
  );
}
