export default function Spinner({ label = 'Running AI review…' }) {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <div className="spinner-label">{label}</div>
    </div>
  );
}
