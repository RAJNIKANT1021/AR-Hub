import React, { useEffect, useMemo, useState } from "react";
import { IoAdd, IoTrashOutline, IoCheckmark, IoFlag, IoCalendarOutline } from "react-icons/io5";
import { useApp, toastError } from "../../../Context/ChatContext";
import { subscribeCol, addTask, updateTask, deleteTask } from "../../../lib/personal";
import Empty from "../../common/Empty";
import { sounds } from "../../../lib/notify";

const PRIORITY = { high: { label: "High", color: "#ef4444" }, normal: { label: "Normal", color: "#f59e0b" }, low: { label: "Low", color: "#10b981" } };

const dueLabel = (due) => {
  if (!due) return null;
  const d = new Date(due + "T23:59:59");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(due + "T00:00:00") - today) / 86400000);
  if (diff < 0) return { text: `Overdue · ${d.toLocaleDateString([], { day: "numeric", month: "short" })}`, late: true };
  if (diff === 0) return { text: "Today" };
  if (diff === 1) return { text: "Tomorrow" };
  return { text: d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) };
};

export default function Tasks() {
  const { uid } = useApp();
  const [tasks, setTasks] = useState(null);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("normal");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("active");

  useEffect(() => subscribeCol(uid, "tasks", setTasks), [uid]);

  const add = async (e) => {
    e?.preventDefault();
    if (!text.trim()) return;
    const t = text.trim();
    setText(""); setDue("");
    try { await addTask(uid, { text: t, priority, due: due || null }); } catch (err) { toastError(err); }
  };

  const list = useMemo(() => {
    const order = { high: 0, normal: 1, low: 2 };
    return (tasks || [])
      .filter(t => filter === "all" || (filter === "active" ? !t.done : t.done))
      .sort((a, b) => (a.done - b.done) || (order[a.priority] - order[b.priority]) || ((a.due || "9") > (b.due || "9") ? 1 : -1));
  }, [tasks, filter]);

  const doneCount = (tasks || []).filter(t => t.done).length;
  const total = (tasks || []).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="tasks">
      <div className="tasks-progress card">
        <div className="ring" style={{ "--p": pct }}><span>{pct}%</span></div>
        <div><strong>{doneCount} of {total} done</strong><p className="muted-text">{total - doneCount ? `${total - doneCount} task${total - doneCount === 1 ? "" : "s"} to go — you've got this 💪` : total ? "All clear! 🎉" : "Add your first task below."}</p></div>
      </div>

      <form className="task-add card" onSubmit={add}>
        <input className="input" value={text} onChange={e => setText(e.target.value)} placeholder="Add a task…" maxLength={200} />
        <div className="task-add-row">
          <div className="seg small">
            {Object.entries(PRIORITY).map(([k, v]) => <button type="button" key={k} className={priority === k ? "on" : ""} onClick={() => setPriority(k)}><IoFlag style={{ color: v.color }} /> {v.label}</button>)}
          </div>
          <label className="date-pick"><IoCalendarOutline /><input type="date" value={due} onChange={e => setDue(e.target.value)} /></label>
          <button className="btn btn-primary" type="submit" disabled={!text.trim()}><IoAdd /> Add</button>
        </div>
      </form>

      <div className="chips" style={{ margin: "12px 0" }}>
        {[["active", "Active"], ["done", "Completed"], ["all", "All"]].map(([k, l]) => <button key={k} className={`chip ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{l}</button>)}
      </div>

      {tasks && list.length === 0 && <Empty icon={filter === "done" ? "🏁" : "✅"} title={filter === "done" ? "Nothing completed yet" : "No tasks"} body={filter === "active" ? "Enjoy the free time, or plan something new." : ""} />}
      <div className="task-list">
        {list.map(t => {
          const d = dueLabel(t.due);
          return (
            <div key={t.id} className={`task ${t.done ? "done" : ""}`}>
              <button className={`task-check ${t.done ? "on" : ""}`} style={{ borderColor: PRIORITY[t.priority]?.color }} onClick={() => { if (!t.done) sounds.tap(); updateTask(uid, t.id, { done: !t.done }).catch(toastError); }} aria-label="Toggle done">{t.done && <IoCheckmark />}</button>
              <div className="task-main">
                <span className="task-text">{t.text}</span>
                {d && <span className={`task-due ${d.late && !t.done ? "late" : ""}`}><IoCalendarOutline /> {d.text}</span>}
              </div>
              <button className="icon-btn sm" onClick={() => deleteTask(uid, t.id).catch(toastError)} aria-label="Delete"><IoTrashOutline /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
