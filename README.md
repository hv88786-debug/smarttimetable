# SmartTimetable

Smarter scheduling for modern education — a landing page with a demo login flow that connects to a full-featured timetable management dashboard.

> Built as part of the **30 Days · 30 SIH Solutions** series.

## ✨ What's inside

This project has **two completely separate pages**, connected only through routing/navigation — not merged into one file:

| Page | File | Description |
|---|---|---|
| Landing Page | `index.html` | Plain HTML/CSS/JS. Hero section + "Continue as Harish Kumar" demo login modal. |
| Dashboard | `dashboard.html` + `src/Dashboard.jsx` | Full React app — timetable grid, conflict detection, exam mode, emergency substitutions, PDF export, activity log. |

### How the flow works

1. User lands on `index.html`.
2. Clicks **"Continue as Harish Kumar"** → a demo login modal opens showing the demo account (Harish Kumar · Administrator · Demo Account) with **Continue** / **Cancel** buttons.
3. On **Continue**:
   - A demo session is saved to `localStorage` (`st_session_harish`).
   - A "👋 Welcome back, Harish!" toast appears.
   - The browser redirects to `dashboard.html`.
4. On the dashboard, the user's profile menu (top-right) has a **Sign out** button. Signing out clears the session and redirects back to `index.html`.
5. **Refresh behavior**: if a session already exists in `localStorage`, refreshing `index.html` auto-redirects to `dashboard.html`. If there's no session and someone opens `dashboard.html` directly, it redirects back to `index.html`.

No backend, no real auth — this is a demo/hackathon-style session using `localStorage`.

## 🗂 Project structure

```
smarttimetable/
├── index.html              # Landing page (static, plain HTML/CSS/JS)
├── dashboard.html           # Dashboard page shell (mounts the React app)
├── src/
│   ├── main.jsx             # React entry point — mounts Dashboard.jsx into dashboard.html
│   ├── Dashboard.jsx        # The full dashboard React component
│   └── index.css            # Tailwind imports
├── vite.config.js           # Multi-page Vite config (index.html + dashboard.html)
├── tailwind.config.js
├── postcss.config.js
├── vercel.json               # Vercel deployment config
├── package.json
└── package-lock.json
```

## 🚀 Running locally

> ⚠️ **Don't use VS Code's "Live Server" extension** — it serves raw files and can't compile JSX, so the dashboard will load blank with a MIME-type console error. You **must** use Vite's own dev server.

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

This will print a local URL, usually:

```
Local:   http://localhost:5173/
```

- Landing page → `http://localhost:5173/`
- Dashboard → `http://localhost:5173/dashboard.html`

Vite hot-reloads automatically as you edit files.

### Production build preview

To check exactly what will be deployed (same static output Vercel will serve):

```bash
npm run build
npm run preview
```

## 📦 Deploying to Vercel

1. Push this project to a GitHub repository.
2. On [vercel.com](https://vercel.com), click **Add New Project** → import the repo.
3. Vercel auto-detects the **Vite** framework. Defaults are already correct:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**.

Both `index.html` and `dashboard.html` will be served as static pages at the deployed domain (e.g. `your-app.vercel.app/` and `your-app.vercel.app/dashboard.html`).

## 🛠 Tech stack

- **Landing page**: vanilla HTML/CSS/JS
- **Dashboard**: React 18 + Tailwind CSS, built with Vite
- **Hosting**: Vercel (static build)

## 👤 Demo credentials

This is a demo-only flow — no real authentication is performed.

- **Name**: Harish Kumar
- **Role**: Administrator
- **Account type**: Demo Account

---

*Part of the 30 Days · 30 SIH Solutions project series — Day 10.*
