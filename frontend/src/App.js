import React, { useState } from "react";

// ---------- API BASE URL ----------
const API_BASE_URL = "http://127.0.0.1:8000"; // Local FastAPI backend

// ---------- HOME PAGE ----------
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
      const res = await fetch(`${API_BASE_URL}/submit-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: personName,
          email: personEmail,
          phone: personPhone,
          gender: personGender,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unknown error");

      setFormMsg(data.message || "✅ Submitted successfully!");
      if ((data.message || "").toLowerCase().includes("success")) {
        setPersonName("");
        setPersonPhone("");
        setPersonGender("");
      }
    } catch (err) {
      setFormMsg("❌ Submission error: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAll = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/all-users`);
      const data = await res.json();
      alert(`Total users found: ${data.data?.length || 0}`);
      console.log("All users:", data);
    } catch (err) {
      alert("Error fetching users: " + err.message);
    }
  };

  return (
    <div style={outerContainer}>
      <div style={formContainer}>
        <h2 style={{ textAlign: "center", marginBottom: 20 }}>Person Details Form</h2>
        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Enter full name"
            style={inputStyle}
            required
          />
          <label>Email</label>
          <input
            type="email"
            value={personEmail}
            onChange={(e) => setPersonEmail(e.target.value)}
            placeholder="Email address"
            style={{ ...inputStyle, background: "#fbfbfb" }}
            required
          />
          <label>Phone Number</label>
          <input
            value={personPhone}
            onChange={(e) => setPersonPhone(e.target.value)}
            placeholder="Phone number"
            style={inputStyle}
            required
          />
          <label>Gender</label>
          <select
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
          <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>

        {formMsg && <p style={{ color: formMsg.toLowerCase().includes("success") ? "green" : "red", textAlign: "center" }}>{formMsg}</p>}

        <button onClick={onLogout} style={{ ...buttonStyle, background: "#f44336", color: "#fff", marginTop: 20 }}>Logout</button>
        <button onClick={handleFetchAll} style={{ ...buttonStyle, background: "#007bff", color: "#fff", marginTop: 10 }}>Fetch All Users</button>
      </div>
    </div>
  );
}

// ---------- MAIN APP ----------
function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("Checking credentials...");

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");

      setMessage(data.message);
      if ((data.message || "").toLowerCase().includes("success")) setLoggedIn(true);
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setEmail("");
    setPassword("");
    setMessage("");
  };

  if (loggedIn) return <HomePage email={email} onLogout={handleLogout} />;

  return (
    <div style={outerContainer}>
      <div style={loginContainer}>
        <h2 style={{ textAlign: "center", marginBottom: 14 }}>Login</h2>
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} placeholder="you@example.com" required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} placeholder="password" required />
          <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {message && <p style={{ color: message.toLowerCase().includes("success") ? "green" : "red", textAlign: "center" }}>{message}</p>}
      </div>
    </div>
  );
}

// ---------- STYLES ----------
const outerContainer = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)", padding: 20 };
const loginContainer = { background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", width: "100%", maxWidth: 420 };
const formContainer = { background: "#fff", borderRadius: 12, padding: 28, boxShadow: "0 6px 24px rgba(0,0,0,0.12)", width: "100%", maxWidth: 480 };
const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", marginBottom: 12, fontSize: 15, outline: "none" };
const buttonStyle = { width: "100%", padding: "12px", borderRadius: 8, background: "#4dd0a9", color: "#012", border: "none", fontWeight: 700, cursor: "pointer", marginTop: 6 };

export default App;
