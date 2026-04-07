const SEVERITY_EMOJI = { high: '🔴', medium: '🟡', low: '🟢' };

export default function IssueCard({ issue }) {
  const { file, line, severity, issue: text, suggestion } = issue;
  const sev = (severity || 'low').toLowerCase();

  return (
    <div className={`issue-card ${sev}`}>
      <div className="issue-card-header">
        <div className="issue-meta">
          <span className="issue-file">{file || 'general'}</span>
          {line != null && <span className="issue-line">line {line}</span>}
        </div>
        <span className={`severity-badge ${sev}`}>
          {SEVERITY_EMOJI[sev]} {sev}
        </span>
      </div>

      <p className="issue-text">{text}</p>

      {suggestion && (
        <div className="issue-suggestion">
          <strong>💡 Suggestion: </strong>{suggestion}
        </div>
      )}
    </div>
  );
}
