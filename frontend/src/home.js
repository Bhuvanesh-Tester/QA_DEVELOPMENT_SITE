import React, { useState } from "react";
import './home.css';

function Home({ email, onLogout }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState("form");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dynamic API URL
  const API_BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:8003"
      : "https://qa-development-site.onrender.com";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate form
    if (!formData.name || !formData.age || !formData.phone || !formData.address) {
      setMessage("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Submission failed: ${response.status}`);
      }

      setMessage("Form submitted successfully! ✅");
      setFormData({ name: "", age: "", phone: "", address: "" });
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return (
          <div className="dashboard-content">
            <h2>Dashboard Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Total Submissions</h3>
                  <p className="stat-number">24</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Active Users</h3>
                  <p className="stat-number">12</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Completed</h3>
                  <p className="stat-number">18</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>Pending</h3>
                  <p className="stat-number">6</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "form":
        return (
          <div className="form-content">
            <h2>Submit Your Information</h2>
            <form className="modern-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Enter your full name" 
                  value={formData.name} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input 
                  type="number" 
                  name="age" 
                  placeholder="Enter your age" 
                  value={formData.age} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="text" 
                  name="phone" 
                  placeholder="Enter your phone number" 
                  value={formData.phone} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  name="address" 
                  placeholder="Enter your address" 
                  value={formData.address} 
                  onChange={handleChange} 
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Submitting..." : "Submit Form"}
              </button>
            </form>
            {message && <div className="form-message">{message}</div>}
          </div>
        );
      case "analytics":
        return (
          <div className="analytics-content">
            <h2>Analytics</h2>
            <p className="coming-soon">Analytics dashboard coming soon...</p>
          </div>
        );
      case "settings":
        return (
          <div className="settings-content">
            <h2>Settings</h2>
            <p className="coming-soon">Settings panel coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <button 
            className="menu-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="app-title">My Dashboard</h1>
        </div>
        <div className="navbar-right">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-email">{email}</span>
          </div>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-menu">
            <div 
              className={`menu-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveMenu('dashboard')}
            >
              <span className="menu-icon">📊</span>
              <span className="menu-text">Dashboard</span>
            </div>
            <div 
              className={`menu-item ${activeMenu === 'form' ? 'active' : ''}`}
              onClick={() => setActiveMenu('form')}
            >
              <span className="menu-icon">📝</span>
              <span className="menu-text">Submit Form</span>
            </div>
            <div 
              className={`menu-item ${activeMenu === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveMenu('analytics')}
            >
              <span className="menu-icon">📈</span>
              <span className="menu-text">Analytics</span>
            </div>
            <div 
              className={`menu-item ${activeMenu === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveMenu('settings')}
            >
              <span className="menu-icon">⚙️</span>
              <span className="menu-text">Settings</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default Home;