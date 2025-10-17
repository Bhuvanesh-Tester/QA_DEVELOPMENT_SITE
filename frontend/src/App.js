import React, { useState } from "react";

// ---------- CHILD COMPONENT ----------
function HomePage({ email, onLogout }) {
  const [personName, setPersonName] = useState("");
  const [personEmail, setPersonEmail] = useState(email || "");
  const [personPhone, setPersonPhone] = useState("");
  const [personGender, setPersonGender] = useState("");
  const [formMsg, setFormMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMsg("Submitting...");

    if (!personName || !personEmail || !personPhone || !personGender) {
      setFormMsg("All fields are required.");
      return;
    }

    try {
      const res = await fetch("https://qa-development-site.onrender.com/submit-form", {
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
      setFormMsg(data.message || "Submitted successfully!");

      if ((data.message || "").toLowerCase().includes("success")) {
        setPersonName("");
        setPersonPhone("");
        setPersonGender("");
      }
    } catch (err) {
      setFormMsg("Error submitting form: " + err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ACB6E5 0%, #74ebd5 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
          width: "100%",
          maxWidth: 480,
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 20, color: "#333" }}>
          Person Details
        </h2>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Name</label>
          <input
            name="name"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Full name"
            style={inputStyle}
            required
            autoComplete="name"
          />

          <label style={labelStyle}>Email (prefilled)</label>
          <input
            name="email"
            type="email"
            value={personEmail}
            onChange={(e) => setPersonEmail(e.target.value)}
            placeholder="Email"
            style={{ ...inputStyle, background: "#fbfbfb" }}
            required
            autoComplete="email"
          />

          <label style={labelStyle}>Phone</label>
          <input
            name="phone"
            value={personPhone}
            onChange={(e) => setPersonPhone(e.target.value)}
            placeholder="Phone number"
            style={inputStyle}
            required
            inputMode="tel"
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

          <button type="submit" style={buttonStyle}>
            Submit
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
          style={{ ...buttonStyle, background: "#f66", color: "#fff", marginTop: 20 }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

// ---------- MAIN APP COMPONENT ----------
function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("Checking credentials...");

    try {
      const res = await fetch("https://qa-development-site.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setMessage(data.message);

      if (data.message === "Login successful!") {
        setTimeout(() => setLoggedIn(true), 300);
      }
    } catch (err) {
      setMessage("Error connecting to server: " + err.message);
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 28,
          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
          width: "100%",
          maxWidth: 420,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <img
            src="https://img.icons8.com/fluency/96/000000/user-male-circle.png"
            alt="user"
            style={{ width: 64 }}
          />
          <h2 style={{ margin: "8px 0 0", color: "#333" }}>Login</h2>
        </div>

        <form onSubmit={handleLogin}>
          <label style={labelStyle}>Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <label style={labelStyle}>Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="password"
            required
            autoComplete="current-password"
          />

          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: 12,
              color: message.includes("success") ? "green" : "red",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------- STYLES ----------
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  marginBottom: 12,
  boxSizing: "border-box",
  outline: "none",
  fontSize: 15,
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
