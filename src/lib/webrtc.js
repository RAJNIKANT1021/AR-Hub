/**
 * webrtc.js — 1-on-1 WebRTC calls with Firestore signaling.
 *
 * Signaling schema:
 *   calls/{callId}
 *     type: "offer" | "answer" | "ended"
 *     callType: "audio" | "video"
 *     callerId: uid
 *     calleeId: uid
 *     callerName: string
 *     offer: RTCSessionDescriptionInit   (set by caller)
 *     answer: RTCSessionDescriptionInit  (set by callee)
 *     createdAt: Timestamp
 *
 *   calls/{callId}/callerCandidates/{id}   ICE candidates from caller
 *   calls/{callId}/calleeCandidates/{id}   ICE candidates from callee
 */

import {
  doc,
  collection,
  setDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../userauth/FireAuth";

const STUN = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "8cbd9f8daf548ed61217abc1",
      credential: "UY4n7IAqUs659IBq",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "8cbd9f8daf548ed61217abc1",
      credential: "UY4n7IAqUs659IBq",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "8cbd9f8daf548ed61217abc1",
      credential: "UY4n7IAqUs659IBq",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "8cbd9f8daf548ed61217abc1",
      credential: "UY4n7IAqUs659IBq",
    },
  ],
};

export const callId = (uid1, uid2) => [uid1, uid2].sort().join("__call__");

const callRef = (cid) => doc(db, "calls", cid);
const callerRef = (cid) => collection(db, "calls", cid, "callerCandidates");
const calleeRef = (cid) => collection(db, "calls", cid, "calleeCandidates");

// ── Hang-up: delete the call doc + candidate subcollections ───
export async function endCallDoc(cid) {
  try {
    const [callerSnap, calleeSnap] = await Promise.all([
      getDocs(callerRef(cid)),
      getDocs(calleeRef(cid)),
    ]);
    const deletes = [
      ...callerSnap.docs.map((d) => deleteDoc(d.ref)),
      ...calleeSnap.docs.map((d) => deleteDoc(d.ref)),
    ];
    await Promise.all(deletes);
    await deleteDoc(callRef(cid));
  } catch {}
}

// ── Start a call (caller side) ─────────────────────────────────
// Returns { pc, cid, localStream, cleanup }
export async function startCall({
  myUid,
  myName,
  theirUid,
  callType = "video",
  onRemoteStream,
  onHangup,
}) {
  const cid = callId(myUid, theirUid);

  // Get local media
  const constraints =
    callType === "audio"
      ? { audio: true, video: false }
      : { audio: true, video: { width: 1280, height: 720 } };

  const localStream = await navigator.mediaDevices.getUserMedia(constraints);

  const pc = new RTCPeerConnection(STUN);

  // Add tracks
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  // Create data channel BEFORE offer so it's negotiated in the SDP
  const dataChannel = pc.createDataChannel("chat", { ordered: true });

  // Accumulate remote tracks; pass a *new* MediaStream reference each time so
  // React sees a state change (same-ref setState gets bailed out, which would
  // leave a newly-added video track invisible if audio arrived first).
  const remoteTracks = [];
  pc.ontrack = (e) => {
    e.track.onunmute = () => {};
    if (!remoteTracks.includes(e.track)) remoteTracks.push(e.track);
    onRemoteStream?.(new MediaStream(remoteTracks));
  };

  // CRITICAL: onicecandidate must be wired BEFORE setLocalDescription, since
  // ICE gathering starts the instant the local description is applied. If we
  // register the handler later, the first reflexive/relay candidates fire into
  // the void and the call never establishes through NAT (audio AND video die).
  pc.onicecandidate = async (e) => {
    if (e.candidate) {
      try { await addDoc(callerRef(cid), e.candidate.toJSON()); } catch {}
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await setDoc(callRef(cid), {
    type: "offer",
    callType,
    callerId: myUid,
    calleeId: theirUid,
    callerName: myName,
    offer: { sdp: offer.sdp, type: offer.type },
    answer: null,
    createdAt: serverTimestamp(),
  });

  // Buffer ICE candidates until remoteDescription is applied — otherwise
  // addIceCandidate throws and we silently lose connectivity hints.
  const pendingCandidates = [];
  const flushCandidates = () => {
    while (pendingCandidates.length) {
      pc.addIceCandidate(pendingCandidates.shift()).catch(() => {});
    }
  };

  const unsubCall = onSnapshot(callRef(cid), async (snap) => {
    const data = snap.data();
    if (!data) { onHangup?.(); return; }
    if (data.type === "ended") { onHangup?.(); return; }
    if (data.answer && !pc.remoteDescription) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      flushCandidates();
    }
  });

  const unsubCallee = onSnapshot(calleeRef(cid), (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type !== "added") return;
      const c = new RTCIceCandidate(change.doc.data());
      if (pc.remoteDescription) pc.addIceCandidate(c).catch(() => {});
      else pendingCandidates.push(c);
    });
  });

  const cleanup = () => {
    unsubCall();
    unsubCallee();
    localStream.getTracks().forEach((t) => t.stop());
    pc.close();
  };

  return { pc, cid, localStream, cleanup, dataChannel };
}

// ── Answer a call (callee side) ────────────────────────────────
// Returns { pc, cid, localStream, cleanup }
export async function answerCall({
  cid,
  myUid,
  callType,
  onRemoteStream,
  onHangup,
}) {
  const constraints =
    callType === "audio"
      ? { audio: true, video: false }
      : { audio: true, video: { width: 1280, height: 720 } };

  const localStream = await navigator.mediaDevices.getUserMedia(constraints);

  const pc = new RTCPeerConnection(STUN);

  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  // Receive the data channel the caller already negotiated
  let resolveDataChannel;
  const dataChannelPromise = new Promise(r => { resolveDataChannel = r; });
  pc.ondatachannel = (e) => resolveDataChannel(e.channel);

  // Accumulate remote tracks; pass a *new* MediaStream reference each time so
  // React's setRemoteStream actually re-renders and re-attaches srcObject.
  const remoteTracks = [];
  pc.ontrack = (e) => {
    e.track.onunmute = () => {};
    if (!remoteTracks.includes(e.track)) remoteTracks.push(e.track);
    onRemoteStream?.(new MediaStream(remoteTracks));
  };

  // Get offer from Firestore
  const snap = await new Promise((resolve) => {
    const unsub = onSnapshot(callRef(cid), (s) => {
      resolve(s);
      unsub();
    });
  });
  const data = snap.data();
  if (!data?.offer) throw new Error("No offer found");

  // Wire onicecandidate BEFORE applying offer / creating answer — same reason
  // as caller side: ICE gathering starts the moment setLocalDescription runs.
  pc.onicecandidate = async (e) => {
    if (e.candidate) {
      try { await addDoc(calleeRef(cid), e.candidate.toJSON()); } catch {}
    }
  };

  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await updateDoc(callRef(cid), {
    answer: { sdp: answer.sdp, type: answer.type },
    type: "answer",
  });

  // Listen for caller ICE candidates
  const unsubCaller = onSnapshot(callerRef(cid), (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "added") {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(
          () => {},
        );
      }
    });
  });

  // Listen for hang-up
  const unsubCall = onSnapshot(callRef(cid), (snap) => {
    const d = snap.data();
    if (!d || d.type === "ended") {
      onHangup?.();
    }
  });

  const cleanup = () => {
    unsubCaller();
    unsubCall();
    localStream.getTracks().forEach((t) => t.stop());
    pc.close();
  };

  return { pc, cid, localStream, cleanup, dataChannel: dataChannelPromise };
}

// ── Screen share: swap video track on existing PC ─────────────
export async function startScreenShare(pc, localStream) {
  if (!pc) throw new Error("No peer connection");

  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { cursor: "always" },
    audio: false, // system audio capture is browser/OS-dependent; skip to avoid errors
  });

  const screenTrack = screenStream.getVideoTracks()[0];
  if (!screenTrack) throw new Error("No video track from display media");

  const sender = pc.getSenders().find((s) => s.track?.kind === "video");
  if (sender) {
    await sender.replaceTrack(screenTrack);
  } else {
    // Audio-only call — add screen track as new track
    pc.addTrack(screenTrack, screenStream);
  }

  return screenTrack;
}

export async function stopScreenShare(pc, localStream) {
  if (!pc || !localStream) return;
  const camTrack = localStream.getVideoTracks()[0];
  if (!camTrack) return;
  const sender = pc.getSenders().find((s) => s.track?.kind === "video");
  if (sender) await sender.replaceTrack(camTrack);
}

// ── Call logs ─────────────────────────────────────────────────
// Schema: callLogs/{uid}/items/{logId}
//   { cid, partnerId, partnerName, partnerAvatar, callType, direction, duration, status, createdAt }

const logRef = (uid) => collection(db, "callLogs", uid, "items");

export async function writeCallLog(
  uid,
  {
    cid,
    partnerId,
    partnerName,
    partnerAvatar = null,
    callType,
    direction,
    duration = 0,
    status = "completed",
  },
) {
  await addDoc(logRef(uid), {
    cid,
    partnerId,
    partnerName,
    partnerAvatar,
    callType,
    direction,
    duration,
    status,
    createdAt: serverTimestamp(),
  });
}

export function subscribeCallLogs(uid, cb) {
  if (!uid) return () => {};
  return onSnapshot(
    query(logRef(uid), orderBy("createdAt", "desc"), limit(50)),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  );
}

// ── Subscribe to incoming calls for a user ────────────────────
// cb receives call doc data (or null when no active call)
export function subscribeIncomingCall(myUid, cb) {
  if (!myUid) return () => {};
  const q = query(
    collection(db, "calls"),
    where("calleeId", "==", myUid),
    where("type", "==", "offer"),
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      cb(null);
      return;
    }
    const callDoc = snap.docs[0];
    cb({ id: callDoc.id, ...callDoc.data() });
  });
}
