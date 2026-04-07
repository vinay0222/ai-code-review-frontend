/** Skeleton loaders used while data is being fetched. */

/** Single project item skeleton for sidebar */
export function SidebarProjectSkeleton() {
  return (
    <div className="skeleton-item">
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-lines">
        <div className="skeleton skeleton-line" style={{ width: '75%' }} />
        <div className="skeleton skeleton-line-sm" />
      </div>
    </div>
  );
}

/** Full-page content skeleton for main area */
export function ContentSkeleton() {
  return (
    <div style={{ padding: '26px 32px' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div className="skeleton skeleton-title" style={{ height: 22, width: 220, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: 160 }} />
      </div>
      {/* Card skeletons */}
      {[1, 2].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-body" />
          <div className="skeleton skeleton-body" />
          <div className="skeleton skeleton-body-sm" />
        </div>
      ))}
    </div>
  );
}
