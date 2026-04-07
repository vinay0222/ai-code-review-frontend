import { useGitHub } from '../contexts/GitHubContext.jsx';
import { SidebarProjectSkeleton } from './Skeleton.jsx';

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

function LogoutIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Sidebar({
  projects, selectedId, onSelect, onNewProject, loading, user, onLogout,
}) {
  const { connected, githubUsername, statusLoading, connect, disconnect } = useGitHub();

  const initials = (name) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

  const displayEmail = user?.email ?? '';
  const avatarLetter = displayEmail[0]?.toUpperCase() ?? '?';

  return (
    <aside className="sidebar">
      {/* ── Logo / branding ───────────────────────────────────────────────── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">⚡</div>
          <div>
            <div className="sidebar-title">CodeReview AI</div>
            <div className="sidebar-subtitle">by iDream</div>
          </div>
        </div>
        <button className="btn-new-project" onClick={onNewProject}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
          </svg>
          New Project
        </button>
      </div>

      {/* ── Projects list ─────────────────────────────────────────────────── */}
      <div className="sidebar-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 14 }}>
        <span>Projects</span>
        {!loading && projects.length > 0 && (
          <span style={{
            background: 'rgba(124,102,255,.15)',
            color: '#a78bfa',
            fontSize: 10,
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: 10,
            border: '1px solid rgba(124,102,255,.2)',
          }}>
            {projects.length}
          </span>
        )}
      </div>

      <div className="project-list">
        {loading && (
          <>
            <SidebarProjectSkeleton />
            <SidebarProjectSkeleton />
            <SidebarProjectSkeleton />
          </>
        )}

        {!loading && projects.length === 0 && (
          <div className="sidebar-empty">
            No projects yet.<br />
            <span style={{ opacity: .7 }}>Click <strong>New Project</strong> to get started.</span>
          </div>
        )}

        {projects.map((project) => (
          <div
            key={project.id}
            className={`project-item${selectedId === project.id ? ' active' : ''}`}
            onClick={() => onSelect(project.id)}
            title={project.name}
          >
            <div className="project-avatar">{initials(project.name)}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="project-item-name">{project.name}</div>
              {project.repo_url && (
                <div className="project-item-url">
                  {project.repo_url.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                </div>
              )}
            </div>
            {selectedId === project.id && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(124,102,255,.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="5 2 10 7 5 12" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* ── GitHub connection ────────────────────────────────────────────── */}
      <div className="sidebar-github">
        <div className="sidebar-section-label">GitHub</div>
        {statusLoading ? (
          <div className="gh-status gh-status-loading">
            <span className="gh-dot gh-dot-loading" />
            Checking…
          </div>
        ) : connected ? (
          <div className="gh-status gh-status-connected">
            <div className="gh-status-row">
              <span className="gh-dot gh-dot-connected" />
              <GithubIcon size={12} />
              <span className="gh-username">@{githubUsername}</span>
            </div>
            <button
              className="gh-disconnect-btn"
              onClick={disconnect}
              title="Disconnect GitHub account"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button className="gh-connect-btn" onClick={connect} title="Connect your GitHub account">
            <GithubIcon size={13} />
            Connect GitHub
          </button>
        )}
      </div>

      {/* ── User footer ───────────────────────────────────────────────────── */}
      {user && (
        <div className="sidebar-user">
          <div className="user-avatar">{avatarLetter}</div>
          <div className="user-info">
            <div className="user-email" title={displayEmail}>{displayEmail}</div>
            <div className="user-role">Signed in</div>
          </div>
          <button
            className="logout-btn"
            onClick={onLogout}
            title="Sign out"
          >
            <LogoutIcon />
          </button>
        </div>
      )}
    </aside>
  );
}
