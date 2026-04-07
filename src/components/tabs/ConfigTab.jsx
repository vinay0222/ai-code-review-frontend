import { useState } from 'react';

const CHECK_OPTIONS = [
  {
    key: 'check_edge_cases',
    label: 'Edge Cases',
    desc: 'Boundary conditions, null checks, empty states',
    icon: '⚡',
  },
  {
    key: 'check_code_structure',
    label: 'Code Structure',
    desc: 'Architecture, naming, organisation',
    icon: '🏗️',
  },
  {
    key: 'check_performance',
    label: 'Performance',
    desc: 'Bottlenecks, inefficient algorithms, N+1 queries',
    icon: '🚀',
  },
  {
    key: 'check_security',
    label: 'Security',
    desc: 'Vulnerabilities, injection, auth issues',
    icon: '🔒',
  },
  {
    key: 'check_best_practices',
    label: 'Best Practices',
    desc: 'Code quality, DRY, SOLID principles',
    icon: '✨',
  },
  {
    key: 'check_unit_tests',
    label: 'Unit Tests',
    desc: 'Missing coverage, untested edge cases',
    icon: '🧪',
  },
];

const STRICTNESS_OPTIONS = [
  { value: 'low',    label: 'Low',    desc: 'Critical issues only' },
  { value: 'medium', label: 'Medium', desc: 'Balanced feedback (recommended)' },
  { value: 'high',   label: 'High',   desc: 'Exhaustive, comprehensive review' },
];

export default function ConfigTab({ project, onUpdate }) {
  const [config, setConfig] = useState({
    check_edge_cases:     true,
    check_code_structure: true,
    check_performance:    false,
    check_security:       true,
    check_best_practices: true,
    check_unit_tests:     false,
    strictness:           'medium',
    ...project.review_config,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const toggle = (key) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
    setSaved(false);
  };

  const setStrictness = (value) => {
    setConfig((prev) => ({ ...prev, strictness: value }));
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({ review_config: config });
    setSaving(false);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">✅</span> Review Checks
          </div>
        </div>

        <div className="config-grid">
          {CHECK_OPTIONS.map(({ key, label, desc, icon }) => (
            <div
              key={key}
              className={`config-item${config[key] ? ' checked' : ''}`}
              onClick={() => toggle(key)}
            >
              <input
                type="checkbox"
                id={key}
                checked={!!config[key]}
                onChange={() => toggle(key)}
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <div className="config-item-label">{icon} {label}</div>
                <div className="config-item-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div className="card-header" style={{ marginBottom: 12 }}>
          <div className="card-title">
            <span className="card-title-icon">🎚️</span> Review Strictness
          </div>
        </div>

        <div className="config-strictness-row">
          <label>Strictness</label>
          <select
            value={config.strictness}
            onChange={(e) => setStrictness(e.target.value)}
          >
            {STRICTNESS_OPTIONS.map(({ value, label, desc }) => (
              <option key={value} value={value}>{label} — {desc}</option>
            ))}
          </select>
          <span className="config-strictness-desc">
            Controls how deeply the AI analyses the code and how many issues it surfaces.
          </span>
        </div>

        <div className="save-bar">
          <span className="save-bar-hint">Configuration is applied to all future reviews.</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Config'}
          </button>
        </div>
      </div>
    </div>
  );
}
