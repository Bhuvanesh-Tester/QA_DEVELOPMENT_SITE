import React, { useState } from "react";

// NOTE: Vercel frontend is deployed (e.g., to "https://your-app-name.vercel.app")
// and the Render backend is deployed (e.g., to "https://qa-development-site.onrender.com")

// ---------- BASE API URL: Use Render's URL when deployed, or localhost for local testing. ----------
const API_BASE_URL =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://qa-development-site.onrender.com"; // Your deployed backend URL

console.log("🔗 API Base URL:", API_BASE_URL);

// -------------------------------------------------------------------------------------------------
// ---------- HOME PAGE (Form Submission) ----------
// -------------------------------------------------------------------------------------------------
function HomePage({ email, onLogout }) {
  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState(email || "");
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
      console.log("📡 Sending POST to:", `${API_BASE_URL}/submit-form`);
      const res = await fetch(`${API_BASE_URL}/submit-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({
          name: personName,
          email: personEmail,
          phone: personPhone,
          gender: personGender,
        }),
      });

      console.log("📥 Response:", res);
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Unknown error");

      console.log("✅ Form submission response:", data);
      setFormMsg(data.message || "✅ Submitted successfully!");

      if ((data.message || "").toLowerCase().includes("success")) {
        setPersonName("");
        setPersonPhone("");
        setPersonGender("");
      }
    } catch (err) {
      console.error("❌ Error submitting form:", err);
      setFormMsg("❌ Submission error: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Optional Debug Button
  const handleFetchAll = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/all-users`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      console.log("👥 All users:", data);
      alert(`Total users found: ${data.data?.length || 0}`);
    } catch (err) {
      alert("Error fetching users: " + err.message);
      console.error("❌ Fetch All Error:", err);
    }
  };

  return (
    <div style={outerContainer}>
      <div style={formContainer}>
        <h2 style={{ textAlign: "center", marginBottom: 20, color: "#333" }}>
          Person Details Form
        </h2>

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

          <label style={labelStyle}>Email</label>
          <input
            name="email"
            type="email"
            value={personEmail}
            onChange={(e) => setPersonEmail(e.target.value)}
            placeholder="Email address"
            style={{ ...inputStyle, background: "#fbfbfb" }}
            required
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
            {loading ? "Submitting..." : "Submit"}
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
          Fetch All Users (Console)
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// ---------- MAIN APP (Login/Register/Logout) ----------
// -------------------------------------------------------------------------------------------------
function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // NEW STATE: To switch between Login and Register views
  const [isRegistering, setIsRegistering] = useState(false); 
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to handle both Login and Register form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Determine the API endpoint based on the view
    const endpoint = isRegistering ? "/register" : "/login";
    setMessage(isRegistering ? "Registering user..." : "Checking credentials...");

    try {
      console.log(`📡 Sending POST to: ${API_BASE_URL}${endpoint}`);
      
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
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
          // If successful registration, switch to Login view
          setMessage("✅ Registration successful! Please log in.");
          setIsRegistering(false); 
          setPassword(""); // Clear password field
      } else {
          // If successful login, set loggedIn state
          setMessage(data.message);
          if ((data.message || "").toLowerCase().includes("success")) {
              setTimeout(() => setLoggedIn(true), 400);
          }
      }
    } catch (err) {
      console.error(`❌ ${isRegistering ? 'Register' : 'Login'} Error:`, err);
      // Clean up the error message for display
      const errorMsg = String(err.message).replace('Failed to fetch', 'Failed to connect to backend.');
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
    setIsRegistering(false); // Reset to login view on logout
  };

  if (loggedIn) return <HomePage email={email} onLogout={handleLogout} />;

  return (
    <div style={outerContainer}>
      <div style={loginContainer}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <img
            src="https://img.icons8.com/fluency/96/000000/user-male-circle.png"
            alt="user"
            style={{ width: 64 }}
          />
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
            setMessage(""); // Clear message on switch
            setEmail(""); // Clear fields on switch
            setPassword("");
          }}
          style={{
            ...buttonStyle,
            background: isRegistering ? "#007bff" : "#5cb85c", // Different color to distinguish
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
// ---------- STYLES (Kept as is) ----------
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
};

export default App;