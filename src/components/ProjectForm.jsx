import { useState, useEffect, useRef, useCallback } from 'react';
import { useGitHub } from '../contexts/GitHubContext.jsx';
import { getGitHubRepos } from '../api/index.js';

// ─── Icons ─────────────────────────────────────────────────────────────────────

function GithubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
        -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
        .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
        -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0
        1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
        1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01
        1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1
        1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1.5V4.5A3.5 3.5 0 0 0 8 1zm2.5 5H5.5V4.5a2.5
        2.5 0 0 1 5 0V6z" />
    </svg>
  );
}

// ─── Repo picker ───────────────────────────────────────────────────────────────

function RepoPicker({ onSelect, connected, onConnect }) {
  const [repos, setRepos]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [open, setOpen]         = useState(false);
  const wrapRef = useRef(null);

  // Fetch repos when GitHub is connected
  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { repos: data } = await getGitHubRepos();
      setRepos(data);
    } catch (err) {
      setError(err.message || 'Failed to load repositories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connected) fetchRepos();
  }, [connected, fetchRepos]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Group filtered repos by owner
  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const groups = filtered.reduce((acc, repo) => {
    const key = repo.owner_type === 'Organization' ? `org:${repo.owner}` : 'personal';
    if (!acc[key]) acc[key] = { label: repo.owner_type === 'Organization' ? repo.owner : 'Personal', repos: [] };
    acc[key].repos.push(repo);
    return acc;
  }, {});

  const handlePick = (repo) => {
    setSelected(repo);
    setOpen(false);
    setSearch('');
    onSelect(repo);
  };

  if (!connected) {
    return (
      <div className="repo-picker-unconnected">
        <GithubIcon size={15} />
        <span>Connect GitHub to browse your repositories</span>
        <button type="button" className="btn btn-sm btn-connect-gh" onClick={onConnect}>
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="repo-picker-wrap" ref={wrapRef}>
      {/* Trigger button */}
      <button
        type="button"
        className={`repo-picker-trigger${selected ? ' has-value' : ''}`}
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
      >
        {loading ? (
          <><span className="btn-spinner" style={{ borderTopColor: 'var(--text-muted)' }} /> Loading repos…</>
        ) : selected ? (
          <>
            <GithubIcon size={13} />
            <span className="repo-trigger-name">{selected.full_name}</span>
            {selected.private && <span className="repo-private-badge"><LockIcon /> Private</span>}
            <span className="repo-trigger-chevron">▾</span>
          </>
        ) : (
          <>
            <GithubIcon size={13} />
            <span style={{ color: 'var(--text-muted)' }}>Select a repository…</span>
            <span className="repo-trigger-chevron">▾</span>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="repo-dropdown">
          <div className="repo-search-wrap">
            <input
              className="repo-search"
              type="text"
              placeholder="Search repositories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          {error && <div className="repo-dropdown-error">⚠️ {error}</div>}

          <div className="repo-list">
            {Object.keys(groups).length === 0 && !loading && (
              <div className="repo-empty">No repositories found.</div>
            )}

            {Object.entries(groups).map(([key, group]) => (
              <div key={key} className="repo-group">
                <div className="repo-group-label">
                  {group.label === 'Personal' ? '👤 Personal' : `🏢 ${group.label}`}
                </div>
                {group.repos.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    className={`repo-item${selected?.id === repo.id ? ' active' : ''}`}
                    onClick={() => handlePick(repo)}
                  >
                    <div className="repo-item-name">
                      <GithubIcon size={12} />
                      {repo.name}
                      {repo.private && (
                        <span className="repo-private-badge"><LockIcon /> Private</span>
                      )}
                    </div>
                    {repo.description && (
                      <div className="repo-item-desc">{repo.description}</div>
                    )}
                    {repo.language && (
                      <div className="repo-item-lang">{repo.language}</div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Manual URL fallback */}
          <div className="repo-manual-hint">
            Can't find your repo?{' '}
            <button
              type="button"
              className="btn-inline-link"
              onClick={() => { setOpen(false); onSelect(null); }}
            >
              Enter URL manually
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function ProjectForm({ onSubmit, onClose }) {
  const [name, setName]           = useState('');
  const [repoUrl, setRepoUrl]     = useState('');
  const [useManual, setUseManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  const { connected, connect } = useGitHub();

  const handleRepoPick = (repo) => {
    if (!repo) {
      setUseManual(true);
      return;
    }
    setRepoUrl(repo.html_url);
    // Auto-fill project name from repo name if not already typed
    if (!name.trim()) setName(repo.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), repo_url: repoUrl.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Create New Project</h3>

        {error && (
          <div className="error-banner"><span>⚠️</span> {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Repo picker — shown first so name can be auto-filled */}
          <div className="form-group">
            <label className="form-label">
              Repository
              {connected && (
                <span className="form-label-badge">GitHub connected</span>
              )}
            </label>

            {!useManual ? (
              <>
                <RepoPicker
                  connected={connected}
                  onSelect={handleRepoPick}
                  onConnect={connect}
                />
                {repoUrl && (
                  <div className="repo-selected-url">
                    <GithubIcon size={12} />
                    <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                      {repoUrl.replace('https://github.com/', '')}
                    </a>
                    <button
                      type="button"
                      className="btn-inline-link"
                      onClick={() => { setRepoUrl(''); }}
                      style={{ marginLeft: 'auto', fontSize: 11 }}
                    >
                      Change
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <input
                  type="url"
                  placeholder="https://github.com/owner/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                />
                <div className="form-hint">
                  <button
                    type="button"
                    className="btn-inline-link"
                    onClick={() => setUseManual(false)}
                    style={{ color: 'var(--accent)' }}
                  >
                    ← Browse GitHub repos instead
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Project name */}
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              placeholder="e.g. my-saas-app"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus={!connected}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !name.trim()}>
              {submitting ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
