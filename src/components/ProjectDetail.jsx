import { useState } from 'react';
import OverviewTab from './tabs/OverviewTab.jsx';
import RulesTab from './tabs/RulesTab.jsx';
import ConfigTab from './tabs/ConfigTab.jsx';
import ReviewTab from './tabs/ReviewTab.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📋' },
  { id: 'rules',    label: 'Rules',    icon: '📏' },
  { id: 'config',   label: 'Config',   icon: '⚙️' },
  { id: 'review',   label: 'Review',   icon: '🤖' },
];

export default function ProjectDetail({ project, onUpdate, onDelete }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await onDelete();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Header */}
      <div className="project-header">
        <div className="project-header-top">
          <div className="project-header-info">
            <h2>{project.name}</h2>
            {project.repo_url ? (
              <a
                className="project-repo-link"
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 {project.repo_url.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No repo URL set</span>
            )}
          </div>

          <div className="project-header-actions">
            <button
              className={`btn btn-sm ${confirmDelete ? 'btn-danger' : 'btn-ghost'}`}
              onClick={handleDelete}
              onBlur={() => setConfirmDelete(false)}
              title="Delete project"
            >
              {confirmDelete ? '⚠️ Confirm delete' : '🗑 Delete'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab project={project} onUpdate={onUpdate} />
        )}
        {activeTab === 'rules' && (
          <RulesTab project={project} onUpdate={onUpdate} />
        )}
        {activeTab === 'config' && (
          <ConfigTab project={project} onUpdate={onUpdate} />
        )}
        {activeTab === 'review' && (
          <ReviewTab project={project} />
        )}
      </div>
    </div>
  );
}
