// frontend/src/login.js

/**
 * Determine API base URL based on environment
 */
const getApiBaseUrl = () => {
  return window.location.hostname === "localhost"
    ? "http://localhost:8003"
    : "https://qa-development-site.onrender.com";
};

/**
 * Simple email validation
 */
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Request failed");
  }
  return response.json();
};

/**
 * Handle fetch errors
 */
const handleError = (error) => {
  if (error.name === "TypeError") return "Network error or server not reachable";
  return error.message || "Unexpected error";
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  const apiBaseUrl = getApiBaseUrl();
  console.log("🌐 API Base URL:", apiBaseUrl);
  console.log("➡️ Final login URL:", `${apiBaseUrl}/login`);

  if (!email || !password) throw new Error("Email and password are required");
  if (!isValidEmail(email)) throw new Error("Invalid email format");

  try {
    const response = await fetch(`${apiBaseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
      mode: "cors",
    });

    const data = await handleResponse(response);
    console.log("✅ Login successful:", data);

    // ✅ FIXED LINE: return the full user object instead of just the email
    return { success: true, message: data.message, user: data.user };

  } catch (error) {
    console.error("❌ Login error:", error);
    throw new Error(handleError(error));
  }
};

/**
 * Register new user
 */
export const registerUser = async (name, email, password) => {
  const apiBaseUrl = getApiBaseUrl();
  console.log("🌐 API Base URL:", apiBaseUrl);
  console.log("➡️ Final register URL:", `${apiBaseUrl}/register`);

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }
  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  try {
    const response = await fetch(`${apiBaseUrl}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, email, password }),
      mode: "cors",
    });

    const data = await handleResponse(response);
    console.log("✅ Registration successful:", data);
    return { success: true, message: data.message, user: data.user };
  } catch (error) {
    console.error("❌ Registration error:", error);
    throw new Error(handleError(error));
  }
};
