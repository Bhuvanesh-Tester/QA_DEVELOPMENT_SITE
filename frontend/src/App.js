import React, { useState } from "react";

// --- Configuration ---
// API Configuration with better error handling and connection management
const RENDER_API_URL = "https://qa-development-site.onrender.com"; // Production URL
const LOCAL_API_URL = "http://127.0.0.1:10000"; // Development URL (matching backend port)

const API_BASE_URL = process.env.NODE_ENV === "production" ? RENDER_API_URL : LOCAL_API_URL;

// Default fetch options for all API calls
const defaultFetchOptions = {
  credentials: 'include',  // Important: This enables sending cookies
  headers: {
    'Content-Type': 'application/json',
  },
};

// Log the environment and API URL for debugging
console.log("🌍 Environment:", process.env.NODE_ENV);
console.log("🔗 API Base URL:", API_BASE_URL);

// Verify API connection on startup with proper options
fetch(`${API_BASE_URL}/`, {
  ...defaultFetchOptions,
  method: 'GET',
})
  .then(response => {
    console.log("🔄 Backend Response Status:", response.status);
    return response.json();
  })
  .then(data => console.log("✅ Backend connection verified:", data))
  .catch(error => {
    console.error("❌ Backend connection failed:", error);
    console.log("🔍 Check if backend is running and CORS is configured correctly");
  });

// -------------------------------------------------------------------------------------------------
// ---------- UTILITY: Fetch with Exponential Backoff and Retry (Ensures reliability) ----------
// -------------------------------------------------------------------------------------------------
const fetchWithRetry = async (url, options, retries = 5) => {
  // Add a small initial delay to help wake up Render free tier service
  await new Promise(resolve => setTimeout(resolve, 500)); 
  
  for (let i = 0; i < retries; i++) {
    console.log(`[NETWORK] Attempting to fetch URL: ${url}`);
    try {
      const response = await fetch(url, options);
      return response; 
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }

      const delay = Math.pow(2, i) * 1000; 
      console.warn(`[RETRY] Attempt ${i + 1}/${retries} failed. Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// -------------------------------------------------------------------------------------------------
// ---------- HOME PAGE (Form Submission) ----------
// -------------------------------------------------------------------------------------------------
function HomePage({ email, onLogout }) {
  const [personName, setPersonName] = useState("");
  const [personEmail] = useState(email || ""); // Email is set from login state
  const [personPhone, setPersonPhone] = useState("");
  const [personGender, setPersonGender] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!personName || !personEmail || !personPhone || !personGender) {
      setFormMsg("⚠️ All fields are required!");
      return;
    }

    setLoading(true);
    setFormMsg("Submitting...");

    try {
      // CORRECTED ENDPOINT: /submit-report
      const REPORT_ENDPOINT = `${API_BASE_URL}/submit-report`; 
      console.log("📡 Sending POST to:", REPORT_ENDPOINT); 
      
      const res = await fetchWithRetry(REPORT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        // Data payload must match the QaReportIn model fields in main.py
        body: JSON.stringify({
          // Using hardcoded values for the QA Report that don't come from the simple form
          project_name: "User Detail Collection", 
          test_case_id: "USER-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          status: "Pass", 
          // Combining user details into the 'notes' field
          notes: `Name: ${personName}, Phone: ${personPhone}, Gender: ${personGender}`, 
          tested_by: personEmail, // Using the logged-in user's email
        }),
      });

      console.log("📥 Form Response:", res);
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Unknown error during form submission");

      setFormMsg(data.message || "✅ Submitted successfully!");

      if ((data.message || "").toLowerCase().includes("success")) {
        setPersonName("");
        setPersonPhone("");
        setPersonGender("");
      }
    } catch (err) {
      console.error("❌ Error submitting form:", err);
      let errorMsg = String(err.message);
      if (errorMsg.includes('Failed to fetch')) {
        errorMsg = `Network Error: Could not reach backend. Please check your Render deployment status and ensure the URL (${API_BASE_URL}/submit-report) is correct.`;
      }
      setFormMsg("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAll = async () => {
    try {
      // CORRECTED ENDPOINT: /all-reports
      const res = await fetchWithRetry(`${API_BASE_URL}/all-reports`, { credentials: "include" }); 
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log("👥 All reports (from DB via API):", data.data);
      console.log(`Total reports found: ${data.data?.length || 0}`);
      
    } catch (err) {
      console.error("❌ Fetch All Error:", err);
      setFormMsg("❌ Error fetching reports: " + err.message);
    }
  };

  return (
    <div style={outerContainer}>
      <div style={formContainer}>
        <h2 style={{ textAlign: "center", marginBottom: 20, color: "#333" }}>
          Person Details Form
        </h2>

        <p style={{textAlign: 'center', color: '#5cb85c', fontWeight: 'bold', borderBottom: '2px solid #5cb85c', paddingBottom: 10}}>
          Welcome, {email}!
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Full Name</label>
          <input
            name="name"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Enter full name"
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Email (Logged in user)</label>
          <input
            name="email"
            type="email"
            value={personEmail}
            placeholder="Email address"
            style={{ ...inputStyle, background: "#f1f1f1" }}
            required
            readOnly // Locked to the logged-in user's email
          />

          <label style={labelStyle}>Phone Number</label>
          <input
            name="phone"
            value={personPhone}
            onChange={(e) => setPersonPhone(e.target.value)}
            placeholder="Phone number"
            style={inputStyle}
            required
          />

          <label style={labelStyle}>Gender</label>
          <select
            name="gender"
            value={personGender}
            onChange={(e) => setPersonGender(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <button
            type="submit"
            style={{
              ...buttonStyle,
              opacity: loading ? 0.6 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Form Data to DB"}
          </button>
        </form>

        {formMsg && (
          <p
            style={{
              marginTop: 12,
              color: formMsg.toLowerCase().includes("success") ? "green" : "red",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {formMsg}
          </p>
        )}

        <button
          onClick={onLogout}
          style={{ ...buttonStyle, background: "#f44336", color: "#fff", marginTop: 20 }}
        >
          Logout
        </button>

        <button
          onClick={handleFetchAll}
          style={{ ...buttonStyle, background: "#007bff", color: "#fff", marginTop: 10 }}
        >
          Fetch All Stored Reports (Check Console)
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// ---------- MAIN APP (Login/Register/Logout) ----------
// -------------------------------------------------------------------------------------------------
const App = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false); 
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const endpoint = isRegistering ? "/register" : "/login";
    setMessage(isRegistering ? "Registering user..." : "Checking credentials...");

    try {
      console.log(`📡 Sending POST to: ${API_BASE_URL}${endpoint}`); 
      
      const res = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      console.log(`📥 ${isRegistering ? 'Register' : 'Login'} Response:`, res);
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || (isRegistering ? "Registration failed" : "Login failed"));

      console.log(`✅ ${isRegistering ? 'Register' : 'Login'} Success:`, data);
      
      if (isRegistering) {
          setMessage("✅ Registration successful! Please log in.");
          setIsRegistering(false); 
          setPassword("");
      } else {
          setMessage(data.message);
          if ((data.message || "").toLowerCase().includes("success")) {
              setTimeout(() => setLoggedIn(true), 400); // Redirect to Home Page
          }
      }
    } catch (err) {
      console.error(`❌ ${isRegistering ? 'Register' : 'Login'} Error:`, err);
      
      let errorMsg = String(err.message);
      if (errorMsg.includes('Failed to fetch')) {
        errorMsg = `Network Error: Could not connect to backend at ${API_BASE_URL}. Please check your Render deployment status.`;
      } else {
        errorMsg = "Submission error: " + errorMsg;
      }
      setMessage("❌ " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setEmail("");
    setPassword("");
    setMessage("");
    setIsRegistering(false); 
  };

  if (loggedIn) return <HomePage email={email} onLogout={handleLogout} />;

  return (
    <div style={outerContainer}>
      <div style={loginContainer}>
        
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto' }}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>

          <h2 style={{ margin: "8px 0 0", color: "#333" }}>{isRegistering ? "Register New User" : "Login"}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Email</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
            required
          />

          <label style={labelStyle}>Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="password"
            required
          />

          <button
            type="submit"
            style={{
              ...buttonStyle,
              opacity: loading ? 0.6 : 1,
              pointerEvents: loading ? "none" : "auto",
              background: isRegistering ? "#007bff" : "#4dd0a9",
            }}
            disabled={loading}
          >
            {loading 
                ? (isRegistering ? "Registering..." : "Logging in...") 
                : (isRegistering ? "Register" : "Login")
            }
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: 12,
              color: message.toLowerCase().includes("success") ? "green" : "red",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        )}
        
        {/* Toggle Button for Register/Login */}
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setMessage(""); 
            setEmail(""); 
            setPassword("");
          }}
          style={{
            ...buttonStyle,
            background: isRegistering ? "#5cb85c" : "#007bff", 
            marginTop: 15,
            fontSize: 14,
          }}
        >
          {isRegistering ? "Already have an account? Go to Login" : "Need an account? Go to Register"}
        </button>

      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// ---------- STYLES ----------
// -------------------------------------------------------------------------------------------------
const outerContainer = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)",
  padding: 20,
};

const loginContainer = {
  background: "#fff",
  borderRadius: 12,
  padding: 28,
  boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
  width: "100%",
  maxWidth: 420,
};

const formContainer = {
  background: "#fff",
  borderRadius: 12,
  padding: 28,
  boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
  width: "100%",
  maxWidth: 480,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 12,
  fontSize: 15,
  outline: "none",
  boxSizing: 'border-box'
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  color: "#333",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: 8,
  background: "#4dd0a9",
  color: "#012",
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 6,
  transition: 'background 0.2s'
};


export default App;
