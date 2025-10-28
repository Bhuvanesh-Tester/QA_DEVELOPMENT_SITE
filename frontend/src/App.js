import React, { useState } from "react";
import { loginUser } from "./login";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const API_BASE_URL = "http://localhost:8003"; // hardcoded for local use

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
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button type="submit" className="login-button">Login</button>
      </form>
      {message && <p className="error-message">{message}</p>}
    </div>
  );
}

export default App;
