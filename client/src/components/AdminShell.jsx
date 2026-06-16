import AdminNavMenu from "./AdminNavMenu";

function AdminShell({ title, eyebrow = "Trainer Panel", children }) {
  return (
    <div className="admin-mobile-shell">
      <header className="admin-mobile-header admin-header-row-left">
        <AdminNavMenu />

        <div>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
        </div>
      </header>

      <main className="admin-mobile-content">{children}</main>
    </div>
  );
}

export default AdminShell;
