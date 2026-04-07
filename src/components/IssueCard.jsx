const SEVERITY_EMOJI = { high: '🔴', medium: '🟡', low: '🟢' };

const CATEGORY_LABELS = {
  logical_error:    { label: 'Logical Error',    icon: '⚙️' },
  return_value:     { label: 'Return Value',     icon: '↩️' },
  unused_variable:  { label: 'Unused Variable',  icon: '🗑️' },
  naming_mismatch:  { label: 'Naming Mismatch',  icon: '🏷️' },
  edge_case:        { label: 'Edge Case',         icon: '⚠️' },
  code_quality:     { label: 'Code Quality',      icon: '🔧' },
  security:         { label: 'Security',          icon: '🔒' },
  performance:      { label: 'Performance',       icon: '⚡' },
};

export default function IssueCard({ issue }) {
  const { file, line, severity, category, issue: text, suggestion } = issue;
  const sev = (severity || 'low').toLowerCase();
  const cat = CATEGORY_LABELS[category] || CATEGORY_LABELS.code_quality;

  return (
    <div className={`issue-card ${sev}`}>
      <div className="issue-card-header">
        <div className="issue-meta">
          <span className="issue-category-badge">
            {cat.icon} {cat.label}
          </span>
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
