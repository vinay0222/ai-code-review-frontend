import { useState } from 'react';

export default function ProjectForm({ onSubmit, onClose }) {
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              placeholder="e.g. my-saas-app"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Repository URL</label>
            <input
              type="url"
              placeholder="https://github.com/org/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <div className="form-hint">Optional — used for context and display only.</div>
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
