# AI Code Review — Frontend

React + Vite dashboard for AI-powered GitHub PR reviews. Authenticates with Firebase, connects to a GitHub account via OAuth, and calls the backend API for reviews.

## Stack

- **Framework:** React 18 + Vite
- **Auth:** Firebase Auth (Email/Password)
- **GitHub:** OAuth integration (token stored server-side, never in frontend)
- **Deployment:** Vercel (see `vercel.json`)

## Local Development

```bash
npm install
cp .env.example .env
# Fill in .env values (Firebase config + leave VITE_API_URL empty for dev)
npm run dev        # starts on http://localhost:5173
```

The Vite dev server proxies `/projects`, `/review`, `/comment`, `/auth` to `http://localhost:3001` automatically — make sure the backend is also running.

## Deploy on Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import this repo.
3. Settings:
   - **Framework preset:** Vite
   - **Root directory:** *(leave as root — this IS the frontend repo)*
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Add environment variables (see table below).
5. Click **Deploy**.

`vercel.json` in this repo handles SPA client-side routing and security headers automatically.

### Environment Variables (set in Vercel dashboard)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com` |
| `VITE_FIREBASE_API_KEY` | From Firebase console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase console |
| `VITE_FIREBASE_APP_ID` | From Firebase console |

### After Deploying

Note your Vercel URL (e.g. `https://ai-code-review.vercel.app`) and update:
- **Backend** `ALLOWED_ORIGINS` → your Vercel URL
- **Backend** `FRONTEND_URL` → your Vercel URL
- **GitHub OAuth App** Homepage URL → your Vercel URL

## Project Structure

```
frontend/
├── vercel.json          ← Vercel SPA routing + security headers
├── vite.config.js       ← Dev server proxy config
├── .env.example
└── src/
    ├── App.jsx
    ├── App.css
    ├── firebase.js
    ├── api/
    │   └── index.js     ← All API calls (auto-attaches Firebase token)
    ├── contexts/
    │   ├── AuthContext.jsx
    │   └── GitHubContext.jsx
    ├── pages/
    │   └── AuthPage.jsx
    └── components/
        ├── Sidebar.jsx
        ├── ProjectDetail.jsx
        ├── ProjectForm.jsx
        ├── IssueCard.jsx
        ├── Spinner.jsx
        └── tabs/
            ├── OverviewTab.jsx
            ├── RulesTab.jsx
            ├── ConfigTab.jsx
            └── ReviewTab.jsx
```
