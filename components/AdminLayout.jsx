"use client";

import AdminNavMenu from "./AdminNavMenu";

function AdminLayout({ title, description, actions, children }) {
  return (
    <div className="admin-app admin-mobile-shell admin-layout-shell">
      <header className="admin-mobile-header admin-layout-header">
        <div className="admin-layout-left">
          <AdminNavMenu />

          <div className="admin-layout-title">
            <p>Trainer Panel</p>
            <h1>{title}</h1>
            {description && <span>{description}</span>}
          </div>
        </div>

        {actions && <div className="admin-layout-actions">{actions}</div>}
      </header>

      <main className="admin-layout-content">{children}</main>
    </div>
  );
}

export default AdminLayout;
