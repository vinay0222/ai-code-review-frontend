import { useState, useEffect, useCallback } from 'react';
import { runReview, postComment, setupWorkflow, getWorkflowStatus, getReviews, deleteReview, applyFix } from '../../api/index.js';
import { useGitHub } from '../../contexts/GitHubContext.jsx';
import Spinner from '../Spinner.jsx';
import IssueCard from '../IssueCard.jsx';

// ─── Icons ─────────────────────────────────────────────────────────────────────

function GithubIcon({ size = 15 }) {
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

// ─── Sub-components ────────────────────────────────────────────────────────────

function GitHubWarningBanner({ onConnect }) {
  return (
    <div className="gh-warning-banner">
      <div className="gh-warning-icon"><GithubIcon size={20} /></div>
      <div className="gh-warning-body">
        <div className="gh-warning-title">GitHub account not connected</div>
        <div className="gh-warning-text">
          Connect your GitHub account so reviews use your personal token — giving
          access to private repos and a higher API rate limit.
        </div>
      </div>
      <button className="btn btn-connect-gh" onClick={onConnect}>
        <GithubIcon size={13} /> Connect GitHub
      </button>
    </div>
  );
}

function GitHubPostButton({ result, onPost }) {
  const [posting, setPosting]       = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [postError, setPostError]   = useState('');

  const handle = async () => {
    setPosting(true);
    setPostResult(null);
    setPostError('');
    try {
      const res = await onPost();
      setPostResult(res);
    } catch (err) {
      setPostError(err.message || 'Failed to post comment to GitHub.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        className="btn btn-github"
        onClick={handle}
        disabled={posting || !!postResult}
        title="Post AI review as a comment on the GitHub PR"
      >
        {posting   ? <><span className="btn-spinner" /> Posting to GitHub…</>
         : postResult ? '✅ Posted to GitHub'
         : <><GithubIcon /> Post Review to GitHub</>}
      </button>

      {postError && (
        <div className="error-banner" style={{ marginBottom: 0 }}>
          <span>⚠️</span><div>{postError}</div>
        </div>
      )}

      {postResult && (
        <div className="github-post-result">
          <span>✅</span>
          <div>
            <strong>{postResult.message}</strong>
            {postResult.general_comment_url && (
              <> <a href={postResult.general_comment_url} target="_blank" rel="noopener noreferrer" className="gh-link">View on GitHub →</a></>
            )}
            {postResult.inline_posted > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {postResult.inline_posted} inline comment(s) posted on diff lines.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RawJson({ data }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ marginTop: 20 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(v => !v)} style={{ marginBottom: open ? 12 : 0 }}>
        {open ? '▲ Hide' : '▼ Show'} raw JSON response
      </button>
      {open && <pre className="raw-json">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

// ─── Workflow YAML copy panel (shown when auto-push fails) ────────────────────

function WorkflowCopyPanel({ yaml, filePath, reason, repoSlug, projectId, onVerified }) {
  const [copied,     setCopied]   = useState(false);
  const [verifying,  setVerifying] = useState(false);
  // null = not checked, 'found' = file exists + current, 'outdated' = exists but stale, 'missing' = not found
  const [verifyResult, setVerifyResult] = useState(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      document.getElementById('wf-yaml-area')?.select();
    }
  };

  const download = () => {
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'ai-review.yml'; a.click();
    URL.revokeObjectURL(url);
  };

  const verify = async () => {
    if (!repoSlug) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { exists, is_current, file_url } = await getWorkflowStatus(repoSlug, projectId);
      if (!exists) {
        setVerifyResult('missing');
      } else if (is_current === false) {
        setVerifyResult('outdated');
        onVerified?.('outdated', file_url);
      } else {
        setVerifyResult('found');
        onVerified?.('found', file_url);
      }
    } catch (err) {
      setVerifyResult('error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="workflow-copy-panel">
      <div className="workflow-copy-header">
        <div className="workflow-copy-title">⚠️ Auto-push failed — add the workflow manually</div>
        <div className="workflow-copy-reason">{reason}</div>
      </div>

      <div className="workflow-copy-instructions">
        <strong>Add it manually in 30 seconds:</strong>
        <ol>
          <li>In your repo create the file <code>{filePath}</code></li>
          <li>Paste the YAML below as its entire content</li>
          <li>Commit to <code>main</code> — done ✓</li>
          <li>Click <strong>Verify</strong> below to confirm the file was found</li>
        </ol>
      </div>

      <div className="workflow-copy-actions">
        <button className="btn btn-primary btn-sm" onClick={copy}>
          {copied ? '✅ Copied!' : '📋 Copy YAML'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={download}>
          ⬇ Download file
        </button>
        {repoSlug && (
          <button
            className="btn btn-verify btn-sm"
            onClick={verify}
            disabled={verifying}
          >
            {verifying ? <><span className="btn-spinner" /> Checking…</> : '🔍 Verify'}
          </button>
        )}
      </div>

      {/* Verification result */}
      {verifyResult === 'found' && (
        <div className="verify-result verify-ok">
          ✅ Workflow found and up to date — Auto AI Review is now active!
        </div>
      )}
      {verifyResult === 'outdated' && (
        <div className="verify-result verify-warn">
          ⚠️ Workflow file found but its content is outdated. Use <strong>Re-push workflow</strong> to update it, or replace the file content manually with the YAML below.
        </div>
      )}
      {verifyResult === 'missing' && (
        <div className="verify-result verify-fail">
          ❌ File not found yet. Make sure you committed <code>{filePath}</code> to the repository and try again.
        </div>
      )}
      {verifyResult === 'error' && (
        <div className="verify-result verify-fail">
          ❌ Could not reach GitHub. Check your connection and try again.
        </div>
      )}

      <textarea
        id="wf-yaml-area"
        className="workflow-yaml-area"
        readOnly
        value={yaml}
        rows={Math.min(yaml.split('\n').length, 30)}
        onClick={(e) => e.target.select()}
      />
    </div>
  );
}

// ─── Enable Auto Review card ───────────────────────────────────────────────────

function AutoReviewCard({ project, connected, onConnect }) {
  const [setting,        setSetting]       = useState(false);
  const [setupResult,    setResult]        = useState(null);
  const [checking,       setChecking]      = useState(false);
  // null = unknown, true = file exists, false = not set up
  const [workflowExists, setWorkflowExists] = useState(null);
  // null = unknown, true = file matches current template, false = outdated
  const [isCurrent,      setIsCurrent]     = useState(null);
  const [fileUrl,        setFileUrl]       = useState(null);

  const repoSlug = project.repo_url
    ? project.repo_url
        .replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')
        .replace(/\.git$/, '')
        .replace(/\/$/, '')
    : null;

  // On mount: check file existence AND whether it matches the current template
  useEffect(() => {
    if (!connected || !repoSlug) return;
    let cancelled = false;
    (async () => {
      setChecking(true);
      try {
        const { exists, is_current, file_url } = await getWorkflowStatus(repoSlug, project.id);
        if (!cancelled) {
          setWorkflowExists(exists);
          setIsCurrent(is_current);
          setFileUrl(file_url || null);
        }
      } catch {
        // Network error — leave as unknown
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, [connected, repoSlug, project.id]);

  const handleSetup = async () => {
    if (!repoSlug) return;
    setSetting(true);
    setResult(null);
    try {
      const res = await setupWorkflow({ repo: repoSlug, project_id: project.id });
      setResult(res);
      if (res.success) {
        setWorkflowExists(true);
        setIsCurrent(true);
        setFileUrl(res.file_url || null);
      }
    } catch (err) {
      setResult({
        success: false, push_failed: true,
        reason: err.message || 'Network error.',
        workflow_yaml: null,
        file_path: '.github/workflows/ai-review.yml',
      });
    } finally {
      setSetting(false);
    }
  };

  // Called by WorkflowCopyPanel after the user verifies manually
  const handleVerified = (status, url) => {
    if (status === 'found') {
      setWorkflowExists(true);
      setIsCurrent(true);
      setFileUrl(url || null);
      setResult(null); // hide the copy panel
    } else if (status === 'outdated') {
      setWorkflowExists(true);
      setIsCurrent(false);
      setFileUrl(url || null);
    }
  };

  const isEnabled   = workflowExists || setupResult?.success === true;
  const needsUpdate = isEnabled && isCurrent === false; // file exists but is stale
  const pushFailed  = setupResult && !setupResult.success;

  // Status badge
  let statusBadge = null;
  if (checking) {
    statusBadge = <span className="auto-review-checking">Checking…</span>;
  } else if (isEnabled && needsUpdate) {
    statusBadge = <span className="badge badge-warn">⚠️ Update available</span>;
  } else if (isEnabled) {
    statusBadge = <span className="badge badge-success">✅ Active</span>;
  }

  // Main action button — only shown when needed
  let actionBtn = null;
  if (!connected) {
    actionBtn = (
      <button className="btn btn-github" onClick={onConnect}>
        <GithubIcon size={13} /> Connect GitHub first
      </button>
    );
  } else if (!repoSlug) {
    actionBtn = null; // warning shown below
  } else if (!isEnabled) {
    actionBtn = (
      <button className="btn btn-github" onClick={handleSetup} disabled={setting || checking}>
        {setting ? <><span className="btn-spinner" /> Setting up…</> : <><GithubIcon size={13} /> Enable Auto AI Review</>}
      </button>
    );
  } else if (needsUpdate) {
    // File exists but content is outdated — show a prominent update button
    actionBtn = (
      <button className="btn btn-github btn-github-warn" onClick={handleSetup} disabled={setting || checking}>
        {setting ? <><span className="btn-spinner" /> Updating…</> : <><GithubIcon size={13} /> Update workflow</>}
      </button>
    );
  }
  // If isEnabled && isCurrent → no button shown (workflow is up to date)

  return (
    <div className="card auto-review-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">⚡</span> Auto AI Review
        </div>
        {statusBadge}
      </div>

      <p className="auto-review-desc">
        {isEnabled && !needsUpdate
          ? <>Workflow is <strong>active</strong> in <strong>{repoSlug}</strong> — every new PR is reviewed automatically.
              {fileUrl && <> <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="gh-link">View file →</a></>}
            </>
          : isEnabled && needsUpdate
          ? <>Workflow file found in <strong>{repoSlug}</strong> but it is <strong>outdated</strong> — the backend URL or project ID may have changed. Update it to keep auto reviews working correctly.</>
          : <>Push a GitHub Actions workflow to <strong>{repoSlug || 'your repository'}</strong> so every new pull request is reviewed automatically.</>
        }
      </p>

      {!repoSlug && (
        <div className="auto-review-no-repo">
          ⚠️ Set a repository URL in the Overview tab to enable auto reviews.
        </div>
      )}

      {setupResult?.success && (
        <div className="github-post-result" style={{ marginBottom: 8 }}>
          <span>✅</span>
          <div>
            {setupResult.message}
            {setupResult.file_url && (
              <> <a href={setupResult.file_url} target="_blank" rel="noopener noreferrer" className="gh-link">View workflow →</a></>
            )}
          </div>
        </div>
      )}

      <div className="auto-review-footer">
        {actionBtn}
        <div className="auto-review-meta">
          Triggers on: <code>pull_request</code> opened, synchronize, reopened
        </div>
      </div>

      {/* Fallback copy panel — shown when auto-push fails */}
      {pushFailed && setupResult.workflow_yaml && (
        <WorkflowCopyPanel
          yaml={setupResult.workflow_yaml}
          filePath={setupResult.file_path}
          reason={setupResult.reason}
          repoSlug={repoSlug}
          projectId={project.id}
          onVerified={handleVerified}
        />
      )}
    </div>
  );
}

// ─── Review History ────────────────────────────────────────────────────────────

function SeverityPill({ count, sev }) {
  if (!count) return null;
  const icons = { high: '🔴', medium: '🟡', low: '🟢' };
  return <span className={`history-pill ${sev}`}>{icons[sev]} {count}</span>;
}

// ─── Diff viewer ───────────────────────────────────────────────────────────────

function DiffViewer({ diff }) {
  if (!diff) return null;

  const lines = diff.split('\n').map((text, i) => {
    const type =
      text.startsWith('+++') || text.startsWith('---') ? 'header'
      : text.startsWith('@@')                           ? 'hunk'
      : text.startsWith('+')                            ? 'add'
      : text.startsWith('-')                            ? 'remove'
      : 'context';
    return { text, type, i };
  });

  // Skip the file header lines (first 4 lines of unified diff), show the hunks
  const hunks = lines.filter((_, i) => i >= 4);

  if (hunks.length === 0) return <div className="diff-empty">No changes in this file.</div>;

  return (
    <div className="diff-viewer">
      {hunks.map(({ text, type, i }) => (
        <div key={i} className={`diff-line diff-${type}`}>
          <span className="diff-gutter">{type === 'add' ? '+' : type === 'remove' ? '-' : type === 'hunk' ? '@@' : ' '}</span>
          <span className="diff-text">{text.replace(/^[+\-@ ]/, '')}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Fix panel ─────────────────────────────────────────────────────────────────

function FixPanel({ review, projectId, onClose }) {
  const [status,  setStatus]  = useState('idle'); // idle | loading | done | error
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');
  const [openFile, setOpenFile] = useState(null);

  const handleApply = async () => {
    setStatus('loading');
    setError('');
    try {
      const data = await applyFix({ pr_url: review.pr_url, project_id: projectId });
      setResult(data);
      setStatus('done');
      if (data.patches?.length > 0) setOpenFile(data.patches[0].path);
    } catch (err) {
      setError(err.message || 'Apply fix failed.');
      setStatus('error');
    }
  };

  return (
    <div className="fix-panel">
      <div className="fix-panel-header">
        <div className="fix-panel-title">
          <span>🔧</span> Apply Fixes with AI
        </div>
        <button className="btn-icon-sm" onClick={onClose} title="Close">×</button>
      </div>

      {/* ── Idle state: description + CTA ─────────────────────────────── */}
      {status === 'idle' && (
        <div className="fix-panel-idle">
          <div className="fix-panel-desc">
            The AI will analyse the issues found in this review, apply targeted fixes to the source files,
            and open a new pull request against <code>{review.pr_url?.split('/').slice(3, 5).join('/')}</code> for your review.
          </div>
          <div className="fix-panel-meta">
            <span>📁 Only source files are modified — binary, deleted, and generated files are skipped.</span>
            <span>🔒 Changes are never auto-merged. You review and merge the new PR yourself.</span>
          </div>
          <button className="btn btn-fix-cta" onClick={handleApply}>
            🤖 Generate &amp; Apply Fixes
          </button>
        </div>
      )}

      {/* ── Loading ────────────────────────────────────────────────────── */}
      {status === 'loading' && (
        <div className="fix-panel-loading">
          <Spinner label="Fetching files, generating fixes, and creating PR on GitHub…" />
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="fix-panel-error">
          <div className="error-banner"><span>⚠️</span> {error}</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setStatus('idle')}>
            Try Again
          </button>
        </div>
      )}

      {/* ── Done ──────────────────────────────────────────────────────── */}
      {status === 'done' && result && (
        <div className="fix-panel-result">

          {/* Success / no-changes banner */}
          {result.success ? (
            <div className="fix-success-banner">
              <span className="fix-success-icon">🎉</span>
              <div>
                <div className="fix-success-title">PR created successfully!</div>
                <div className="fix-success-sub">{result.overall_summary}</div>
              </div>
              <a
                href={result.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-fix-pr-link"
              >
                <GithubIcon size={13} /> View PR #{result.pr_number} →
              </a>
            </div>
          ) : (
            <div className="fix-no-changes">
              ℹ️ {result.message || 'AI found no changes to apply.'}
            </div>
          )}

          {/* Patch preview */}
          {result.patches?.length > 0 && (
            <div className="fix-patches">
              <div className="fix-patches-title">
                Patch Preview — {result.files_fixed || result.patches.length} file{result.patches.length !== 1 ? 's' : ''} changed
              </div>

              <div className="fix-file-tabs">
                {result.patches.map(p => (
                  <button
                    key={p.path}
                    className={`fix-file-tab${openFile === p.path ? ' active' : ''}`}
                    onClick={() => setOpenFile(p.path)}
                  >
                    {p.path.split('/').pop()}
                  </button>
                ))}
              </div>

              {result.patches.filter(p => p.path === openFile).map(p => (
                <div key={p.path} className="fix-patch-body">
                  <div className="fix-patch-path">{p.path}</div>
                  {p.changes?.length > 0 && (
                    <ul className="fix-changes-list">
                      {p.changes.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  )}
                  <DiffViewer diff={p.diff} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── History row ───────────────────────────────────────────────────────────────

function HistoryRow({ review, projectId, onDelete }) {
  const [deleting,  setDeleting]  = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [showFix,   setShowFix]   = useState(false);

  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  const prLabel = review.pr_title || review.pr_url?.split('/').slice(-1)[0] || '—';
  const prShort = review.pr_url
    ? review.pr_url.replace('https://github.com/', '')
    : '—';

  const handleDelete = async () => {
    if (!confirm('Delete this review record?')) return;
    setDeleting(true);
    try { await onDelete(review.id); }
    catch { setDeleting(false); }
  };

  return (
    <>
      <tr className={`history-row${expanded ? ' expanded' : ''}`}>
        <td className="history-td history-td-pr">
          <div className="history-pr-title">{prLabel}</div>
          <a href={review.pr_url} target="_blank" rel="noopener noreferrer" className="history-pr-url">
            {prShort}
          </a>
        </td>
        <td className="history-td history-td-verdict">
          {review.verdict === 'needs_changes'
            ? <span className="verdict-pill needs-changes">🔴 Needs Changes</span>
            : review.verdict === 'approve'
            ? <span className="verdict-pill approve">✅ Approved</span>
            : <span className="verdict-pill unknown">— —</span>}
        </td>
        <td className="history-td history-td-issues">
          <SeverityPill count={review.issues_high}   sev="high" />
          <SeverityPill count={review.issues_medium} sev="medium" />
          <SeverityPill count={review.issues_low}    sev="low" />
          {review.issues_count === 0 && <span className="history-pill clean">✅ Clean</span>}
        </td>
        <td className="history-td history-td-trigger">
          <span className={`trigger-badge trigger-${review.triggered_by}`}>
            {review.triggered_by}
          </span>
        </td>
        <td className="history-td history-td-date">{date}</td>
        <td className="history-td history-td-actions">
          <button
            className="btn btn-fix-sm"
            title="Apply Fixes with AI"
            onClick={() => { setShowFix(v => !v); setExpanded(false); }}
          >
            🔧 Fix
          </button>
          <button
            className="btn-icon-sm"
            title="View summary"
            onClick={() => { setExpanded(v => !v); setShowFix(false); }}
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            className="btn-icon-sm btn-icon-danger"
            title="Delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '…' : '×'}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="history-summary-row">
          <td colSpan={6} className="history-summary-td">
            {review.summary || 'No summary available.'}
          </td>
        </tr>
      )}

      {showFix && (
        <tr className="history-fix-row">
          <td colSpan={6} className="history-fix-td">
            <FixPanel
              review={review}
              projectId={projectId}
              onClose={() => setShowFix(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function ReviewHistory({ projectId }) {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const { reviews: data } = await getReviews(projectId);
      setReviews(data);
    } catch (err) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (reviewId) => {
    await deleteReview(reviewId);
    setReviews(prev => prev.filter(r => r.id !== reviewId));
  };

  return (
    <div className="card history-card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">📜</span> Review History
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} title="Refresh">
          {loading ? '⟳' : '↺ Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-banner"><span>⚠️</span> {error}</div>
      )}

      {loading && <div className="history-loading"><Spinner label="Loading history…" /></div>}

      {!loading && reviews.length === 0 && (
        <div className="history-empty">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🗂️</div>
          No reviews yet. Run a review above to see history here.
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Pull Request</th>
                <th>Verdict</th>
                <th>Issues</th>
                <th>Trigger</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <HistoryRow key={r.id} review={r} projectId={projectId} onDelete={handleDelete} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ReviewTab({ project }) {
  const [prUrl, setPrUrl]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { connected, githubUsername, connect } = useGitHub();

  const handleReview = async () => {
    if (!prUrl.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const data = await runReview({
        pr_url:     prUrl.trim(),
        project_id: project.id,
        rules:      project.rules         || [],
        docs:       project.docs          || '',
        config:     project.review_config || {},
      });
      setResult(data);
      // Trigger history refresh
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError(err.message || 'Review failed. Check the PR URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostToGitHub = () =>
    postComment({
      pr_meta: result.pr_meta,
      result: {
        summary:          result.summary,
        confidence_score: result.confidence_score,
        issues:           result.issues,
      },
    });

  const counts = result?.issues
    ? result.issues.reduce((acc, { severity }) => {
        const sev = (severity || 'low').toLowerCase();
        acc[sev] = (acc[sev] || 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <div>
      {/* ── GitHub warning ──────────────────────────────────────────────────── */}
      {!connected && <GitHubWarningBanner onConnect={connect} />}

      {/* ── Auto Review setup card ──────────────────────────────────────────── */}
      <AutoReviewCard project={project} connected={connected} onConnect={connect} />

      {/* ── Manual review input card ────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">🤖</span> AI Code Review
          </div>
          {connected && githubUsername && (
            <div className="gh-connected-badge">
              <GithubIcon size={12} /> @{githubUsername}
            </div>
          )}
        </div>

        <div className="review-input-row">
          <input
            type="url"
            placeholder="https://github.com/owner/repo/pull/123"
            value={prUrl}
            onChange={(e) => { setPrUrl(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleReview()}
            disabled={loading}
          />
          <button
            className="btn btn-run"
            onClick={handleReview}
            disabled={loading || !prUrl.trim()}
          >
            {loading ? 'Reviewing…' : '▶ Run AI Review'}
          </button>
        </div>

        <div className="review-hint">
          💡 Paste a GitHub PR URL. The diff is fetched and reviewed against your rules &amp; config.
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <div>
            {error}
            {error.toLowerCase().includes('github account not connected') && (
              <button className="btn-inline-link" onClick={connect} style={{ marginLeft: 8 }}>
                Connect GitHub →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Spinner ────────────────────────────────────────────────────────── */}
      {loading && <Spinner label="Fetching diff from GitHub and running AI review…" />}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {result && !loading && (
        <>
          {/* Verdict banner */}
          <div className={`verdict-banner verdict-${result.verdict || 'approve'}`}>
            <span className="verdict-icon">
              {result.verdict === 'needs_changes' ? '🔴' : '✅'}
            </span>
            <div className="verdict-body">
              <div className="verdict-label">
                {result.verdict === 'needs_changes' ? 'Needs Changes' : 'Approved'}
              </div>
              <div className="verdict-sub">
                {result.verdict === 'needs_changes'
                  ? `${result.issues?.filter(i => i.severity === 'high' || i.severity === 'medium').length} issue(s) require attention before merging.`
                  : 'No blocking issues found. Safe to merge.'}
              </div>
            </div>
            {result.confidence_score != null && (
              <div className="confidence-ring">
                <div className="confidence-value">{result.confidence_score}</div>
                <div className="confidence-pct">confidence</div>
              </div>
            )}
          </div>

          <div className="summary-banner">
            <div className="summary-body">
              <div className="summary-label">
                AI Summary
                {result.pr_meta?.pr_title && (
                  <span style={{ fontWeight: 400, textTransform: 'none', opacity: .85, marginLeft: 8 }}>
                    — {result.pr_meta.pr_title}
                  </span>
                )}
              </div>
              <div className="summary-text">{result.summary || '—'}</div>
              {result.pr_meta?.pr_url && (
                <a href={result.pr_meta.pr_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'rgba(255,255,255,.8)', fontSize: 12, marginTop: 8, display: 'inline-block', textDecoration: 'underline' }}>
                  View PR on GitHub ↗
                </a>
              )}
            </div>
          </div>

          <div className="results-toolbar">
            <div className="review-stats" style={{ marginBottom: 0 }}>
              <div className="stat-pill total">📋 {result.issues.length} {result.issues.length === 1 ? 'issue' : 'issues'}</div>
              {counts.high   > 0 && <div className="stat-pill high">🔴 {counts.high} high</div>}
              {counts.medium > 0 && <div className="stat-pill medium">🟡 {counts.medium} medium</div>}
              {counts.low    > 0 && <div className="stat-pill low">🟢 {counts.low} low</div>}
            </div>
            <GitHubPostButton result={result} onPost={handlePostToGitHub} />
          </div>

          {result.issues?.length > 0 ? (
            <div className="issues-list" style={{ marginTop: 16 }}>
              {result.issues.map((issue, idx) => (
                <IssueCard key={idx} issue={issue} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <div className="no-results-icon">🎉</div>
              No issues found — the PR looks great!
            </div>
          )}

          <RawJson data={result} />
        </>
      )}

      {/* ── Review History ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <ReviewHistory key={refreshKey} projectId={project.id} />
      </div>
    </div>
  );
}
