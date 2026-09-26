# AR Hub

A modern, mobile-first real-time messenger and personal hub built with **React 18, Firebase and WebRTC**. It's an installable PWA that works from a 360px phone to a 4K desktop.

## Features

- **Chats**: real-time DMs with sent, delivered and read ticks, typing indicators, replies (swipe right on mobile), reactions (double-tap ❤️), edit, forward, star, pin, delete for me or everyone, disappearing messages, drafts, in-chat search, export, and `*bold* _italic_ ~strike~ \`code\`` formatting.
- **Media**: photos with captions (paste, pick or camera), voice notes with live waveform and 1×/1.5×/2× playback, polls, location sharing, and hand-drawn sketches.
- **Rooms**: public and private group chats with admins, invite links and codes, @mentions, member management, a Discover page and join-by-link.
- **Calls**: peer-to-peer WebRTC voice and video, screen sharing, device switching, in-call chat, in-call games, missed-call alerts and call history.
- **Status**: 24-hour text and photo stories with a full-screen viewer, view receipts and replies.
- **Explore**: an X/Instagram-style feed (photos, likes, comments, trending #hashtags, stories bar), Reddit-style forums with up/down votes, and anonymous confessions with pseudonymous replies (the author is never stored on the public post).
- **Snaps**: view-once photos in chat that self-destruct after 10 seconds.
- **Code Arena**: LeetCode-style JavaScript problems run in a sandboxed Web Worker, with a 3s time limit and a leaderboard.
- **Notifications**: in-app toasts, system notifications through the service worker, per-chat mute, a notification centre, and a badge on the app icon and tab title.
- **Hub**: a games arcade (11 multiplayer games), weather, news, cloud-synced notes and tasks, a Pomodoro focus timer, whiteboard, calculator, unit converter and invite QR codes.
- **UX**: Ctrl/⌘+K command palette, keyboard shortcuts, long-press menus, smart reply suggestions, light/dark/system themes, accent colours, wallpapers and text size.
- **About the developer**: a portfolio / hire-me page. Edit `src/config/profile.js` to personalise it.

## Getting started

```bash
npm install --legacy-peer-deps
npm start
```

### Local development with the Firebase emulators

```bash
npx firebase emulators:start --only auth,firestore --project ar-hub-d45d1
REACT_APP_USE_EMULATOR=true npm start
```

### Deploying

Hosting deploys automatically from `main` via GitHub Actions. Security rules are **not** deployed by CI, so deploy them once:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

## Project structure

```
src/
  lib/          data layer (db.js), media, notifications, formatting, WebRTC, games
  Context/      app state (ChatContext) and theming
  ui/           screens: chat, rooms, status, calls, hub, settings, about, landing, auth
  styles/       design system and per-area stylesheets
  Components/   call screen and multiplayer games
  config/       profile.js (About page content)
```
