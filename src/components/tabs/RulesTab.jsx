import { useState } from 'react';

export default function RulesTab({ project, onUpdate }) {
  const [rules, setRules] = useState(project.rules || []);
  const [newRule, setNewRule] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = (nextRules) => {
    setRules(nextRules);
    setDirty(true);
    setSaved(false);
  };

  const addRule = () => {
    const trimmed = newRule.trim();
    if (!trimmed) return;
    markDirty([...rules, trimmed]);
    setNewRule('');
  };

  const updateRule = (idx, value) => {
    const next = [...rules];
    next[idx] = value;
    markDirty(next);
  };

  const deleteRule = (idx) => {
    markDirty(rules.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addRule(); }
  };

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({ rules });
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
            <span className="card-title-icon">📏</span>
            Coding Rules
            {rules.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>
                ({rules.length})
              </span>
            )}
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="rules-empty">
            No rules yet. Add rules below — they'll be included in every AI review.
          </div>
        ) : (
          rules.map((rule, idx) => (
            <div key={idx} className="rule-item">
              <span className="rule-number">{idx + 1}.</span>
              <input
                type="text"
                value={rule}
                onChange={(e) => updateRule(idx, e.target.value)}
                placeholder="Rule description"
              />
              <button
                className="btn btn-danger btn-sm"
                onClick={() => deleteRule(idx)}
                title="Remove rule"
              >
                ✕
              </button>
            </div>
          ))
        )}

        <div className="rules-add-row">
          <input
            type="text"
            placeholder="e.g. Always handle errors explicitly, no empty catch blocks"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="btn btn-secondary"
            onClick={addRule}
            disabled={!newRule.trim()}
          >
            ＋ Add
          </button>
        </div>

        <div className="save-bar">
          <span className="save-bar-hint">
            Rules are enforced on every review for this project.
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Rules'}
          </button>
        </div>
      </div>
    </div>
  );
}
