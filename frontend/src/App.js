import React, { useState } from "react";
import { loginUser } from "./login";
import Home from "./home";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const API_BASE_URL = "http://localhost:8003";

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const user = await loginUser(email, password, API_BASE_URL);
      setIsLoggedIn(true);
      setUserEmail(user.email);
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
    setEmail("");
    setPassword("");
    setMessage("");
  };

  if (isLoggedIn) {
    return <Home email={userEmail} onLogout={handleLogout} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.animatedBackground}></div>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
        {message && <p style={styles.error}>{message}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  animatedBackground: {
    position: "absolute",
    width: "200%",
    height: "200%",
    background: "linear-gradient(270deg, #00aaff, #0047b3, #00ffea, #0047b3)",
    backgroundSize: "800% 800%",
    animation: "gradientAnimation 15s ease infinite",
    zIndex: 0,
  },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(255, 255, 255, 0.15)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "50px",
    minWidth: "350px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
    textAlign: "center",
    color: "#fff",
  },
  title: {
    marginBottom: "30px",
    fontSize: "28px",
    fontWeight: "600",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "14px",
    margin: "12px 0",
    borderRadius: "8px",
    border: "none",
    outline: "none",
    fontSize: "16px",
  },
  button: {
    padding: "14px",
    marginTop: "20px",
    backgroundColor: "#00aaff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s",
  },
  error: {
    color: "#ff6b6b",
    marginTop: "15px",
  },
};

// Add keyframes for gradient animation
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes gradientAnimation {
  0%{background-position:0% 50%}
  50%{background-position:100% 50%}
  100%{background-position:0% 50%}
}`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default App;
