/**
 * profile.js — everything shown on the About / "Hire me" page.
 * Edit this one file to personalise the portfolio; empty fields are hidden.
 */
const profile = {
  name: "Rajnikant",
  role: "Full-Stack Developer · React & Firebase",
  location: "India",
  available: true, // shows the "Open to opportunities" badge
  tagline: "I build fast, delightful real-time products — from pixel-perfect UIs to the data layer behind them.",
  bio: [
    "I'm a developer who loves turning ideas into polished, production-ready apps. AR Hub is my flagship project: a full messaging platform with real-time chat, group rooms, peer-to-peer voice & video calling, status stories, multiplayer games and a productivity hub — all built from scratch.",
    "I care about the details that make software feel great: instant optimistic updates, offline support, accessible keyboard navigation, and layouts that work beautifully from a 360px phone to a 4K monitor.",
  ],
  avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Rajnikant&backgroundColor=c0aede",

  // Contact links — leave any blank to hide it
  email: "",          // e.g. "you@example.com"
  github: "https://github.com/rajnikant1021",
  linkedin: "",       // e.g. "https://www.linkedin.com/in/your-handle"
  website: "",
  resumeUrl: "",      // link to a PDF résumé

  skills: [
    { group: "Frontend", items: ["React 18", "JavaScript (ES2023)", "HTML5", "CSS3 / Responsive design", "React Router", "PWA & Service Workers"] },
    { group: "Backend & Cloud", items: ["Firebase Auth", "Cloud Firestore", "Security rules", "Firebase Hosting", "REST APIs", "Node.js"] },
    { group: "Real-time & Media", items: ["WebRTC (P2P audio/video)", "Screen sharing", "Data channels", "MediaRecorder", "Web Audio API", "Canvas"] },
    { group: "Engineering", items: ["Git & GitHub Actions CI/CD", "Performance optimisation", "Accessibility", "UX design", "Playwright testing"] },
  ],

  // Optional work history — add entries like:
  // { title: "Frontend Developer", org: "Company", period: "2023 — Present", points: ["Did X", "Improved Y by Z%"] }
  experience: [],

  projects: [
    {
      name: "AR Hub",
      emoji: "💬",
      description: "A WhatsApp-class messenger with rooms, WebRTC calls, stories, voice notes, games and a productivity hub. Installable PWA with offline support.",
      tags: ["React", "Firebase", "WebRTC", "PWA"],
      link: "https://github.com/rajnikant1021/ar-hub",
    },
  ],
};

export default profile;
