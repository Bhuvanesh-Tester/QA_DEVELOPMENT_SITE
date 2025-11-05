import React, { useEffect, useMemo, useState } from "react";
import "./home.css";

/**
 * Admin dashboard with:
 * - User Management (server-backed via your FastAPI endpoints)
 * - Compliance Audits (client-side for now: localStorage persistence)
 * - Submit Form & File Upload (unchanged)
 *
 * NOTE: Only Admin sees User Management. Everyone sees Compliance Audits tab.
 */
function Home({ user, onLogout }) {
  // ---------- GLOBAL ----------
  const API_BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:8003"
      : "https://qa-development-site.onrender.com";

  const isAdmin = user?.role === "Admin";

  const [activeMenu, setActiveMenu] = useState(isAdmin ? "users" : "audits");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 2800);
  };

  // ---------- USER MANAGEMENT (server-backed) ----------
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "QA/QC",
    department: "",
  });
  const [editingUser, setEditingUser] = useState(null);
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q) ||
        (u.department || "").toLowerCase().includes(q) ||
        (u.status || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users?admin_id=${user.id}`);
      if (!res.ok) throw new Error((await res.json()).detail || "Failed to load users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
      showToast(e.message, "error");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/users/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newUser, admin_id: user.id }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Create failed");
      setShowCreateUser(false);
      setNewUser({ name: "", email: "", password: "", role: "QA/QC", department: "" });
      showToast("User created successfully", "success");
      fetchUsers();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleOpenEditUser = (row) => {
    setEditingUser({
      id: row.id,
      name: row.name || "",
      role: row.role || "QA/QC",
      department: row.department || "",
      status: row.status || "active",
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingUser, admin_id: user.id }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Update failed");
      setShowEditUser(false);
      setEditingUser(null);
      showToast("User updated", "success");
      fetchUsers();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleDeleteUser = async (row) => {
    const ok = window.confirm(`Delete user "${row.name}"?`);
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE_URL}/users/${row.id}?admin_id=${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Delete failed");
      showToast("User deleted", "success");
      fetchUsers();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // ---------- COMPLIANCE AUDITS (client-side table) ----------
  // Your requested headers (strict order)
  const CONTROL_HEADERS = [
    "S.No",
    "ID",
    "Analyze Comments",
    "Responsible Team",
    "Control Domain",
    "Requirement",
    "Description",
    "ISO 27001",
    "NIST CSF",
    "SOC 2",
    "GDPR",
    "IT Act 2000",
    "PCI DSS",
    "HIPAA",
    "Priority",
    "Status",
    "Comments",
    "Plan",
    "Do",
    "Check",
    "Act",
  ];

  const LS_KEY = "admin_controls_v1";
  const [controls, setControls] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [searchControls, setSearchControls] = useState("");
  const [showCreateControl, setShowCreateControl] = useState(false);
  const [showEditControl, setShowEditControl] = useState(false);
  const [controlDraft, setControlDraft] = useState(null); // used for both create & edit

  useEffect(() => {
    if (isAdmin) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(controls));
  }, [controls]);

  const blankControl = {
    id: Date.now(),
    analyze_comments: "",
    responsible_team: "",
    control_domain: "",
    requirement: "",
    description: "",
    iso27001: "",
    nist_csf: "",
    soc2: "",
    gdpr: "",
    it_act_2000: "",
    pci_dss: "",
    hipaa: "",
    priority: "Medium",
    status: "pending",
    comments: "",
    plan: "",
    do: "",
    check: "",
    act: "",
  };

  const filteredControls = useMemo(() => {
    const q = searchControls.trim().toLowerCase();
    if (!q) return controls;
    return controls.filter((c) =>
      [
        c.analyze_comments,
        c.responsible_team,
        c.control_domain,
        c.requirement,
        c.description,
        c.iso27001,
        c.nist_csf,
        c.soc2,
        c.gdpr,
        c.it_act_2000,
        c.pci_dss,
        c.hipaa,
        c.priority,
        c.status,
        c.comments,
        c.plan,
        c.do,
        c.check,
        c.act,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [controls, searchControls]);

  const openCreateControl = () => {
    setControlDraft({ ...blankControl, id: Date.now() });
    setShowCreateControl(true);
  };

  const saveCreateControl = (e) => {
    e.preventDefault();
    setControls((prev) => [{ ...controlDraft }, ...prev]);
    setShowCreateControl(false);
    setControlDraft(null);
    showToast("Control created", "success");
  };

  const openEditControl = (row) => {
    setControlDraft({ ...row });
    setShowEditControl(true);
  };

  const saveEditControl = (e) => {
    e.preventDefault();
    setControls((prev) => prev.map((r) => (r.id === controlDraft.id ? controlDraft : r)));
    setShowEditControl(false);
    setControlDraft(null);
    showToast("Control updated", "success");
  };

  const deleteControl = (row) => {
    const ok = window.confirm("Delete this control?");
    if (!ok) return;
    setControls((prev) => prev.filter((r) => r.id !== row.id));
    showToast("Control deleted", "success");
  };

  // ---------- FORM/UPLOAD (unchanged minimal to keep file short) ----------
  const [formData, setFormData] = useState({ name: "", age: "", phone: "", address: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const { name, age, phone, address } = formData;
    if (!name || !age || !phone || !address) {
      setMessage("Please fill in all fields.");
      showToast("Please fill in all fields", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, email: user.email }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || "Submission failed");
      setFormData({ name: "", age: "", phone: "", address: "" });
      setMessage("Form submitted successfully!");
      showToast("Form submitted successfully!", "success");
    } catch (e) {
      setMessage(`Error: ${e.message}`);
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ok =
      f.name.toLowerCase().endsWith(".csv") ||
      f.name.toLowerCase().endsWith(".xlsx") ||
      f.name.toLowerCase().endsWith(".xls");
    if (!ok) {
      showToast("Please upload Excel or CSV file", "error");
      e.target.value = null;
      return;
    }
    setSelectedFile(f);
    showToast(`File "${f.name}" selected`, "info");
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showToast("Please select a file first", "error");
      return;
    }
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const res = await fetch(`${API_BASE_URL}/upload-excel`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).detail || "Upload failed");
      const data = await res.json();
      showToast(data.message || "File uploaded", "success");
      setSelectedFile(null);
      const input = document.getElementById("file-upload");
      if (input) input.value = null;
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadSampleExcel = () => {
    const rows = [
      ["name", "age", "phone", "address", "email"],
      ["John Doe", 25, "+1234567890", "123 Main St", "john@example.com"],
      ["Jane Smith", 30, "+0987654321", "456 Oak Ave", "jane@example.com"],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Sample template downloaded", "success");
  };

  // ---------- UI ----------
  const renderUsers = () => (
    <div className="panel">
      <div className="panel-header">
        <h2>User Management</h2>
        <div className="header-actions">
          <input
            className="search"
            placeholder="Search by name, email, role, department, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn primary" onClick={() => setShowCreateUser(true)}>
            ➕ Create User
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="nice-table">
          <thead>
            <tr>
              <th style={{ width: 220 }}>Name</th>
              <th style={{ width: 260 }}>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th style={{ width: 180, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td className="muted">{u.email}</td>
                <td>
                  <span className={`pill role ${String(u.role || "").toLowerCase()}`}>{u.role}</span>
                </td>
                <td>{u.department || "—"}</td>
                <td>
                  <span className={`pill status ${u.status}`}>{u.status}</span>
                </td>
                <td className="row-actions">
                  <button className="btn small" onClick={() => handleOpenEditUser(u)}>
                    ✏️ Edit
                  </button>
                  <button className="btn small danger" onClick={() => handleDeleteUser(u)}>
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <Modal title="Create User" onClose={() => setShowCreateUser(false)}>
          <form onSubmit={handleCreateUser} className="form-grid">
            <Input label="Full Name" value={newUser.name} onChange={(v) => setNewUser({ ...newUser, name: v })} />
            <Input label="Email" type="email" value={newUser.email} onChange={(v) => setNewUser({ ...newUser, email: v })} />
            <Input
              label="Password"
              type="password"
              value={newUser.password}
              onChange={(v) => setNewUser({ ...newUser, password: v })}
            />
            <Select
              label="Role"
              value={newUser.role}
              onChange={(v) => setNewUser({ ...newUser, role: v })}
              options={["QA/QC", "Supervisor", "Admin"]}
            />
            <Input
              label="Department"
              value={newUser.department}
              onChange={(v) => setNewUser({ ...newUser, department: v })}
            />
            <div className="modal-actions">
              <button className="btn primary" type="submit">
                Save
              </button>
              <button className="btn ghost" type="button" onClick={() => setShowCreateUser(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <Modal title="Edit User" onClose={() => setShowEditUser(false)}>
          <form onSubmit={handleUpdateUser} className="form-grid">
            <Input
              label="Full Name"
              value={editingUser.name}
              onChange={(v) => setEditingUser((p) => ({ ...p, name: v }))}
            />
            <Select
              label="Role"
              value={editingUser.role}
              onChange={(v) => setEditingUser((p) => ({ ...p, role: v }))}
              options={["QA/QC", "Supervisor", "Admin"]}
            />
            <Input
              label="Department"
              value={editingUser.department}
              onChange={(v) => setEditingUser((p) => ({ ...p, department: v }))}
            />
            <Select
              label="Status"
              value={editingUser.status}
              onChange={(v) => setEditingUser((p) => ({ ...p, status: v }))}
              options={["active", "inactive"]}
            />
            <div className="modal-actions">
              <button className="btn primary" type="submit">
                Update
              </button>
              <button className="btn ghost" type="button" onClick={() => setShowEditUser(false)}>
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );

  const renderAudits = () => (
    <div className="panel">
      <div className="panel-header">
        <h2>Compliance Audits</h2>
        <div className="header-actions">
          <input
            className="search"
            placeholder="Search controls..."
            value={searchControls}
            onChange={(e) => setSearchControls(e.target.value)}
          />
          <button className="btn primary" onClick={openCreateControl}>
            ➕ Create Control
          </button>
        </div>
      </div>

      <div className="table-wrap scroll-x">
        <table className="nice-table very-wide">
          <thead>
            <tr>
              {CONTROL_HEADERS.map((h) => (
                <th key={h}>{h}</th>
              ))}
              <th style={{ width: 160, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredControls.map((row, idx) => (
              <tr key={row.id}>
                <td>{idx + 1}</td>
                <td className="muted">{row.id}</td>
                <td>{row.analyze_comments}</td>
                <td>{row.responsible_team}</td>
                <td>{row.control_domain}</td>
                <td>{row.requirement}</td>
                <td className="wrap">{row.description}</td>
                <td>{row.iso27001}</td>
                <td>{row.nist_csf}</td>
                <td>{row.soc2}</td>
                <td>{row.gdpr}</td>
                <td>{row.it_act_2000}</td>
                <td>{row.pci_dss}</td>
                <td>{row.hipaa}</td>
                <td>
                  <span className={`pill prio ${String(row.priority).toLowerCase()}`}>{row.priority}</span>
                </td>
                <td>
                  <span className={`pill status ${String(row.status).toLowerCase()}`}>{row.status}</span>
                </td>
                <td className="wrap">{row.comments}</td>
                <td>{row.plan}</td>
                <td>{row.do}</td>
                <td>{row.check}</td>
                <td>{row.act}</td>
                <td className="row-actions">
                  <button className="btn small" onClick={() => openEditControl(row)}>
                    ✏️ Edit
                  </button>
                  <button className="btn small danger" onClick={() => deleteControl(row)}>
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredControls.length === 0 && (
              <tr>
                <td className="empty" colSpan={CONTROL_HEADERS.length + 1}>
                  No records yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Control Modal */}
      {showCreateControl && controlDraft && (
        <ControlModal
          title="Create Control"
          draft={controlDraft}
          setDraft={setControlDraft}
          onCancel={() => {
            setShowCreateControl(false);
            setControlDraft(null);
          }}
          onSubmit={saveCreateControl}
        />
      )}

      {/* Edit Control Modal */}
      {showEditControl && controlDraft && (
        <ControlModal
          title="Edit Control"
          draft={controlDraft}
          setDraft={setControlDraft}
          onCancel={() => {
            setShowEditControl(false);
            setControlDraft(null);
          }}
          onSubmit={saveEditControl}
        />
      )}
    </div>
  );

  const renderForm = () => (
    <div className="panel">
      <h2>Submit Information</h2>
      <div className="form-section">
        <form className="modern-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <Input label="Full Name" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />
            <Input label="Age" type="number" value={formData.age} onChange={(v) => setFormData({ ...formData, age: v })} />
          </div>
          <div className="form-row">
            <Input label="Phone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
            <Input label="Address" value={formData.address} onChange={(v) => setFormData({ ...formData, address: v })} />
          </div>
          <button type="submit" className="btn primary block" disabled={loading}>
            {loading ? "Submitting..." : "Submit Form"}
          </button>
        </form>
        {message && <div className="form-message">{message}</div>}
      </div>

      <div className="form-section">
        <div className="upload-container">
          <button onClick={downloadSampleExcel} className="btn info block">
            📥 Download Sample Template
          </button>

          <div className="upload-area">
            <div className="upload-icon">📤</div>
            <p className="upload-text">{selectedFile ? selectedFile.name : "Click to select file"}</p>
            <input id="file-upload" type="file" className="file-input" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
            <label htmlFor="file-upload" className="file-label">
              Choose File
            </label>
          </div>

          <button className="btn success block" onClick={handleFileUpload} disabled={!selectedFile || uploadLoading}>
            {uploadLoading ? "Uploading..." : "Upload File"}
          </button>
          <p className="upload-hint">Supported: .xlsx, .xls, .csv</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Topbar */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen((v) => !v)}>
            ☰
          </button>
          <h1 className="app-title">Compliance System</h1>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-email">{user.name}</span>
            <span className="user-role">({user.role})</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-menu">
            {isAdmin && (
              <div
                className={`menu-item ${activeMenu === "users" ? "active" : ""}`}
                onClick={() => setActiveMenu("users")}
              >
                <span className="menu-icon">👥</span>
                <span className="menu-text">User Management</span>
              </div>
            )}
            <div
              className={`menu-item ${activeMenu === "audits" ? "active" : ""}`}
              onClick={() => setActiveMenu("audits")}
            >
              <span className="menu-icon">📋</span>
              <span className="menu-text">Compliance Audits</span>
            </div>
            <div
              className={`menu-item ${activeMenu === "form" ? "active" : ""}`}
              onClick={() => setActiveMenu("form")}
            >
              <span className="menu-icon">📝</span>
              <span className="menu-text">Submit Form</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="main-content">
          {activeMenu === "users" && isAdmin && renderUsers()}
          {activeMenu === "audits" && renderAudits()}
          {activeMenu === "form" && renderForm()}
        </main>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" && "✅"}
            {toast.type === "error" && "❌"}
            {toast.type === "info" && "ℹ️"}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Small, reusable inputs / modal ---------- */

function Input({ label, value, onChange, type = "text", textarea = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options = [] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} title="Close">
            ✖
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ControlModal({ title, draft, setDraft, onCancel, onSubmit }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <form onSubmit={onSubmit} className="form-grid two-col">
        <Input label="Analyze Comments" value={draft.analyze_comments} onChange={(v) => setDraft({ ...draft, analyze_comments: v })} />
        <Input label="Responsible Team" value={draft.responsible_team} onChange={(v) => setDraft({ ...draft, responsible_team: v })} />
        <Input label="Control Domain" value={draft.control_domain} onChange={(v) => setDraft({ ...draft, control_domain: v })} />
        <Input label="Requirement" value={draft.requirement} onChange={(v) => setDraft({ ...draft, requirement: v })} />
        <Input label="Description" textarea value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />

        <Input label="ISO 27001" value={draft.iso27001} onChange={(v) => setDraft({ ...draft, iso27001: v })} />
        <Input label="NIST CSF" value={draft.nist_csf} onChange={(v) => setDraft({ ...draft, nist_csf: v })} />
        <Input label="SOC 2" value={draft.soc2} onChange={(v) => setDraft({ ...draft, soc2: v })} />
        <Input label="GDPR" value={draft.gdpr} onChange={(v) => setDraft({ ...draft, gdpr: v })} />
        <Input label="IT Act 2000" value={draft.it_act_2000} onChange={(v) => setDraft({ ...draft, it_act_2000: v })} />
        <Input label="PCI DSS" value={draft.pci_dss} onChange={(v) => setDraft({ ...draft, pci_dss: v })} />
        <Input label="HIPAA" value={draft.hipaa} onChange={(v) => setDraft({ ...draft, hipaa: v })} />

        <Select
          label="Priority"
          value={draft.priority}
          onChange={(v) => setDraft({ ...draft, priority: v })}
          options={["Low", "Medium", "High", "Critical"]}
        />
        <Select
          label="Status"
          value={draft.status}
          onChange={(v) => setDraft({ ...draft, status: v })}
          options={["pending", "in_progress", "pass", "fail", "cancelled"]}
        />

        <Input label="Comments" textarea value={draft.comments} onChange={(v) => setDraft({ ...draft, comments: v })} />
        <Input label="Plan" value={draft.plan} onChange={(v) => setDraft({ ...draft, plan: v })} />
        <Input label="Do" value={draft.do} onChange={(v) => setDraft({ ...draft, do: v })} />
        <Input label="Check" value={draft.check} onChange={(v) => setDraft({ ...draft, check: v })} />
        <Input label="Act" value={draft.act} onChange={(v) => setDraft({ ...draft, act: v })} />

        <div className="modal-actions">
          <button type="submit" className="btn primary">
            Save
          </button>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default Home;
