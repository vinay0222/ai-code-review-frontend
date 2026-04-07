import { useState } from 'react';
import OverviewTab from './tabs/OverviewTab.jsx';
import RulesTab    from './tabs/RulesTab.jsx';
import ConfigTab   from './tabs/ConfigTab.jsx';
import ReviewTab   from './tabs/ReviewTab.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/>
      <rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>
    </svg>
  )},
  { id: 'rules',    label: 'Rules', icon: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="10" y2="8"/><line x1="3" y1="12" x2="8" y2="12"/>
    </svg>
  )},
  { id: 'config',   label: 'Config', icon: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/>
    </svg>
  )},
  { id: 'review',   label: 'Review', icon: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="6" r="3"/><circle cx="8" cy="6" r="1" fill="currentColor" stroke="none"/>
      <path d="M2.5 13c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"/>
    </svg>
  )},
];

function GitLinkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7l5-5m0 0H8m4 0v4" /><path d="M9 5H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}

export default function ProjectDetail({ project, onUpdate, onDelete }) {
  const [activeTab, setActiveTab]     = useState('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await onDelete();
  };

  const repoDisplay = project.repo_url
    ? project.repo_url.replace(/^https?:\/\/(www\.)?github\.com\//, '')
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="project-header">
        <div className="project-header-top">
          <div className="project-header-info">
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Project</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><polyline points="3 2 7 5 3 8"/></svg>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {project.name}
              </span>
            </div>

            <h2>{project.name}</h2>

            {repoDisplay ? (
              <a
                className="project-repo-link"
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitLinkIcon />
                {repoDisplay}
              </a>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No repo URL configured</span>
            )}
          </div>

          <div className="project-header-actions">
            <button
              className={`btn btn-sm ${confirmDelete ? 'btn-danger' : 'btn-ghost'}`}
              onClick={handleDelete}
              onBlur={() => setConfirmDelete(false)}
              title="Delete project"
            >
              {confirmDelete ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2z"/><line x1="8" y1="6" x2="8" y2="9"/><circle cx="8" cy="11.5" r=".5" fill="currentColor"/>
                  </svg>
                  Confirm delete
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 4 14 4"/><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M6 7l.5 5M10 7l-.5 5"/>
                    <path d="M3 4l1 9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-9"/>
                  </svg>
                  Delete
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className="tab-content">
        {activeTab === 'overview' && <OverviewTab project={project} onUpdate={onUpdate} />}
        {activeTab === 'rules'    && <RulesTab    project={project} onUpdate={onUpdate} />}
        {activeTab === 'config'   && <ConfigTab   project={project} onUpdate={onUpdate} />}
        {activeTab === 'review'   && <ReviewTab   project={project} />}
      </div>
    </div>
  );
}
