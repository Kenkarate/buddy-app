"use client";

function PageLoader() {
  return (
    <div className="page-loading-fallback" aria-hidden="true">
      <div className="page-loading-spinner" />
    </div>
  );
}

export default PageLoader;
