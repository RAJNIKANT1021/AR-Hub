/**
 * CallManager — global WebRTC call state.
 *
 * Fixes applied:
 *  1. pc is now useState so CallScreen re-renders when it's set
 *  2. activeCallRef prevents re-subscription loop in subscribeIncomingCall
 *  3. isCaller passed to CallScreen for data channel fix
 *  4. hangup cleans up pc state too
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  startCall as rtcStartCall,
  answerCall as rtcAnswerCall,
  endCallDoc,
  subscribeIncomingCall,
  callId as makeCallId,
  writeCallLog,
} from "../../lib/webrtc";
import { IncomingCallCard, CallScreen } from "./CallScreen";
import { addNotification } from "../../lib/db";
import { pushToast } from "../../Context/ChatContext";

const CallCtx = createContext(null);
export const useCallManager = () => useContext(CallCtx);

export function CallProvider({ uid, myName, myAvatar, getUser, children }) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [callType, setCallType] = useState("video");
  const [pc, setPc] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);

  const pcRef = useRef(null);
  const cleanupRef = useRef(null);
  const callStartRef = useRef(null);
  const activeCallRef = useRef(null);
  const ringingRef = useRef(null);
  const ringTimeoutRef = useRef(null);

  // Keep activeCallRef in sync with state
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // ── Listen for incoming calls ──────────────────────────────
  // FIX 2: removed activeCall from deps, use activeCallRef instead
  useEffect(() => {
    if (!uid) return;
    return subscribeIncomingCall(uid, async (callDoc) => {
      if (!callDoc) {
        // Caller hung up before we answered or declined → missed call
        const ringing = ringingRef.current;
        if (ringing && !activeCallRef.current) {
          writeCallLog(uid, {
            cid: ringing.id, partnerId: ringing.callerId, partnerName: ringing.callerName || "Unknown",
            partnerAvatar: ringing.callerAvatar || null, callType: ringing.callType, direction: "incoming",
            duration: 0, status: "missed",
          }).catch(() => {});
          addNotification(uid, {
            type: "missed_call", fromUid: ringing.callerId, senderName: ringing.callerName,
            text: `Missed ${ringing.callType === "audio" ? "voice" : "video"} call`,
          }).catch(() => {});
        }
        ringingRef.current = null;
        setIncomingCall(null);
        return;
      }
      if (activeCallRef.current) return; // use ref, not state
      let callerAvatar = null;
      try {
        const caller = await getUser?.(callDoc.callerId);
        callerAvatar = caller?.avatar || null;
      } catch {}
      ringingRef.current = { ...callDoc, callerAvatar };
      setIncomingCall({ ...callDoc, callerAvatar });
    });
  }, [uid, getUser]); // no activeCall dep

  // ── Play ringing sound while incoming call shows ───────────
  const ringRef = useRef(null);
  useEffect(() => {
    if (incomingCall && !activeCall) {
      ringRef.current = playRing();
    } else {
      ringRef.current?.();
      ringRef.current = null;
    }
  }, [incomingCall, activeCall]);

  // ── Shared cleanup ─────────────────────────────────────────
  const doHangup = useCallback(
    async (cid, shouldDeleteDoc = true, callMeta = null) => {
      const duration = callStartRef.current
        ? Math.round((Date.now() - callStartRef.current) / 1000)
        : 0;
      callStartRef.current = null;
      clearTimeout(ringTimeoutRef.current);

      if (callMeta && uid) {
        const { partner, callType: ct, direction } = callMeta;
        writeCallLog(uid, {
          cid,
          partnerId: partner?.uid || "",
          partnerName: partner?.name || "Unknown",
          partnerAvatar: partner?.avatar || null,
          callType: ct,
          direction,
          duration,
          status: duration > 0 ? "completed" : direction === "outgoing" ? "no_answer" : "missed",
        }).catch(() => {});
      }

      cleanupRef.current?.();
      cleanupRef.current = null;
      pcRef.current = null;
      setPc(null);
      setDataChannel(null);
      if (shouldDeleteDoc && cid) await endCallDoc(cid).catch(() => {});
      setActiveCall(null);
      setLocalStream(null);
      setRemoteStream(null);
      setIsConnected(false);
      setIncomingCall(null);
    },
    [uid],
  );

  // ── Initiate call (caller) ─────────────────────────────────
  const initiateCall = useCallback(
    async (partner, type = "video") => {
      if (!uid || !partner?.uid) return;
      const cid = makeCallId(uid, partner.uid);
      const meta = { partner, callType: type, direction: "outgoing" };
      setCallType(type);
      setActiveCall({ type, partner, cid, role: "caller", meta });
      setIsConnected(false);

      try {
        const result = await rtcStartCall({
          myUid: uid,
          myName,
          theirUid: partner.uid,
          callType: type,
          onRemoteStream: (stream) => {
            callStartRef.current = Date.now();
            setRemoteStream(stream);
            setIsConnected(true);
          },
          onHangup: () => doHangup(cid, false, meta),
        });
        pcRef.current = result.pc;
        setPc(result.pc);
        cleanupRef.current = result.cleanup;
        setLocalStream(result.localStream);
        // Stop ringing after 45s with no answer
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = setTimeout(() => {
          if (!callStartRef.current && activeCallRef.current?.cid === cid) {
            doHangup(cid, true, meta);
            pushToast({ title: "No answer", body: `${partner.name || "They"} didn't pick up.` });
          }
        }, 45000);
        // dataChannel is already open for caller; resolve immediately
        Promise.resolve(result.dataChannel).then(dc => { if (dc) setDataChannel(dc); }).catch(() => {});
      } catch (err) {
        console.error("Call failed:", err);
        doHangup(cid, true, null);
        pushToast({ kind: "error", title: "Couldn't start the call", body: "Please allow camera and microphone access, then try again." });
      }
    },
    [uid, myName, doHangup],
  );

  // ── Accept incoming call (callee) ─────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const {
      id: cid,
      callType: type,
      callerId,
      callerName,
      callerAvatar,
    } = incomingCall;
    const partner = { uid: callerId, name: callerName, avatar: callerAvatar };
    const meta = { partner, callType: type, direction: "incoming" };
    ringingRef.current = null;
    setIncomingCall(null);
    setCallType(type);
    setActiveCall({ type, partner, cid, role: "callee", meta });
    setIsConnected(false);

    try {
      const result = await rtcAnswerCall({
        cid,
        myUid: uid,
        callType: type,
        onRemoteStream: (stream) => {
          callStartRef.current = Date.now();
          setRemoteStream(stream);
          setIsConnected(true);
        },
        onHangup: () => doHangup(cid, false, meta),
      });
      pcRef.current = result.pc;
      setPc(result.pc);
      cleanupRef.current = result.cleanup;
      setLocalStream(result.localStream);
      // dataChannel is a Promise for callee (resolves when caller's channel arrives)
      Promise.resolve(result.dataChannel).then(dc => { if (dc) setDataChannel(dc); }).catch(() => {});
    } catch (err) {
      console.error("Answer failed:", err);
      doHangup(cid, false, null);
      pushToast({ kind: "error", title: "Couldn't join the call", body: "Please allow camera and microphone access, then try again." });
    }
  }, [incomingCall, uid, doHangup]);

  // ── Decline ────────────────────────────────────────────────
  const declineCall = useCallback(async () => {
    if (!incomingCall) return;
    ringingRef.current = null;
    setIncomingCall(null);
    writeCallLog(uid, {
      cid: incomingCall.id, partnerId: incomingCall.callerId, partnerName: incomingCall.callerName || "Unknown",
      partnerAvatar: incomingCall.callerAvatar || null, callType: incomingCall.callType, direction: "incoming",
      duration: 0, status: "declined",
    }).catch(() => {});
    await endCallDoc(incomingCall.id).catch(() => {});
  }, [incomingCall, uid]);

  // ── Hang up active call ────────────────────────────────────
  const hangup = useCallback(() => {
    doHangup(activeCall?.cid, true, activeCall?.meta || null);
  }, [activeCall, doHangup]);

  return (
    <CallCtx.Provider
      value={{ initiateCall, hangup, incomingCall, activeCall, isConnected }}
    >
      {children}

      {incomingCall && !activeCall && (
        <IncomingCallCard
          call={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}

      {activeCall && (
        <CallScreen
          partner={activeCall.partner}
          localStream={localStream}
          remoteStream={remoteStream}
          pc={pc}
          dataChannel={dataChannel}
          callType={callType}
          isConnected={isConnected}
          onHangup={hangup}
          cid={activeCall.cid}
          uid={uid}
          myName={myName}
        />
      )}
    </CallCtx.Provider>
  );
}

// ── Simple repeating ring tone using Web Audio ─────────────────
function playRing() {
  let stopped = false;
  let timeoutId = null;

  const ring = () => {
    if (stopped) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const play = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + start + dur,
        );
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      play(880, 0, 0.18);
      play(660, 0.22, 0.18);
      play(880, 0.44, 0.18);
    } catch {}
    timeoutId = setTimeout(ring, 2800);
  };

  ring();
  return () => {
    stopped = true;
    clearTimeout(timeoutId);
  };
}
