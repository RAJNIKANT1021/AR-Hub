// Hub module registry (metadata only — components are lazy-loaded by HubPage).
export const HUB_MODULES = [
  { key: "games",      label: "Games Arcade",   emoji: "🎮", color: "#7c5cff", desc: "11 real-time multiplayer games with friends" },
  { key: "weather",    label: "Weather",        emoji: "🌤️", color: "#0ea5e9", desc: "Live conditions & 5-day forecast" },
  { key: "news",       label: "News",           emoji: "📰", color: "#f59e0b", desc: "Top headlines by topic & country" },
  { key: "notes",      label: "Notes",          emoji: "📝", color: "#10b981", desc: "Cloud-synced notes, pin & colour" },
  { key: "tasks",      label: "Tasks",          emoji: "✅", color: "#22c55e", desc: "To-dos with priorities & due dates" },
  { key: "focus",      label: "Focus Timer",    emoji: "⏱️", color: "#ef4444", desc: "Pomodoro sessions with stats" },
  { key: "whiteboard", label: "Whiteboard",     emoji: "🎨", color: "#ec4899", desc: "Sketch & send drawings to chats" },
  { key: "calculator", label: "Calculator",     emoji: "🧮", color: "#6366f1", desc: "Calculator with history" },
  { key: "converter",  label: "Unit Converter", emoji: "📐", color: "#14b8a6", desc: "Length, weight, temperature & more" },
  { key: "qr",         label: "Invite QR",      emoji: "🔗", color: "#f97316", desc: "Share your profile & room invites" },
];
