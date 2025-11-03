import React, { useState, useEffect } from "react";
import { loginUser, registerUser } from "./login";
import Home from "./home";

function App() {
  // Check sessionStorage on initial load
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("isLoggedIn") === "true";
  });
  
  const [userEmail, setUserEmail] = useState(() => {
    return sessionStorage.getItem("userEmail") || "";
  });
  
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const API_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:8003"
    : "https://qa-development-site.onrender.com";

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Save to sessionStorage whenever login state changes
  useEffect(() => {
    if (isLoggedIn) {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userEmail", userEmail);
    } else {
      sessionStorage.removeItem("isLoggedIn");
      sessionStorage.removeItem("userEmail");
    }
  }, [isLoggedIn, userEmail]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const user = await loginUser(email, password);
      setIsLoggedIn(true);
      setUserEmail(user.email);
      setMessage("");
      showToast("Login successful! Welcome back! 🎉", "success");
    } catch (error) {
      setMessage(error.message);
      showToast(error.message, "error");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name || !email || !password) {
      setMessage("Please fill in all fields");
      showToast("Please fill in all fields", "error");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    try {
      await registerUser(name, email, password);
      setMessage("Registration successful! Please login.");
      showToast("Registration successful! Please login 🎉", "success");
      
      // Switch to login mode after successful registration
      setTimeout(() => {
        setIsRegisterMode(false);
        setName("");
        setPassword("");
      }, 2000);
    } catch (error) {
      setMessage(error.message);
      showToast(error.message, "error");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
    setEmail("");
    setPassword("");
    setName("");
    setMessage("");
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userEmail");
    showToast("Logged out successfully! See you soon! 👋", "info");
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setMessage("");
    setEmail("");
    setPassword("");
    setName("");
  };

  if (isLoggedIn) {
    return <Home email={userEmail} onLogout={handleLogout} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.animatedBackground}></div>
      <div style={styles.card}>
        <h2 style={styles.title}>
          {isRegisterMode ? "Create Account" : "Welcome Back"}
        </h2>
        
        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} style={styles.form}>
          {isRegisterMode && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
          )}
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
            {isRegisterMode ? "Register" : "Login"}
          </button>
        </form>
        
        {message && <p style={styles.message}>{message}</p>}
        
        <div style={styles.toggleContainer}>
          <p style={styles.toggleText}>
            {isRegisterMode ? "Already have an account?" : "Don't have an account?"}
          </p>
          <button onClick={toggleMode} style={styles.toggleButton}>
            {isRegisterMode ? "Login here" : "Register here"}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
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
  message: {
    color: "#ffdd57",
    marginTop: "15px",
    fontSize: "14px",
  },
  toggleContainer: {
    marginTop: "20px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
  },
  toggleText: {
    color: "#fff",
    fontSize: "14px",
    marginBottom: "10px",
  },
  toggleButton: {
    background: "none",
    border: "2px solid #fff",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "0.3s",
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

// Add keyframes for animations
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  const keyframes = `
  @keyframes gradientAnimation {
    0%{background-position:0% 50%}
    50%{background-position:100% 50%}
    100%{background-position:0% 50%}
  }
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }`;
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Keyframes might already exist
  }
}

export default App;