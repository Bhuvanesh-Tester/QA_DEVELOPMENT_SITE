import React, { useState } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();
  setMessage("Checking credentials...");

  try {
    const response = await fetch("https://qa-development-site.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    setMessage(data.message);
  } catch (error) {
    setMessage("Error connecting to server: " + error.message);
  }
 };


  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%)",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          padding: "40px 32px",
          width: "100%",
          maxWidth: "370px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <img
            src="https://img.icons8.com/fluency/96/000000/user-male-circle.png"
            alt="login icon"
            style={{ width: "64px", marginBottom: "8px" }}
          />
          <h2 style={{ margin: 0, color: "#333", fontWeight: 700, fontSize: "2rem" }}>Login</h2>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "18px", textAlign: "left" }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: "6px", color: "#555", fontWeight: 500 }}>Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
              required
            />
          </div>
          <div style={{ marginBottom: "22px", textAlign: "left" }}>
            <label htmlFor="password" style={{ display: "block", marginBottom: "6px", color: "#555", fontWeight: 500 }}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              background: "#74ebd5",
              color: "#222",
              fontWeight: 700,
              fontSize: "1.1rem",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Login
          </button>
        </form>
        {message && (
          <p style={{ marginTop: "18px", color: message.includes("success") ? "#22bb33" : "#e74c3c", fontWeight: 500 }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
