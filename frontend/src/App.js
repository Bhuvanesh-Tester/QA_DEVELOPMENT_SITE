import React, { useState } from "react";
import { loginUser } from "./login";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const API_BASE_URL = "http://localhost:8001"; // your FastAPI backend URL

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const user = await loginUser(email, password, API_BASE_URL);
      console.log("Login successful, user:", user);
      setMessage(`Welcome, ${user.email}`);
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", fontFamily: "Arial" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button type="submit" style={{ width: "100%", padding: "10px" }}>
          Login
        </button>
      </form>
      <p style={{ marginTop: "10px", color: "red" }}>{message}</p>
    </div>
  );
}

export default App;
