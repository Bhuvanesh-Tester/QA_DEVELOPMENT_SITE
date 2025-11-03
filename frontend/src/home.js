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
  const [activeMenu, setActiveMenu] = useState("dashboard"); // Changed to dashboard
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [stats, setStats] = useState({
    total_users: 0,
    total_submissions: 0,
    active_users: 0,
    pending: 0
  });

  // Dynamic API URL
  const API_BASE_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:8003"
      : "https://qa-development-site.onrender.com";

  // Fetch dashboard stats on component mount
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard-stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, [API_BASE_URL]);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      const fileName = file.name.toLowerCase();
      const isValidType = validTypes.includes(file.type) || 
                         fileName.endsWith('.csv') || 
                         fileName.endsWith('.xlsx') || 
                         fileName.endsWith('.xls');
      
      if (!isValidType) {
        showToast("Please upload a valid Excel or CSV file", "error");
        e.target.value = null;
        return;
      }
      
      setSelectedFile(file);
      showToast(`File "${file.name}" selected`, "info");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showToast("Please select a file first", "error");
      return;
    }

    setUploadLoading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/upload-excel`, {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      showToast(result.message || "File uploaded successfully! ✅", "success");
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = null;
      
    } catch (error) {
      showToast(`Upload error: ${error.message}`, "error");
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadSampleExcel = () => {
    // Create sample data with headers
    const sampleData = [
      ['name', 'age', 'phone', 'address', 'email'],
      ['John Doe', 25, '+1234567890', '123 Main St, New York', 'john.doe@example.com'],
      ['Jane Smith', 30, '+0987654321', '456 Oak Ave, Los Angeles', 'jane.smith@example.com'],
      ['Bob Wilson', 35, '+1122334455', '789 Pine Rd, San Francisco', 'bob.wilson@example.com'],
      ['Alice Brown', 28, '+2233445566', '321 Elm St, Chicago', 'alice.brown@example.com'],
      ['Charlie Davis', 32, '+3344556677', '654 Maple Dr, Seattle', 'charlie.davis@example.com']
    ];
    
    // Convert to CSV format
    const csvContent = sampleData.map(row => {
      return row.map(cell => {
        // Handle cells with commas by wrapping in quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',');
    }).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_upload_sample_template.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToast("Sample template downloaded! Fill it and upload 📥", "success");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validate form
    if (!formData.name || !formData.age || !formData.phone || !formData.address) {
      setMessage("Please fill in all fields.");
      showToast("Please fill in all fields", "error");
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
      showToast("Form submitted successfully! ✅", "success");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      showToast(`Error: ${error.message}`, "error");
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
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Registered Users</h3>
                  <p className="stat-number">{stats.total_users}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Total Form Submissions</h3>
                  <p className="stat-number">{stats.total_submissions}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Active Users</h3>
                  <p className="stat-number">{stats.active_users}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>Pending Submissions</h3>
                  <p className="stat-number">{stats.pending}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case "form":
        return (
          <div className="form-content">
            <h2>Submit Your Information</h2>
            
            {/* Manual Form Entry Section */}
            <div className="form-section">
              <h3 className="section-title">📝 Manual Entry</h3>
              <form className="modern-form" onSubmit={handleSubmit}>
                <div className="form-row">
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
                </div>
                <div className="form-row">
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
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Form"}
                </button>
              </form>
              {message && <div className="form-message">{message}</div>}
            </div>

            {/* File Upload Section */}
            <div className="form-section file-upload-section">
              <h3 className="section-title">📊 Bulk Upload (Excel/CSV)</h3>
              <div className="upload-container">
                <button onClick={downloadSampleExcel} className="download-sample-btn">
                  📥 Download Sample Excel Template
                </button>
                <div className="upload-area">
                  <div className="upload-icon">📤</div>
                  <p className="upload-text">
                    {selectedFile ? selectedFile.name : "Click to select Excel or CSV file"}
                  </p>
                  <input 
                    type="file" 
                    id="file-upload"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-label">
                    Choose File
                  </label>
                </div>
                <button 
                  onClick={handleFileUpload} 
                  className="upload-btn"
                  disabled={!selectedFile || uploadLoading}
                >
                  {uploadLoading ? "Uploading..." : "Upload File"}
                </button>
                <p className="upload-hint">
                  Supported formats: .xlsx, .xls, .csv | Max size: 10MB
                </p>
              </div>
            </div>
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

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

export default Home;