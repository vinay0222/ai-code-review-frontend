import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { GitHubProvider, useGitHub } from './contexts/GitHubContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProjectDetail from './components/ProjectDetail.jsx';
import ProjectForm from './components/ProjectForm.jsx';
import { getProjects, createProject, updateProject, deleteProject } from './api/index.js';

// ─── OAuth callback toast ──────────────────────────────────────────────────────
//
// After the GitHub OAuth callback the backend redirects to:
//   http://localhost:5173?github=connected&username=johndoe
//   http://localhost:5173?github=denied&reason=access_denied
//   http://localhost:5173?github=error&reason=...
//
// We read those params on mount, surface a brief toast, and clean up the URL.

function useOAuthToast(onRefreshGitHub) {
  const [toast, setToast] = useState(null); // { type: 'success'|'error'|'warning', message }

  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const github  = params.get('github');
    const username = params.get('username');
    const reason  = params.get('reason');

    if (!github) return;

    // Strip the OAuth params from the URL without triggering a reload
    const clean = window.location.pathname;
    window.history.replaceState({}, '', clean);

    if (github === 'connected') {
      onRefreshGitHub();
      setToast({
        type:    'success',
        message: `GitHub connected${username ? ` as @${username}` : ''}! You can now run reviews using your personal token.`,
      });
    } else if (github === 'denied') {
      setToast({
        type:    'warning',
        message: 'GitHub connection cancelled — you denied the authorisation request.',
      });
    } else {
      setToast({
        type:    'error',
        message: `Failed to connect GitHub${reason ? `: ${decodeURIComponent(reason).replace(/_/g, ' ')}` : '.'}`,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(id);
  }, [toast]);

  return { toast, dismissToast: () => setToast(null) };
}

// ─── Toast component ───────────────────────────────────────────────────────────

function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      <span className="toast-icon">
        {toast.type === 'success' ? '✅' : toast.type === 'warning' ? '⚠️' : '❌'}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}

// ─── Dashboard (shown when authenticated) ─────────────────────────────────────

function Dashboard() {
  const [projects, setProjects]     = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading]       = useState(true);

  const { user, logout }  = useAuth();
  const { refresh: refreshGitHub } = useGitHub();

  const { toast, dismissToast } = useOAuthToast(refreshGitHub);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchProjects();
  }, [user, fetchProjects]);

  const handleCreate = async (values) => {
    const created = await createProject(values);
    setProjects((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setShowCreate(false);
  };

  const handleUpdate = async (id, patch) => {
    const updated = await updateProject(id, patch);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const handleDelete = async (id) => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="app-layout">
      <Sidebar
        projects={projects}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNewProject={() => setShowCreate(true)}
        loading={loading}
        user={user}
        onLogout={logout}
      />

      <main className="main-content">
        {selectedProject ? (
          <ProjectDetail
            key={selectedProject.id}
            project={selectedProject}
            onUpdate={(patch) => handleUpdate(selectedProject.id, patch)}
            onDelete={() => handleDelete(selectedProject.id)}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h2>{loading ? 'Loading projects…' : 'No project selected'}</h2>
            <p>
              {loading
                ? 'Fetching your projects…'
                : 'Select a project from the sidebar or create a new one to get started.'}
            </p>
          </div>
        )}
      </main>

      {showCreate && (
        <ProjectForm
          onSubmit={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

// ─── Auth gate ─────────────────────────────────────────────────────────────────

function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
        <span>Loading…</span>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <GitHubProvider>
      <Dashboard />
    </GitHubProvider>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
