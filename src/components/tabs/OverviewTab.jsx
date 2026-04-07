import { useState } from 'react';

export default function OverviewTab({ project, onUpdate }) {
  const [docs, setDocs] = useState(project.docs || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({ docs });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const rulesCount = project.rules?.length ?? 0;
  const configChecks = project.review_config
    ? Object.entries(project.review_config)
        .filter(([k, v]) => k.startsWith('check_') && v === true).length
    : 0;

  return (
    <div>
      <div className="overview-meta">
        <div className="meta-chip">
          📁 <strong>{project.name}</strong>
        </div>
        {project.repo_url && (
          <a
            className="meta-chip"
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            🔗 <strong>{project.repo_url.replace(/^https?:\/\//, '')}</strong>
          </a>
        )}
        <div className="meta-chip">
          📋 <strong>{rulesCount}</strong> {rulesCount === 1 ? 'rule' : 'rules'}
        </div>
        <div className="meta-chip">
          ✅ <strong>{configChecks}</strong> checks enabled
        </div>
        <div className="meta-chip">
          ⚡ Strictness: <strong>{project.review_config?.strictness || 'medium'}</strong>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">📄</span> Project Documentation
          </div>
        </div>

        <textarea
          placeholder="Describe this project — its purpose, tech stack, architecture, important conventions, etc. This context is sent to the AI during code reviews."
          value={docs}
          onChange={(e) => { setDocs(e.target.value); setSaved(false); }}
          style={{ minHeight: 180 }}
        />

        <div className="save-bar">
          <span className="save-bar-hint">
            Documentation helps the AI understand your codebase.
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || docs === project.docs}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Docs'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>
          <span className="card-title-icon">🕐</span> Project Created
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          {new Date(project.created_at).toLocaleString(undefined, {
            dateStyle: 'long',
            timeStyle: 'short',
          })}
        </div>
      </div>
    </div>
  );
}
