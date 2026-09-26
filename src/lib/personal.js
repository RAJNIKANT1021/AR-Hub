/**
 * personal.js — per-user cloud data for Hub modules.
 *   users/{uid}/notes/{id}   { title, body, color, pinned, updatedAt }
 *   users/{uid}/tasks/{id}   { text, done, priority, due, createdAt }
 */
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../userauth/FireAuth";

const EST = { serverTimestamps: "estimate" };
const col = (uid, name) => collection(db, "users", uid, name);

export function subscribeCol(uid, name, cb) {
  if (!uid) return () => {};
  const q = query(col(uid, name), orderBy(name === "notes" ? "updatedAt" : "createdAt", "desc"));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data(EST) }))), () => cb([]));
}

export const addNote = (uid, note) => addDoc(col(uid, "notes"), { title: "", body: "", color: "default", pinned: false, ...note, updatedAt: serverTimestamp() });
export const updateNote = (uid, id, patch) => updateDoc(doc(db, "users", uid, "notes", id), { ...patch, updatedAt: serverTimestamp() });
export const deleteNote = (uid, id) => deleteDoc(doc(db, "users", uid, "notes", id));

export const addTask = (uid, task) => addDoc(col(uid, "tasks"), { done: false, priority: "normal", due: null, ...task, createdAt: serverTimestamp() });
export const updateTask = (uid, id, patch) => updateDoc(doc(db, "users", uid, "tasks", id), patch);
export const deleteTask = (uid, id) => deleteDoc(doc(db, "users", uid, "tasks", id));
