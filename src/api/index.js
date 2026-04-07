import { auth } from '../firebase.js';

/**
 * Base URL for API calls.
 *
 * In development (VITE_API_URL unset) the empty string makes all paths
 * relative so Vite's dev-server proxy can forward them to localhost:3001.
 *
 * In production set VITE_API_URL=https://your-backend.onrender.com in the
 * Vite build environment and all calls will hit the remote server directly.
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

const BASE            = `${API_BASE}/projects`;
const REVIEW          = `${API_BASE}/review`;
const COMMENT         = `${API_BASE}/comment`;
const GITHUB          = `${API_BASE}/auth/github`;
const SETUP_WORKFLOW  = `${API_BASE}/setup-workflow`;
const REVIEWS_BASE    = `${API_BASE}/reviews`;
const APPLY_FIX       = `${API_BASE}/apply-fix`;

/**
 * Get the current user's Firebase ID token.
 * Returns null when unauthenticated (GitHub Actions / public routes).
 */
async function getToken() {
  return auth.currentUser ? auth.currentUser.getIdToken() : null;
}

/**
 * Central fetch wrapper.
 * Automatically attaches Authorization header when a user is signed in.
 */
async function request(url, options = {}) {
  const token = await getToken();

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(url, { headers, ...options });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Projects (require auth) ────────────────────────────────────────────────────
export const getProjects = () => request(BASE);

export const createProject = (body) =>
  request(BASE, { method: 'POST', body: JSON.stringify(body) });

export const updateProject = (id, body) =>
  request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteProject = (id) =>
  request(`${BASE}/${id}`, { method: 'DELETE' });

// ── Review + Comment (also used unauthenticated by GitHub Actions) ─────────────
export const runReview = (body) =>
  request(REVIEW, { method: 'POST', body: JSON.stringify(body) });

export const postComment = (body) =>
  request(COMMENT, { method: 'POST', body: JSON.stringify(body) });

// ── GitHub OAuth (require auth) ────────────────────────────────────────────────

/**
 * Returns { url } — the GitHub authorization URL to redirect to.
 * The backend creates a state nonce and embeds it in the URL.
 */
export const getGitHubAuthUrl = () => request(`${GITHUB}/url`);

/**
 * Returns { connected, githubUsername, connectedAt }.
 * Never exposes the actual token.
 */
export const getGitHubStatus = () => request(`${GITHUB}/status`);

/**
 * Removes the stored GitHub token from Firestore (disconnect).
 */
export const disconnectGitHub = () =>
  request(GITHUB, { method: 'DELETE' });

/**
 * Fetch all GitHub repos accessible to the user (personal + org).
 * Returns { repos: [ { id, name, full_name, html_url, owner, owner_type, private, ... } ] }
 */
export const getGitHubRepos = () => request(`${GITHUB}/repos`);

// ── Workflow setup ─────────────────────────────────────────────────────────────

/**
 * Push the AI review GitHub Actions workflow to a repo.
 * Body: { repo: "owner/repo" }
 */
export const setupWorkflow = (body) =>
  request(SETUP_WORKFLOW, { method: 'POST', body: JSON.stringify(body) });

/**
 * Check whether the AI review workflow file already exists in a repo.
 * Returns { exists: bool, file_url: string|null }
 */
export const getWorkflowStatus = (repo) =>
  request(`${SETUP_WORKFLOW}/status?repo=${encodeURIComponent(repo)}`);

// ── Review history ─────────────────────────────────────────────────────────────

/**
 * Fetch review history for a project (most recent first).
 * Returns { reviews: [...] }
 */
export const getReviews = (projectId) =>
  request(`${REVIEWS_BASE}/${projectId}`);

/**
 * Delete a single review record.
 */
export const deleteReview = (reviewId) =>
  request(`${REVIEWS_BASE}/${reviewId}`, { method: 'DELETE' });

// ── Apply Fixes ────────────────────────────────────────────────────────────────

/**
 * Ask the AI to apply fixes to a PR's files and open a new PR with the patches.
 * Body: { pr_url: string, project_id?: string }
 *
 * Returns:
 *   success: true  → { pr_url, branch, overall_summary, patches[], files_fixed }
 *   success: false → { message, patches: [] }
 */
export const applyFix = (body) =>
  request(APPLY_FIX, { method: 'POST', body: JSON.stringify(body) });
