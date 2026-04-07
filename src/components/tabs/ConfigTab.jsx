import { useState } from 'react';

const CHECK_OPTIONS = [
  { key: 'check_edge_cases',     label: 'Edge Cases',     desc: 'Boundary conditions, null checks, empty states',          icon: '⚡' },
  { key: 'check_code_structure', label: 'Code Structure', desc: 'Architecture, naming, organisation',                       icon: '🏗️' },
  { key: 'check_performance',    label: 'Performance',    desc: 'Bottlenecks, inefficient algorithms, N+1 queries',         icon: '🚀' },
  { key: 'check_security',       label: 'Security',       desc: 'Vulnerabilities, injection, auth issues',                  icon: '🔒' },
  { key: 'check_best_practices', label: 'Best Practices', desc: 'Code quality, DRY, SOLID principles',                     icon: '✨' },
  { key: 'check_unit_tests',     label: 'Unit Tests',     desc: 'Missing coverage, untested edge cases',                   icon: '🧪' },
];

const STRICTNESS_OPTIONS = [
  { value: 'low',    label: 'Low',    desc: 'Critical issues only' },
  { value: 'medium', label: 'Medium', desc: 'Balanced feedback (recommended)' },
  { value: 'high',   label: 'High',   desc: 'Exhaustive, comprehensive review' },
];

const DEFAULT_CONFIG = {
  strict_mode:          false,
  check_edge_cases:     true,
  check_code_structure: true,
  check_performance:    false,
  check_security:       true,
  check_best_practices: true,
  check_unit_tests:     false,
  strictness:           'medium',
};

export default function ConfigTab({ project, onUpdate }) {
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG, ...project.review_config });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [dirty,  setDirty]  = useState(false);

  const update = (patch) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setSaved(false);
  };

  const toggle        = (key)   => update({ [key]: !config[key] });
  const setStrictness = (value) => update({ strictness: value });

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
      {/* ── Review Mode ─────────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">🎯</span> Review Mode
          </div>
        </div>

        <div className="strict-mode-toggle-wrap">
          <div
            className={`strict-mode-toggle${config.strict_mode ? ' active' : ''}`}
            onClick={() => toggle('strict_mode')}
            role="switch"
            aria-checked={config.strict_mode}
            tabIndex={0}
            onKeyDown={(e) => e.key === ' ' && toggle('strict_mode')}
          >
            <div className="smt-left">
              <div className="smt-icon">{config.strict_mode ? '🔍' : '🤖'}</div>
              <div className="smt-text">
                <div className="smt-label">
                  {config.strict_mode ? 'Strict Mode' : 'Standard Mode'}
                  <span className={`smt-badge${config.strict_mode ? ' strict' : ' standard'}`}>
                    {config.strict_mode ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="smt-desc">
                  {config.strict_mode
                    ? 'Enforces 6-point analysis: logical errors, return values, unused variables, naming mismatches, edge cases, and code quality. Never skips issues.'
                    : 'Balanced expert review. Focuses on meaningful issues without being overly prescriptive.'}
                </div>
              </div>
            </div>
            <div className={`smt-switch${config.strict_mode ? ' on' : ''}`}>
              <div className="smt-knob" />
            </div>
          </div>

          {config.strict_mode && (
            <div className="strict-mode-hint">
              <span>ℹ️</span>
              <span>Strict mode checks: logical errors · return values · unused variables · naming mismatches · edge cases · security · performance · code quality · test coverage (based on enabled checks below)</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Review Checks ───────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">✅</span> Review Checks
          </div>
          <span className="card-header-sub">
            These apply in both modes — strict mode additionally enforces logical errors, return values, and naming mismatches regardless of these settings.
          </span>
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

        {/* ── Strictness ──────────────────────────────────────────────────── */}
        <div className="card-header" style={{ marginBottom: 12 }}>
          <div className="card-title">
            <span className="card-title-icon">🎚️</span> Review Strictness
          </div>
        </div>

        <div className="strictness-grid">
          {STRICTNESS_OPTIONS.map(({ value, label, desc }) => (
            <div
              key={value}
              className={`strictness-option${config.strictness === value ? ' selected' : ''}`}
              onClick={() => setStrictness(value)}
            >
              <div className="strictness-dot" />
              <div>
                <div className="strictness-label">{label}</div>
                <div className="strictness-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="strictness-note">
          {config.strictness === 'low'    && '⚡ Low — only critical issues that break functionality or introduce security holes are surfaced.'}
          {config.strictness === 'medium' && '⚖️ Medium — all high and medium severity issues are included; low issues only when part of a pattern.'}
          {config.strictness === 'high'   && '🔬 High — exhaustive analysis, every issue including minor style and naming surfaced.'}
        </div>

        <div className="save-bar">
          <span className="save-bar-hint">
            Configuration applies to all future reviews — manual and auto (GitHub Action).
          </span>
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
