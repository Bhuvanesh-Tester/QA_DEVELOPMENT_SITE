// frontend/src/login.js

/**
 * Simple email validation (frontend-side)
 */
const isValidEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

/**
 * Handle API response from backend
 */
const handleLoginResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login failed");
  }
  return response.json();
};

/**
 * Handle fetch or logic errors gracefully
 */
const handleLoginError = (error) => {
  if (error.name === "TypeError") {
    return "Network error or server not reachable";
  }
  return error.message || "Unexpected error";
};

/**
 * Attempts to log in a user
 */
export const loginUser = async (email, password, apiBaseUrl) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  if (!isValidEmail(email)) {
    throw new Error("Invalid email format");
  }

  console.log("Attempting login for user:", email);

  try {
    const response = await fetch(`${apiBaseUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      mode: "cors",
    });

    console.log("Login response status:", response.status);

    const data = await handleLoginResponse(response);
    console.log("Login response data:", data);

    return {
      success: true,
      message: data.message || "Login successful",
      email: email,
    };
  } catch (error) {
    const errorMessage = handleLoginError(error);
    console.error("Login error:", errorMessage);
    throw new Error(errorMessage);
  }
};
