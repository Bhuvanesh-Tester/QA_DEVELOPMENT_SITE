import React, { useState, useEffect } from "react";
import { loginUser } from "./login";
import Home from "./home";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  });
  
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("user");
    }
  }, [isLoggedIn, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await loginUser(email, password);
      setIsLoggedIn(true);
      setUser(response.user);
      setMessage("");
      showToast(`Welcome ${response.user.name}! (${response.user.role})`, "success");
    } catch (error) {
      setMessage(error.message);
      showToast(error.message, "error");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setEmail("");
    setPassword("");
    setMessage("");
    sessionStorage.clear();
    showToast("Logged out successfully! 👋", "info");
  };

  // All roles use the same Home component but with different access
  if (isLoggedIn && user) {
    return <Home user={user} onLogout={handleLogout} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.animatedBackground}></div>
      <div style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logo}>🔐</div>
          <h2 style={styles.title}>Compliance Audit System</h2>
          <p style={styles.subtitle}>ISO Standards & Control Checks</p>
        </div>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email Address"
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
            Sign In
          </button>
        </form>
        
        {message && <p style={styles.message}>{message}</p>}
        
        <div style={styles.infoBox}>
          <p style={styles.infoTitle}>Test Credentials:</p>
          <p style={styles.infoText}>
            <strong>Admin:</strong> admin@system.com / Admin@123<br/>
            <strong>Supervisor:</strong> supervisor@test.com / Super@123<br/>
            <strong>QA/QC:</strong> qa@test.com / QA@123
          </p>
        </div>
      </div>

      {toast.show && (
        <div style={{
          ...styles.toast,
          ...(toast.type === 'success' ? styles.toastSuccess : 
              toast.type === 'error' ? styles.toastError : styles.toastInfo)
        }}>
          <span style={styles.toastIcon}>
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
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
    background: "linear-gradient(270deg, #667eea, #764ba2, #667eea, #764ba2)",
    backgroundSize: "800% 800%",
    animation: "gradientAnimation 15s ease infinite",
    zIndex: 0,
  },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "50px",
    minWidth: "420px",
    maxWidth: "500px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    textAlign: "center",
  },
  logoContainer: {
    marginBottom: "30px",
  },
  logo: {
    fontSize: "64px",
    marginBottom: "10px",
  },
  title: {
    marginBottom: "8px",
    fontSize: "28px",
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    fontSize: "14px",
    color: "#667eea",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "30px",
  },
  input: {
    padding: "16px",
    borderRadius: "10px",
    border: "2px solid #e0e0e0",
    outline: "none",
    fontSize: "16px",
    transition: "all 0.3s",
    backgroundColor: "white",
  },
  button: {
    padding: "16px",
    marginTop: "10px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  },
  message: {
    color: "#dc3545",
    marginTop: "15px",
    fontSize: "14px",
    fontWeight: "500",
  },
  infoBox: {
    marginTop: "30px",
    padding: "20px",
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: "12px",
    textAlign: "left",
  },
  infoTitle: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#667eea",
    marginBottom: "10px",
    textTransform: "uppercase",
  },
  infoText: {
    fontSize: "13px",
    color: "#555",
    lineHeight: "1.8",
    margin: 0,
  },
  toast: {
    position: "fixed",
    top: "30px",
    right: "30px",
    minWidth: "300px",
    padding: "16px 24px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    zIndex: 1000,
    animation: "slideIn 0.3s ease-out",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
    fontWeight: "600",
    color: "white",
  },
  toastSuccess: {
    background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
  },
  toastError: {
    background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
  },
  toastInfo: {
    background: "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
  },
  toastIcon: {
    fontSize: "24px",
  },
};

const styleSheet = document.styleSheets[0];
if (styleSheet) {
  const keyframes = `
  @keyframes gradientAnimation {
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
  }
  @keyframes slideIn {
    from {transform: translateX(400px); opacity: 0;}
    to {transform: translateX(0); opacity: 1;}
  }`;
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {}
}

export default App;