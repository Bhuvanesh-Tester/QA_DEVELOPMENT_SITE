// frontend/src/login.js

const getApiBaseUrl = () => {
  return window.location.hostname === "localhost"
    ? "http://localhost:8003"
    : "https://qa-development-site.onrender.com"; // Your Render backend URL
};

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const handleLoginResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }
  return response.json();
};

const handleLoginError = (error) => {
  if (error.name === "TypeError") return "Network error or server not reachable";
  return error.message || "Unexpected error";
};

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

    const data = await handleLoginResponse(response);
    console.log("✅ Login successful:", data);
    return { success: true, message: data.message, email: data.user.email };
  } catch (error) {
    console.error("❌ Login error:", error);
    throw new Error(handleLoginError(error));
  }
};